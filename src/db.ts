import Dexie, { type Table } from 'dexie';
import type { Player, Game, GameNight, Match, ScoreEntry, StatSnapshot, AppData, CustomStatEntry, CustomField } from './types';

export class ScorekeeperDB extends Dexie {
  players!: Table<Player, number>;
  games!: Table<Game, number>;
  gameNights!: Table<GameNight, number>;
  matches!: Table<Match, number>;
  scoreEntries!: Table<ScoreEntry, number>;
  statSnapshots!: Table<StatSnapshot, number>;
  customStatEntries!: Table<CustomStatEntry, number>;

  constructor() {
    super('ScorekeeperDB');
    this.version(1).stores({
      players: '++id, displayName, active, createdAt',
      games: '++id, name, scoringMode, createdAt',
      gameNights: '++id, date, createdAt',
      matches: '++id, gameNightId, gameId, status, winnerId, createdAt',
      scoreEntries: '++id, matchId, playerId, roundNumber, createdAt',
      statSnapshots: '++id, playerId, gameId, lastPlayed',
    });
    this.version(2).stores({
      customStatEntries: '++id, matchId, gameId, fieldId, playerId, roundNumber, createdAt',
    });
  }
}

export const db = new ScorekeeperDB();

function notifyChange(): void {
  window.dispatchEvent(new CustomEvent('scorekeeper:datachanged'));
}

// ─── Players ────────────────────────────────────────────────────────────────

export async function getPlayers(): Promise<Player[]> {
  return db.players.toArray();
}

export async function getActivePlayers(): Promise<Player[]> {
  const all = await db.players.toArray();
  return all.filter(p => p.active);
}

export async function createPlayer(data: Omit<Player, 'id'>): Promise<number> {
  const id = await db.players.add(data);
  notifyChange();
  return id;
}

export async function updatePlayer(id: number, changes: Partial<Player>): Promise<void> {
  await db.players.update(id, changes);
  notifyChange();
}

export async function deletePlayer(id: number): Promise<void> {
  await db.players.delete(id);
  notifyChange();
}

// ─── Games ──────────────────────────────────────────────────────────────────

export async function getGames(): Promise<Game[]> {
  return db.games.toArray();
}

export async function createGame(data: Omit<Game, 'id'>): Promise<number> {
  const id = await db.games.add(data);
  notifyChange();
  return id;
}

export async function updateGame(id: number, changes: Partial<Game>): Promise<void> {
  await db.games.update(id, changes);
  notifyChange();
}

export async function deleteGame(id: number): Promise<void> {
  await db.games.delete(id);
  notifyChange();
}

// ─── Game Nights ─────────────────────────────────────────────────────────────

export async function createGameNight(data: Omit<GameNight, 'id'>): Promise<number> {
  const id = await db.gameNights.add(data);
  notifyChange();
  return id;
}

export async function updateGameNight(id: number, changes: Partial<GameNight>): Promise<void> {
  await db.gameNights.update(id, changes);
  notifyChange();
}

export async function getGameNights(): Promise<GameNight[]> {
  return db.gameNights.orderBy('createdAt').reverse().toArray();
}

export async function getGameNight(id: number): Promise<GameNight | undefined> {
  return db.gameNights.get(id);
}

export async function deleteGameNight(id: number): Promise<void> {
  // Delete all associated matches and score entries
  const matches = await db.matches.where('gameNightId').equals(id).toArray();
  for (const match of matches) {
    if (match.id !== undefined) {
      await db.scoreEntries.where('matchId').equals(match.id).delete();
    }
  }
  await db.matches.where('gameNightId').equals(id).delete();
  await db.gameNights.delete(id);
  notifyChange();
}

// ─── Matches ─────────────────────────────────────────────────────────────────

export async function createMatch(data: Omit<Match, 'id'>): Promise<number> {
  const id = await db.matches.add(data);
  notifyChange();
  return id;
}

export async function updateMatch(id: number, changes: Partial<Match>): Promise<void> {
  await db.matches.update(id, changes);
  notifyChange();
}

export async function getMatch(id: number): Promise<Match | undefined> {
  return db.matches.get(id);
}

export async function getMatchesForNight(gameNightId: number): Promise<Match[]> {
  return db.matches.where('gameNightId').equals(gameNightId).toArray();
}

export async function getActiveMatch(): Promise<Match | undefined> {
  return db.matches.where('status').equals('active').first();
}

// ─── Score Entries ────────────────────────────────────────────────────────────

export async function addScoreEntry(data: Omit<ScoreEntry, 'id'>): Promise<number> {
  const id = await db.scoreEntries.add(data);
  notifyChange();
  return id;
}

export async function getScoreEntriesForMatch(matchId: number): Promise<ScoreEntry[]> {
  return db.scoreEntries.where('matchId').equals(matchId).sortBy('createdAt');
}

export async function deleteLastScoreEntry(matchId: number): Promise<boolean> {
  const entries = await db.scoreEntries
    .where('matchId')
    .equals(matchId)
    .sortBy('createdAt');
  if (entries.length === 0) return false;

  const maxRound = Math.max(...entries.map(e => e.roundNumber));

  const toDelete = entries.filter(e => e.roundNumber === maxRound);
  for (const entry of toDelete) {
    if (entry.id !== undefined) await db.scoreEntries.delete(entry.id);
  }

  // Also delete per-round custom stat entries for that round
  const customToDelete = await db.customStatEntries
    .where('matchId').equals(matchId)
    .filter(e => e.roundNumber === maxRound)
    .toArray();
  for (const e of customToDelete) {
    if (e.id !== undefined) await db.customStatEntries.delete(e.id);
  }

  notifyChange();
  return true;
}

// ─── Custom Stat Entries ──────────────────────────────────────────────────────

export async function addCustomStatEntry(data: Omit<CustomStatEntry, 'id'>): Promise<number> {
  return db.customStatEntries.add(data);
}

export async function getCustomStatEntriesForMatch(matchId: number): Promise<CustomStatEntry[]> {
  return db.customStatEntries.where('matchId').equals(matchId).toArray();
}

export async function getCustomStatEntriesForGame(gameId: number): Promise<CustomStatEntry[]> {
  return db.customStatEntries.where('gameId').equals(gameId).toArray();
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export interface PlayerGameStats {
  gameId: number;
  gameName: string;
  wins: number;
  losses: number;
  avgScore: number;
  gamesPlayed: number;
}

export async function computePlayerStats(playerId: number): Promise<{
  totalWins: number;
  totalLosses: number;
  winRate: number;
  avgScore: number;
  gamesPlayed: number;
  gameBreakdown: PlayerGameStats[];
}> {
  const matches = await db.matches
    .where('status')
    .equals('completed')
    .toArray();

  // Filter matches this player participated in
  const playerMatches = matches.filter(m => m.playerIds.includes(playerId));

  if (playerMatches.length === 0) {
    return {
      totalWins: 0,
      totalLosses: 0,
      winRate: 0,
      avgScore: 0,
      gamesPlayed: 0,
      gameBreakdown: [],
    };
  }

  let totalWins = 0;
  let totalLosses = 0;
  let totalScore = 0;
  let scoreCount = 0;

  const gameMap: Map<number, PlayerGameStats> = new Map();

  for (const match of playerMatches) {
    if (match.gameId === undefined) continue;

    const isWin = match.winnerId === playerId;
    if (isWin) totalWins++;
    else totalLosses++;

    // Get entries for this match and player
    const entries = await db.scoreEntries
      .where('matchId')
      .equals(match.id!)
      .toArray();
    const playerEntries = entries.filter(e => e.playerId === playerId);
    const matchTotal = playerEntries.reduce((sum, e) => sum + e.value, 0);
    if (playerEntries.length > 0) {
      totalScore += matchTotal;
      scoreCount++;
    }

    // Per-game breakdown
    const existing = gameMap.get(match.gameId) ?? {
      gameId: match.gameId,
      gameName: '',
      wins: 0,
      losses: 0,
      avgScore: 0,
      gamesPlayed: 0,
    };
    existing.gamesPlayed++;
    if (isWin) existing.wins++;
    else existing.losses++;
    // We'll compute avgScore after
    gameMap.set(match.gameId, existing);
  }

  // Fetch game names
  const games = await db.games.toArray();
  const gameNameMap = new Map(games.map(g => [g.id!, g.name]));

  const gameBreakdown: PlayerGameStats[] = [];
  for (const [gameId, stats] of gameMap.entries()) {
    stats.gameName = gameNameMap.get(gameId) ?? 'Unknown';
    // Compute avgScore per game
    const gameMatches = playerMatches.filter(m => m.gameId === gameId);
    let gameScore = 0;
    let gameScoreCount = 0;
    for (const gm of gameMatches) {
      const entries = await db.scoreEntries
        .where('matchId')
        .equals(gm.id!)
        .toArray();
      const pe = entries.filter(e => e.playerId === playerId);
      if (pe.length > 0) {
        gameScore += pe.reduce((s, e) => s + e.value, 0);
        gameScoreCount++;
      }
    }
    stats.avgScore = gameScoreCount > 0 ? Math.round(gameScore / gameScoreCount) : 0;
    gameBreakdown.push(stats);
  }

  return {
    totalWins,
    totalLosses,
    winRate: playerMatches.length > 0
      ? Math.round((totalWins / playerMatches.length) * 100)
      : 0,
    avgScore: scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0,
    gamesPlayed: playerMatches.length,
    gameBreakdown,
  };
}

// ─── Export / Import ──────────────────────────────────────────────────────────

export async function exportAll(): Promise<AppData> {
  const [players, games, gameNights, matches, scoreEntries, customStatEntries] = await Promise.all([
    db.players.toArray(),
    db.games.toArray(),
    db.gameNights.toArray(),
    db.matches.toArray(),
    db.scoreEntries.toArray(),
    db.customStatEntries.toArray(),
  ]);

  return {
    players,
    games,
    gameNights,
    matches,
    scoreEntries,
    customStatEntries,
    exportedAt: Date.now(),
    version: '1.0.0',
  };
}

export async function importAll(data: AppData, skipEvent = false): Promise<void> {
  await db.transaction('rw', [
    db.players,
    db.games,
    db.gameNights,
    db.matches,
    db.scoreEntries,
    db.customStatEntries,
  ], async () => {
    await db.players.clear();
    await db.games.clear();
    await db.gameNights.clear();
    await db.matches.clear();
    await db.scoreEntries.clear();
    await db.customStatEntries.clear();

    if (data.players?.length) await db.players.bulkAdd(data.players);
    if (data.games?.length) await db.games.bulkAdd(data.games);
    if (data.gameNights?.length) await db.gameNights.bulkAdd(data.gameNights);
    if (data.matches?.length) await db.matches.bulkAdd(data.matches);
    if (data.scoreEntries?.length) await db.scoreEntries.bulkAdd(data.scoreEntries);
    if (data.customStatEntries?.length) await db.customStatEntries.bulkAdd(data.customStatEntries);
  });
  if (!skipEvent) notifyChange();
}

// ─── One-time migration: first_out notes → customStatEntries ─────────────────

const FIRST_OUT_MIGRATION_KEY = 'scorekeeper_migrated_firstout_v1';

export async function migrateFirstOutToCustomStats(): Promise<void> {
  if (localStorage.getItem(FIRST_OUT_MIGRATION_KEY)) return;

  const FIRST_OUT_FIELD: CustomField = {
    id: 'first_out',
    label: 'First Out',
    type: 'pick-one',
    scope: 'player',
    trigger: 'per-round',
  };

  const allEntries = await db.scoreEntries.toArray();

  // Plain first_out notes (non-Phase10)
  const plainFirstOuts = allEntries.filter(e => e.note === 'first_out');

  // Phase 10 notes containing firstOut: true
  const phase10FirstOuts = allEntries.filter(e => {
    if (!e.note || e.note === 'first_out') return false;
    try { return (JSON.parse(e.note) as { firstOut?: boolean }).firstOut === true; }
    catch { return false; }
  });

  const allToMigrate = [...plainFirstOuts, ...phase10FirstOuts];
  if (allToMigrate.length === 0) {
    localStorage.setItem(FIRST_OUT_MIGRATION_KEY, '1');
    return;
  }

  // Ensure the first_out custom field exists on each affected game
  const matchIds = [...new Set(allToMigrate.map(e => e.matchId))];
  for (const matchId of matchIds) {
    const match = await db.matches.get(matchId);
    if (!match) continue;
    const game = await db.games.get(match.gameId);
    if (!game) continue;
    if (!(game.customFields ?? []).find(f => f.id === 'first_out')) {
      await db.games.update(match.gameId, {
        customFields: [...(game.customFields ?? []), FIRST_OUT_FIELD],
      });
    }
  }

  // Create custom stat entries and clean the score entry notes
  for (const entry of allToMigrate) {
    const match = await db.matches.get(entry.matchId);
    if (!match) continue;

    // Idempotent: skip if already migrated
    const exists = await db.customStatEntries
      .where('matchId').equals(entry.matchId)
      .filter(e => e.fieldId === 'first_out' && e.roundNumber === entry.roundNumber && e.playerId === entry.playerId)
      .first();
    if (!exists) {
      await db.customStatEntries.add({
        matchId: entry.matchId,
        gameId: match.gameId,
        fieldId: 'first_out',
        playerId: entry.playerId,
        roundNumber: entry.roundNumber,
        value: 1,
        createdAt: entry.createdAt,
      });
    }

    // Strip first_out from the score entry note
    if (entry.id !== undefined) {
      if (entry.note === 'first_out') {
        await db.scoreEntries.update(entry.id, { note: undefined });
      } else {
        try {
          const d = JSON.parse(entry.note!) as Record<string, unknown>;
          delete d['firstOut'];
          await db.scoreEntries.update(entry.id, { note: JSON.stringify(d) });
        } catch { /* ignore */ }
      }
    }
  }

  localStorage.setItem(FIRST_OUT_MIGRATION_KEY, '1');
}
