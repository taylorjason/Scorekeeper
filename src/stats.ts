import { db } from './db';
import type { Player } from './types';

// ─── Player Win Count ─────────────────────────────────────────────────────────

export async function computePlayerWins(playerId: number): Promise<number> {
  return db.matches
    .where('winnerId')
    .equals(playerId)
    .count();
}

// ─── Player Stats ─────────────────────────────────────────────────────────────

export interface GameBreakdown {
  gameId: number;
  gameName: string;
  wins: number;
  losses: number;
  gamesPlayed: number;
  avgScore: number;
}

export interface PlayerStats {
  wins: number;
  losses: number;
  winRate: number;
  avgScore: number;
  gamesPlayed: number;
  gameBreakdown: GameBreakdown[];
  scoreTrend: { matchId: number; total: number; date: number }[];
}

export async function computePlayerStats(playerId: number): Promise<PlayerStats> {
  const completedMatches = await db.matches.where('status').equals('completed').toArray();
  const playerMatches = completedMatches.filter(m => m.playerIds.includes(playerId));

  if (playerMatches.length === 0) {
    return { wins: 0, losses: 0, winRate: 0, avgScore: 0, gamesPlayed: 0, gameBreakdown: [], scoreTrend: [] };
  }

  const games = await db.games.toArray();
  const gameNameMap = new Map(games.map(g => [g.id!, g.name]));

  let wins = 0;
  let totalScore = 0;
  let scoreCount = 0;

  const gameMap = new Map<number, GameBreakdown>();
  const scoreTrend: { matchId: number; total: number; date: number }[] = [];

  // Sort by createdAt for trend
  const sortedMatches = [...playerMatches].sort((a, b) => a.createdAt - b.createdAt);

  for (const match of sortedMatches) {
    const isWin = match.winnerId === playerId;
    if (isWin) wins++;

    const entries = await db.scoreEntries.where('matchId').equals(match.id!).toArray();
    const playerEntries = entries.filter(e => e.playerId === playerId);
    const matchTotal = playerEntries.reduce((sum, e) => sum + e.value, 0);
    if (playerEntries.length > 0) {
      totalScore += matchTotal;
      scoreCount++;
      scoreTrend.push({ matchId: match.id!, total: matchTotal, date: match.createdAt });
    }

    const existing = gameMap.get(match.gameId) ?? {
      gameId: match.gameId,
      gameName: gameNameMap.get(match.gameId) ?? 'Unknown',
      wins: 0,
      losses: 0,
      gamesPlayed: 0,
      avgScore: 0,
    };
    existing.gamesPlayed++;
    if (isWin) existing.wins++;
    else existing.losses++;
    gameMap.set(match.gameId, existing);
  }

  // Compute avgScore per game
  for (const [gameId, stats] of gameMap.entries()) {
    const gameMatches = playerMatches.filter(m => m.gameId === gameId);
    let gameScore = 0;
    let gameScoreCount = 0;
    for (const gm of gameMatches) {
      const entries = await db.scoreEntries.where('matchId').equals(gm.id!).toArray();
      const pe = entries.filter(e => e.playerId === playerId);
      if (pe.length > 0) {
        gameScore += pe.reduce((s, e) => s + e.value, 0);
        gameScoreCount++;
      }
    }
    stats.avgScore = gameScoreCount > 0 ? Math.round(gameScore / gameScoreCount) : 0;
  }

  const losses = playerMatches.length - wins;
  const winRate = playerMatches.length > 0 ? Math.round((wins / playerMatches.length) * 100) : 0;
  const avgScore = scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0;

  // Keep only last 10 for trend
  const recentTrend = scoreTrend.slice(-10);

  return {
    wins,
    losses,
    winRate,
    avgScore,
    gamesPlayed: playerMatches.length,
    gameBreakdown: Array.from(gameMap.values()),
    scoreTrend: recentTrend,
  };
}

// ─── Leaderboard ──────────────────────────────────────────────────────────────

export interface LeaderboardEntry {
  player: Player;
  wins: number;
  gamesPlayed: number;
  winRate: number;
}

export async function computeLeaderboard(): Promise<LeaderboardEntry[]> {
  const allPlayers = await db.players.toArray();
  const players = allPlayers.filter(p => p.active);
  const completedMatches = await db.matches.where('status').equals('completed').toArray();

  const entries: LeaderboardEntry[] = await Promise.all(
    players.map(async (player) => {
      const pid = player.id!;
      const playerMatches = completedMatches.filter(m => m.playerIds.includes(pid));
      const wins = playerMatches.filter(m => m.winnerId === pid).length;
      const winRate = playerMatches.length > 0
        ? Math.round((wins / playerMatches.length) * 100)
        : 0;
      return { player, wins, gamesPlayed: playerMatches.length, winRate };
    })
  );

  return entries.sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    return b.winRate - a.winRate;
  });
}

// ─── Game Stats ──────────────────────────────────────────────────────────────

export interface GameStats {
  totalMatches: number;
  topPlayer: Player | null;
  avgScore: number;
  mostPlayedBy: Player | null;
}

export async function computeGameStats(gameId: number): Promise<GameStats> {
  const gameMatches = await db.matches.where('gameId').equals(gameId).toArray();
  const completedMatches = gameMatches.filter(m => m.status === 'completed');

  if (completedMatches.length === 0) {
    return { totalMatches: 0, topPlayer: null, avgScore: 0, mostPlayedBy: null };
  }

  // Find top player by wins
  const winMap = new Map<number, number>();
  const playCountMap = new Map<number, number>();

  for (const match of completedMatches) {
    if (match.winnerId !== undefined) {
      winMap.set(match.winnerId, (winMap.get(match.winnerId) ?? 0) + 1);
    }
    for (const pid of match.playerIds) {
      playCountMap.set(pid, (playCountMap.get(pid) ?? 0) + 1);
    }
  }

  // Total average score
  let totalScore = 0;
  let entryCount = 0;
  for (const match of completedMatches) {
    const entries = await db.scoreEntries.where('matchId').equals(match.id!).toArray();
    totalScore += entries.reduce((s, e) => s + e.value, 0);
    entryCount += entries.length;
  }

  let topPlayerId: number | undefined;
  let maxWins = 0;
  for (const [pid, w] of winMap.entries()) {
    if (w > maxWins) { maxWins = w; topPlayerId = pid; }
  }

  let mostPlayedById: number | undefined;
  let maxPlays = 0;
  for (const [pid, c] of playCountMap.entries()) {
    if (c > maxPlays) { maxPlays = c; mostPlayedById = pid; }
  }

  const topPlayer = topPlayerId !== undefined
    ? (await db.players.get(topPlayerId)) ?? null
    : null;
  const mostPlayedBy = mostPlayedById !== undefined
    ? (await db.players.get(mostPlayedById)) ?? null
    : null;

  return {
    totalMatches: completedMatches.length,
    topPlayer,
    avgScore: entryCount > 0 ? Math.round(totalScore / entryCount) : 0,
    mostPlayedBy,
  };
}
