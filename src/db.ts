import Dexie, { type Table } from 'dexie';
import type { Player, Game, GameNight, Match, ScoreEntry, StatSnapshot, AppData } from './types';

export class ScorekeeperDB extends Dexie {
  players!: Table<Player, number>;
  games!: Table<Game, number>;
  gameNights!: Table<GameNight, number>;
  matches!: Table<Match, number>;
  scoreEntries!: Table<ScoreEntry, number>;
  statSnapshots!: Table<StatSnapshot, number>;

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
  }
}

export const db = new ScorekeeperDB();

// ─── Players ────────────────────────────────────────────────────────────────

export async function getPlayers(): Promise<Player[]> {
  return db.players.toArray();
}

export async function getActivePlayers(): Promise<Player[]> {
  return db.players.where('active').equals(1).toArray();
}

export async function createPlayer(data: Omit<Player, 'id'>): Promise<number> {
  return db.players.add(data);
}

export async function updatePlayer(id: number, changes: Partial<Player>): Promise<void> {
  await db.players.update(id, changes);
}

export async function deletePlayer(id: number): Promise<void> {
  await db.players.delete(id);
}

// ─── Games ──────────────────────────────────────────────────────────────────

export async function getGames(): Promise<Game[]> {
  return db.games.toArray();
}

export async function createGame(data: Omit<Game, 'id'>): Promise<number> {
  return db.games.add(data);
}

export async function updateGame(id: number, changes: Partial<Game>): Promise<void> {
  await db.games.update(id, changes);
}

export async function deleteGame(id: number): Promise<void> {
  await db.games.delete(id);
}

// ─── Game Nights ─────────────────────────────────────────────────────────────

export async function createGameNight(data: Omit<GameNight, 'id'>): Promise<number> {
  return db.gameNights.add(data);
}

export async function updateGameNight(id: number, changes: Partial<GameNight>): Promise<void> {
  await db.gameNights.update(id, changes);
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
}

// ─── Matches ─────────────────────────────────────────────────────────────────

export async function createMatch(data: Omit<Match, 'id'>): Promise<number> {
  return db.matches.add(data);
}

export async function updateMatch(id: number, changes: Partial<Match>): Promise<void> {
  await db.matches.update(id, changes);
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
  return db.scoreEntries.add(data);
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

  // Find the max round number
  const maxRound = Math.max(...entries.map(e => e.roundNumber));

  // Delete all entries for that round
  const toDelete = entries.filter(e => e.roundNumber === maxRound);
  for (const entry of toDelete) {
    if (entry.id !== undefined) {
      await db.scoreEntries.delete(entry.id);
    }
  }
  return true;
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
  const [players, games, gameNights, matches, scoreEntries] = await Promise.all([
    db.players.toArray(),
    db.games.toArray(),
    db.gameNights.toArray(),
    db.matches.toArray(),
    db.scoreEntries.toArray(),
  ]);

  return {
    players,
    games,
    gameNights,
    matches,
    scoreEntries,
    exportedAt: Date.now(),
    version: '1.0.0',
  };
}

export async function importAll(data: AppData): Promise<void> {
  await db.transaction('rw', [
    db.players,
    db.games,
    db.gameNights,
    db.matches,
    db.scoreEntries,
  ], async () => {
    await db.players.clear();
    await db.games.clear();
    await db.gameNights.clear();
    await db.matches.clear();
    await db.scoreEntries.clear();

    if (data.players?.length) await db.players.bulkAdd(data.players);
    if (data.games?.length) await db.games.bulkAdd(data.games);
    if (data.gameNights?.length) await db.gameNights.bulkAdd(data.gameNights);
    if (data.matches?.length) await db.matches.bulkAdd(data.matches);
    if (data.scoreEntries?.length) await db.scoreEntries.bulkAdd(data.scoreEntries);
  });
}
