import { db } from './db';
import { computeRoundDurations } from './utils';
import type { Player, Game, GameNight, ScoreEntry } from './types';

export interface StatRow {
  entryId: number;
  playerId: number;
  playerName: string;
  playerColor: string;
  matchId: number;
  gameId: number;
  gameName: string;
  nightId: number;
  nightDate: string;       // YYYY-MM-DD
  roundNumber: number;
  value: number;
  note?: string;
  entryCreatedAt: number;
  isFirstOut: boolean;
  isWinner: boolean;
  roundDuration?: number;  // ms; undefined when prev-round boundary is unavailable
}

export type MetricFn = 'count' | 'sum' | 'avg' | 'min' | 'max';
export type FieldKey  = 'value' | 'roundDuration' | 'isFirstOut' | 'isWin';
export type GroupKey  = 'player' | 'game' | 'month' | 'none';

export interface StatQuery {
  metric: MetricFn;
  field: FieldKey;
  filters: {
    playerIds: number[];
    gameIds:   number[];
    dateFrom:  string;     // YYYY-MM-DD or ''
  };
  groupBy: GroupKey;
}

export interface StatResult {
  label: string;
  value: number;
  color?: string;
  sampleSize: number;
}

// ─── Data loading ──────────────────────────────────────────────────────────────

export async function buildFactTable(): Promise<StatRow[]> {
  const [matches, players, games, nights] = await Promise.all([
    db.matches.where('status').equals('completed').toArray(),
    db.players.toArray(),
    db.games.toArray(),
    db.gameNights.toArray(),
  ]);

  const playerMap = new Map<number, Player>(players.map(p => [p.id!, p]));
  const gameMap   = new Map<number, Game>(games.map(g => [g.id!, g]));
  const nightMap  = new Map<number, GameNight>(nights.map(n => [n.id!, n]));

  // Load all entries for completed matches in one batch
  const matchIds = matches.map(m => m.id!);
  const allEntries: ScoreEntry[] = matchIds.length > 0
    ? await db.scoreEntries.where('matchId').anyOf(matchIds).toArray()
    : [];

  // Group entries by matchId
  const entriesByMatch = new Map<number, ScoreEntry[]>();
  for (const e of allEntries) {
    const arr = entriesByMatch.get(e.matchId) ?? [];
    arr.push(e);
    entriesByMatch.set(e.matchId, arr);
  }

  const rows: StatRow[] = [];

  for (const match of matches) {
    const game  = gameMap.get(match.gameId);
    const night = nightMap.get(match.gameNightId);
    if (!game || !night) continue;

    const entries = entriesByMatch.get(match.id!) ?? [];
    const durations = computeRoundDurations(entries, match.createdAt);

    for (const entry of entries) {
      const player = playerMap.get(entry.playerId);
      if (!player) continue;

      let isFirstOut = entry.note === 'first_out';
      if (!isFirstOut && entry.note) {
        try {
          const parsed = JSON.parse(entry.note) as { firstOut?: boolean };
          if (parsed.firstOut) isFirstOut = true;
        } catch { /* not JSON */ }
      }

      rows.push({
        entryId:        entry.id!,
        playerId:       entry.playerId,
        playerName:     player.displayName,
        playerColor:    player.color,
        matchId:        match.id!,
        gameId:         match.gameId,
        gameName:       game.name,
        nightId:        match.gameNightId,
        nightDate:      night.date,
        roundNumber:    entry.roundNumber,
        value:          entry.value,
        note:           entry.note,
        entryCreatedAt: entry.createdAt,
        isFirstOut,
        isWinner:       match.winnerId === entry.playerId,
        roundDuration:  durations.get(entry.roundNumber),
      });
    }
  }

  return rows;
}

// ─── Query execution ───────────────────────────────────────────────────────────

export function runQuery(rows: StatRow[], query: StatQuery): StatResult[] {
  // 1. Filter
  let filtered = rows;
  if (query.filters.playerIds.length > 0) {
    const set = new Set(query.filters.playerIds);
    filtered = filtered.filter(r => set.has(r.playerId));
  }
  if (query.filters.gameIds.length > 0) {
    const set = new Set(query.filters.gameIds);
    filtered = filtered.filter(r => set.has(r.gameId));
  }
  if (query.filters.dateFrom) {
    filtered = filtered.filter(r => r.nightDate >= query.filters.dateFrom);
  }

  // 2. For roundDuration: deduplicate to one row per (matchId, roundNumber)
  //    to avoid counting each player's copy of the same round.
  if (query.field === 'roundDuration') {
    const seen = new Set<string>();
    filtered = filtered.filter(r => {
      const key = `${r.matchId}:${r.roundNumber}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  // 3. For isWin: deduplicate to one row per (matchId, playerId)
  //    since each player has multiple entries per match.
  if (query.field === 'isWin') {
    const seen = new Set<string>();
    filtered = filtered.filter(r => {
      const key = `${r.matchId}:${r.playerId}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  // 4. Group rows
  type GroupAcc = { label: string; color?: string; values: number[] };
  const groupMap = new Map<string, GroupAcc>();

  const getGroupKey = (r: StatRow): { key: string; label: string; color?: string } => {
    switch (query.groupBy) {
      case 'player': return { key: String(r.playerId), label: r.playerName, color: r.playerColor };
      case 'game':   return { key: String(r.gameId),   label: r.gameName };
      case 'month':  return { key: r.nightDate.slice(0, 7), label: r.nightDate.slice(0, 7) };
      default:       return { key: 'all', label: 'All' };
    }
  };

  for (const r of filtered) {
    let rawValue: number | undefined;
    switch (query.field) {
      case 'value':        rawValue = r.value; break;
      case 'roundDuration': rawValue = r.roundDuration; break;
      case 'isFirstOut':   rawValue = r.isFirstOut ? 1 : undefined; break;
      case 'isWin':        rawValue = r.isWinner ? 1 : undefined; break;
    }
    if (rawValue === undefined) continue;

    const { key, label, color } = getGroupKey(r);
    const acc = groupMap.get(key) ?? { label, color, values: [] };
    acc.values.push(rawValue);
    groupMap.set(key, acc);
  }

  // 5. Aggregate
  const aggregate = (values: number[], metric: MetricFn): number => {
    if (values.length === 0) return 0;
    switch (metric) {
      case 'count': return values.length;
      case 'sum':   return values.reduce((a, b) => a + b, 0);
      case 'avg':   return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
      case 'min':   return Math.min(...values);
      case 'max':   return Math.max(...values);
    }
  };

  const results: StatResult[] = [];
  for (const [, acc] of groupMap.entries()) {
    results.push({
      label:      acc.label,
      value:      aggregate(acc.values, query.metric),
      color:      acc.color,
      sampleSize: acc.values.length,
    });
  }

  // 6. Sort: ascending for min/duration, descending for everything else
  const ascending = query.metric === 'min' || query.field === 'roundDuration';
  results.sort((a, b) => ascending ? a.value - b.value : b.value - a.value);

  return results;
}

// ─── Date range helpers ────────────────────────────────────────────────────────

export function dateFromPreset(preset: string): string {
  if (!preset) return '';
  const d = new Date();
  switch (preset) {
    case '30d':  d.setDate(d.getDate() - 30); break;
    case '3mo':  d.setMonth(d.getMonth() - 3); break;
    case '6mo':  d.setMonth(d.getMonth() - 6); break;
    case '1yr':  d.setFullYear(d.getFullYear() - 1); break;
    default:     return '';
  }
  return d.toISOString().slice(0, 10);
}

export function fieldLabel(field: FieldKey, metric: MetricFn): string {
  const fieldNames: Record<FieldKey, string> = {
    value:         'Round Score',
    roundDuration: 'Round Duration',
    isFirstOut:    'First-Out Events',
    isWin:         'Wins',
  };
  const metricNames: Record<MetricFn, string> = {
    count: 'Count of',
    sum:   'Total',
    avg:   'Average',
    min:   'Shortest',
    max:   'Longest',
  };
  if (field === 'isFirstOut' || field === 'isWin') {
    return metric === 'count'
      ? fieldNames[field]
      : `${metricNames[metric]} ${fieldNames[field]}`;
  }
  return `${metricNames[metric]} ${fieldNames[field]}`;
}
