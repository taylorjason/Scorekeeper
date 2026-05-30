import { db } from './db';
import { computeRoundDurations } from './utils';
import type { Player, Game, GameNight, ScoreEntry } from './types';

// ── Core row type ────────────────────────────────────────────────────────────

export interface StatRow {
  entryId: number;
  playerId: number;     playerName: string;   playerColor: string;
  matchId: number;      gameId: number;        gameName: string;
  scoringMode: string;
  nightId: number;      nightDate: string;     // YYYY-MM-DD
  roundNumber: number;  value: number;         note?: string;
  entryCreatedAt: number;
  // match-level
  matchIndexInNight: number;   // 0 = first match of the night
  playerCount: number;
  matchPlayerIds: number[];
  isFirstOut: boolean;
  isWinner: boolean;
  roundDuration?: number;      // ms
  // date-derived
  dayOfWeek: number;   // 0 = Sun … 6 = Sat
  month: number;       // 1–12
  year: number;
  quarter: number;     // 1–4
}

// ── Query types ──────────────────────────────────────────────────────────────

export type MetricFn   = 'count' | 'sum' | 'avg' | 'min' | 'max';
export type FieldKey   = 'value' | 'roundDuration' | 'isFirstOut' | 'isWin';
export type GroupKey   = 'player' | 'game' | 'month' | 'dayOfWeek' | 'none';
export type OperatorKey = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'includes' | 'excludes';
export type FieldType  = 'number' | 'enum' | 'boolean' | 'player-set' | 'date';

export interface ActiveCondition {
  id: string;
  fieldKey: string;
  operator: OperatorKey;
  value: string | number | boolean;
}

export interface StatQuery {
  metric: MetricFn;
  field: FieldKey;
  groupBy: GroupKey;
  conditions: ActiveCondition[];
}

export interface StatResult {
  label: string;
  value: number;
  color?: string;
  sampleSize: number;
}

// ── Field registry ────────────────────────────────────────────────────────────

export interface FilterFieldDef {
  key: string;
  label: string;
  type: FieldType;
  operators: OperatorKey[];
  options?: { label: string; value: string | number }[];
  extract: (row: StatRow) => string | number | boolean | number[];
}

export interface CustomFieldDef {
  id: string;
  key: string;
  label: string;
  type: 'number' | 'boolean';
  expression: string;  // JS expression with `row` in scope
}

export interface CompiledField {
  key: string;
  label: string;
  type: FieldType;
  operators: OperatorKey[];
  options?: { label: string; value: string | number }[];
  extract: (row: StatRow) => unknown;
  custom: boolean;
}

export interface FieldConfig {
  builtinEnabled: Record<string, boolean>;
  builtinOrder: string[];
  customFields: CustomFieldDef[];
}

// ── Operator display labels ───────────────────────────────────────────────────

export const OPERATOR_LABELS: Record<OperatorKey, string> = {
  eq:       '=',
  neq:      '≠',
  gt:       '>',
  gte:      '≥',
  lt:       '<',
  lte:      '≤',
  includes: 'includes',
  excludes: 'excludes',
};

// ── Built-in field registry ───────────────────────────────────────────────────

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const BUILTIN_FIELDS: FilterFieldDef[] = [
  {
    key: 'playerInMatch',
    label: 'Player in Match',
    type: 'player-set',
    operators: ['includes', 'excludes'],
    extract: r => r.matchPlayerIds,
  },
  {
    key: 'gameId',
    label: 'Game',
    type: 'enum',
    operators: ['eq', 'neq'],
    extract: r => r.gameId,
  },
  {
    key: 'playerId',
    label: 'Player (row)',
    type: 'enum',
    operators: ['eq', 'neq'],
    extract: r => r.playerId,
  },
  {
    key: 'playerCount',
    label: 'Player Count',
    type: 'number',
    operators: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte'],
    extract: r => r.playerCount,
  },
  {
    key: 'matchIndexInNight',
    label: 'Match # in Night',
    type: 'number',
    operators: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte'],
    extract: r => r.matchIndexInNight,
  },
  {
    key: 'dayOfWeek',
    label: 'Day of Week',
    type: 'enum',
    operators: ['eq', 'neq'],
    options: DAY_NAMES.map((d, i) => ({ label: d, value: i })),
    extract: r => r.dayOfWeek,
  },
  {
    key: 'month',
    label: 'Month',
    type: 'enum',
    operators: ['eq', 'neq'],
    options: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
      .map((m, i) => ({ label: m, value: i + 1 })),
    extract: r => r.month,
  },
  {
    key: 'year',
    label: 'Year',
    type: 'number',
    operators: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte'],
    extract: r => r.year,
  },
  {
    key: 'quarter',
    label: 'Quarter',
    type: 'enum',
    operators: ['eq', 'neq'],
    options: [1, 2, 3, 4].map(q => ({ label: `Q${q}`, value: q })),
    extract: r => r.quarter,
  },
  {
    key: 'nightDate',
    label: 'Date',
    type: 'date',
    operators: ['gte', 'lte'],
    extract: r => r.nightDate,
  },
  {
    key: 'scoringMode',
    label: 'Scoring Mode',
    type: 'enum',
    operators: ['eq', 'neq'],
    options: [
      { label: 'High Score',    value: 'high' },
      { label: 'Low Score',     value: 'low' },
      { label: 'Rounds',        value: 'rounds' },
      { label: 'Finish Order',  value: 'finish-order' },
      { label: 'Phase 10',      value: 'phase10' },
      { label: 'Custom',        value: 'custom' },
    ],
    extract: r => r.scoringMode,
  },
  {
    key: 'roundNumber',
    label: 'Round Number',
    type: 'number',
    operators: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte'],
    extract: r => r.roundNumber,
  },
  {
    key: 'isWinner',
    label: 'Is Winner',
    type: 'boolean',
    operators: ['eq'],
    extract: r => r.isWinner,
  },
  {
    key: 'isFirstOut',
    label: 'Is First Out',
    type: 'boolean',
    operators: ['eq'],
    extract: r => r.isFirstOut,
  },
];

// ── Field config storage ──────────────────────────────────────────────────────

const CONFIG_KEY = 'scorekeeper_stat_fields';

export function loadFieldConfig(): FieldConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<FieldConfig>;
      // Merge: any newly added built-in fields get enabled by default
      const enabled = parsed.builtinEnabled ?? {};
      for (const f of BUILTIN_FIELDS) {
        if (!(f.key in enabled)) enabled[f.key] = true;
      }
      const order = parsed.builtinOrder ?? BUILTIN_FIELDS.map(f => f.key);
      // Add any new built-in keys not yet in the saved order
      for (const f of BUILTIN_FIELDS) {
        if (!order.includes(f.key)) order.push(f.key);
      }
      return { builtinEnabled: enabled, builtinOrder: order, customFields: parsed.customFields ?? [] };
    }
  } catch { /* ignore */ }
  return {
    builtinEnabled: Object.fromEntries(BUILTIN_FIELDS.map(f => [f.key, true])),
    builtinOrder: BUILTIN_FIELDS.map(f => f.key),
    customFields: [],
  };
}

export function saveFieldConfig(config: FieldConfig): void {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

function compileExpression(expr: string): (row: StatRow) => unknown {
  try {
    // eslint-disable-next-line no-new-func
    return new Function('row', `"use strict"; return (${expr});`) as (row: StatRow) => unknown;
  } catch {
    return () => undefined;
  }
}

export function getActiveFields(config: FieldConfig): CompiledField[] {
  const builtins = config.builtinOrder
    .filter(k => config.builtinEnabled[k] !== false)
    .map(k => BUILTIN_FIELDS.find(f => f.key === k))
    .filter((f): f is FilterFieldDef => f !== undefined)
    .map(f => ({ ...f, custom: false }));

  const customs: CompiledField[] = config.customFields.map(cf => ({
    key: cf.key,
    label: cf.label,
    type: cf.type as FieldType,
    operators: cf.type === 'boolean'
      ? (['eq'] as OperatorKey[])
      : (['eq', 'neq', 'gt', 'gte', 'lt', 'lte'] as OperatorKey[]),
    extract: compileExpression(cf.expression),
    custom: true,
  }));

  return [...builtins, ...customs];
}

export function newConditionId(): string {
  return `c-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// ── Fact table builder ────────────────────────────────────────────────────────

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

  // Batch-load all entries
  const matchIds = matches.map(m => m.id!);
  const allEntries: ScoreEntry[] = matchIds.length > 0
    ? await db.scoreEntries.where('matchId').anyOf(matchIds).toArray()
    : [];

  const entriesByMatch = new Map<number, ScoreEntry[]>();
  for (const e of allEntries) {
    const arr = entriesByMatch.get(e.matchId) ?? [];
    arr.push(e);
    entriesByMatch.set(e.matchId, arr);
  }

  // Match index within each night (sorted by createdAt)
  const nightMatchOrder = new Map<number, number[]>(); // nightId -> ordered matchIds
  for (const m of [...matches].sort((a, b) => a.createdAt - b.createdAt)) {
    const arr = nightMatchOrder.get(m.gameNightId) ?? [];
    arr.push(m.id!);
    nightMatchOrder.set(m.gameNightId, arr);
  }

  const rows: StatRow[] = [];

  for (const match of matches) {
    const game  = gameMap.get(match.gameId);
    const night = nightMap.get(match.gameNightId);
    if (!game || !night) continue;

    const entries   = entriesByMatch.get(match.id!) ?? [];
    const durations = computeRoundDurations(entries, match.createdAt);

    const nightOrder = nightMatchOrder.get(match.gameNightId) ?? [];
    const matchIndexInNight = nightOrder.indexOf(match.id!);

    const date    = new Date(night.date + 'T00:00:00');
    const dayOfWeek = date.getDay();
    const month     = date.getMonth() + 1;
    const year      = date.getFullYear();
    const quarter   = Math.ceil(month / 3);

    for (const entry of entries) {
      const player = playerMap.get(entry.playerId);
      if (!player) continue;

      let isFirstOut = entry.note === 'first_out';
      if (!isFirstOut && entry.note) {
        try { isFirstOut = !!(JSON.parse(entry.note) as { firstOut?: boolean }).firstOut; }
        catch { /* not JSON */ }
      }

      rows.push({
        entryId: entry.id!,
        playerId: entry.playerId,   playerName: player.displayName,  playerColor: player.color,
        matchId: match.id!,         gameId: match.gameId,            gameName: game.name,
        scoringMode: game.scoringMode,
        nightId: match.gameNightId, nightDate: night.date,
        roundNumber: entry.roundNumber,
        value: entry.value,         note: entry.note,
        entryCreatedAt: entry.createdAt,
        matchIndexInNight,
        playerCount: match.playerIds.length,
        matchPlayerIds: match.playerIds,
        isFirstOut,
        isWinner: match.winnerId === entry.playerId,
        roundDuration: durations.get(entry.roundNumber),
        dayOfWeek, month, year, quarter,
      });
    }
  }

  return rows;
}

// ── Condition evaluation ──────────────────────────────────────────────────────

export function evaluateCondition(
  row: StatRow,
  cond: ActiveCondition,
  fieldDefs: CompiledField[],
): boolean {
  const def = fieldDefs.find(f => f.key === cond.fieldKey);
  if (!def) return true;

  const raw = def.extract(row);
  const cv  = cond.value;

  switch (cond.operator) {
    case 'eq':       return String(raw) === String(cv);
    case 'neq':      return String(raw) !== String(cv);
    case 'gt':       return Number(raw) > Number(cv);
    case 'gte':      return Number(raw) >= Number(cv);
    case 'lt':       return Number(raw) < Number(cv);
    case 'lte':      return Number(raw) <= Number(cv);
    case 'includes': return Array.isArray(raw) && raw.includes(Number(cv));
    case 'excludes': return Array.isArray(raw) && !raw.includes(Number(cv));
    default:         return true;
  }
}

// ── Query runner ──────────────────────────────────────────────────────────────

export function runQuery(
  rows: StatRow[],
  query: StatQuery,
  fieldDefs: CompiledField[] = getActiveFields(loadFieldConfig()),
): StatResult[] {
  // 1. Filter by conditions
  let filtered = rows.filter(r =>
    query.conditions.every(c => evaluateCondition(r, c, fieldDefs))
  );

  // 2. Deduplicate per-round rows for duration (avoid counting each player's copy)
  if (query.field === 'roundDuration') {
    const seen = new Set<string>();
    filtered = filtered.filter(r => {
      const key = `${r.matchId}:${r.roundNumber}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  // 3. Deduplicate per-match rows for isWin
  if (query.field === 'isWin') {
    const seen = new Set<string>();
    filtered = filtered.filter(r => {
      const key = `${r.matchId}:${r.playerId}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  // 4. Group and extract values
  type Acc = { label: string; color?: string; values: number[] };
  const groups = new Map<string, Acc>();

  for (const r of filtered) {
    let rawValue: number | undefined;
    switch (query.field) {
      case 'value':         rawValue = r.value; break;
      case 'roundDuration': rawValue = r.roundDuration; break;
      case 'isFirstOut':    rawValue = r.isFirstOut ? 1 : undefined; break;
      case 'isWin':         rawValue = r.isWinner   ? 1 : undefined; break;
    }
    if (rawValue === undefined) continue;

    let gkey: string; let label: string; let color: string | undefined;
    switch (query.groupBy) {
      case 'player':    gkey = String(r.playerId); label = r.playerName; color = r.playerColor; break;
      case 'game':      gkey = String(r.gameId);   label = r.gameName;   break;
      case 'month':     gkey = r.nightDate.slice(0, 7); label = gkey;    break;
      case 'dayOfWeek': gkey = String(r.dayOfWeek); label = DAY_NAMES[r.dayOfWeek]; break;
      default:          gkey = 'all'; label = 'All';
    }
    const acc = groups.get(gkey) ?? { label, color, values: [] };
    acc.values.push(rawValue);
    groups.set(gkey, acc);
  }

  // 5. Aggregate
  const results: StatResult[] = [];
  for (const [, acc] of groups) {
    const v = aggregate(acc.values, query.metric);
    if (v === undefined) continue;
    results.push({ label: acc.label, value: v, color: acc.color, sampleSize: acc.values.length });
  }

  // 6. Sort
  const asc = query.metric === 'min' || query.field === 'roundDuration';
  results.sort((a, b) => asc ? a.value - b.value : b.value - a.value);

  return results;
}

function aggregate(values: number[], metric: MetricFn): number | undefined {
  if (values.length === 0) return undefined;
  switch (metric) {
    case 'count': return values.length;
    case 'sum':   return values.reduce((a, b) => a + b, 0);
    case 'avg':   return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
    case 'min':   return Math.min(...values);
    case 'max':   return Math.max(...values);
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function dateFromPreset(preset: string): string {
  if (!preset) return '';
  const d = new Date();
  switch (preset) {
    case '30d': d.setDate(d.getDate() - 30); break;
    case '3mo': d.setMonth(d.getMonth() - 3); break;
    case '6mo': d.setMonth(d.getMonth() - 6); break;
    case '1yr': d.setFullYear(d.getFullYear() - 1); break;
    default:    return '';
  }
  return d.toISOString().slice(0, 10);
}

export function fieldLabel(field: FieldKey, metric: MetricFn): string {
  const fn: Record<FieldKey, string>  = { value: 'Round Score', roundDuration: 'Round Duration', isFirstOut: 'First-Out Events', isWin: 'Wins' };
  const mn: Record<MetricFn, string>  = { count: 'Count of', sum: 'Total', avg: 'Average', min: 'Shortest', max: 'Longest' };
  if (field === 'isFirstOut' || field === 'isWin') return metric === 'count' ? fn[field] : `${mn[metric]} ${fn[field]}`;
  return `${mn[metric]} ${fn[field]}`;
}
