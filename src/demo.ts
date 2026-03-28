import { db, createPlayer, createGame, createGameNight, createMatch, addScoreEntry } from './db';

export async function seedDemoData(): Promise<void> {
  const existingPlayers = await db.players.count();
  if (existingPlayers > 0) return;

  const now = Date.now();
  const day = 86400000;

  // ─── Players ───────────────────────────────────────────────────────────────
  const aliceId = await createPlayer({ displayName: 'Alice', color: '#ef4444', active: true, createdAt: now - 30 * day });
  const bobId = await createPlayer({ displayName: 'Bob', color: '#3b82f6', active: true, createdAt: now - 30 * day });
  const carolId = await createPlayer({ displayName: 'Carol', color: '#10b981', active: true, createdAt: now - 30 * day });
  const daveId = await createPlayer({ displayName: 'Dave', color: '#f59e0b', active: true, createdAt: now - 30 * day });

  // ─── Games ────────────────────────────────────────────────────────────────
  const catanId = await createGame({
    name: 'Catan',
    scoringMode: 'high',
    rules: 'First to 10 victory points wins',
    targetScore: 10,
    createdAt: now - 30 * day,
  });
  const scrabbleId = await createGame({
    name: 'Scrabble',
    scoringMode: 'high',
    rules: 'Highest total word score wins',
    createdAt: now - 30 * day,
  });
  const pokerId = await createGame({
    name: 'Poker',
    scoringMode: 'high',
    rules: 'Chip count at end of session',
    createdAt: now - 30 * day,
  });

  // ─── Game Night 1: Two weeks ago ──────────────────────────────────────────
  const night1Date = new Date(now - 14 * day);
  const night1Id = await createGameNight({
    title: 'Friday Night Games',
    date: night1Date.toISOString().split('T')[0],
    notes: 'Great session! Close games all night.',
    createdAt: now - 14 * day,
  });

  // Match 1: Catan - all 4 players, Alice wins
  const match1Id = await createMatch({
    gameNightId: night1Id,
    gameId: catanId,
    playerIds: [aliceId, bobId, carolId, daveId],
    status: 'completed',
    winnerId: aliceId,
    createdAt: now - 14 * day,
  });

  // Catan scores (victory points per round, cumulative feel)
  const catanScores: [number, number[]][] = [
    [1, [2, 1, 1, 2]],
    [2, [2, 2, 2, 1]],
    [3, [2, 2, 2, 2]],
    [4, [2, 2, 2, 2]],
    [5, [2, 1, 2, 1]],
  ];
  const catanPlayers = [aliceId, bobId, carolId, daveId];
  for (const [round, scores] of catanScores) {
    for (let i = 0; i < catanPlayers.length; i++) {
      await addScoreEntry({
        matchId: match1Id,
        playerId: catanPlayers[i],
        roundNumber: round,
        value: scores[i],
        createdAt: now - 14 * day + round * 1000,
      });
    }
  }

  // Match 2: Scrabble - 3 players (no Dave), Bob wins
  const match2Id = await createMatch({
    gameNightId: night1Id,
    gameId: scrabbleId,
    playerIds: [aliceId, bobId, carolId],
    status: 'completed',
    winnerId: bobId,
    createdAt: now - 14 * day + 10000,
  });

  const scrabblePlayers = [aliceId, bobId, carolId];
  const scrabbleRounds: [number, number[]][] = [
    [1, [28, 35, 22]],
    [2, [42, 56, 38]],
    [3, [18, 24, 45]],
    [4, [55, 33, 29]],
    [5, [38, 48, 31]],
    [6, [22, 41, 38]],
  ];
  for (const [round, scores] of scrabbleRounds) {
    for (let i = 0; i < scrabblePlayers.length; i++) {
      await addScoreEntry({
        matchId: match2Id,
        playerId: scrabblePlayers[i],
        roundNumber: round,
        value: scores[i],
        createdAt: now - 14 * day + 10000 + round * 1000,
      });
    }
  }

  // ─── Game Night 2: Last week ──────────────────────────────────────────────
  const night2Date = new Date(now - 7 * day);
  const night2Id = await createGameNight({
    title: 'Game Night Extravaganza',
    date: night2Date.toISOString().split('T')[0],
    notes: 'Dave finally won something!',
    createdAt: now - 7 * day,
  });

  // Match 3: Poker - all 4 players, Dave wins
  const match3Id = await createMatch({
    gameNightId: night2Id,
    gameId: pokerId,
    playerIds: [aliceId, bobId, carolId, daveId],
    status: 'completed',
    winnerId: daveId,
    createdAt: now - 7 * day,
  });

  const pokerPlayers = [aliceId, bobId, carolId, daveId];
  const pokerRounds: [number, number[]][] = [
    [1, [100, 100, 100, 100]],
    [2, [-20, 30, -10, 0]],
    [3, [15, -25, 20, -10]],
    [4, [-30, 10, -15, 35]],
    [5, [20, -15, 5, -10]],
    [6, [-10, 20, -30, 20]],
  ];
  for (const [round, scores] of pokerRounds) {
    for (let i = 0; i < pokerPlayers.length; i++) {
      await addScoreEntry({
        matchId: match3Id,
        playerId: pokerPlayers[i],
        roundNumber: round,
        value: scores[i],
        createdAt: now - 7 * day + round * 1000,
      });
    }
  }

  // Match 4: Catan rematch - Alice, Bob, Carol, Carol wins
  const match4Id = await createMatch({
    gameNightId: night2Id,
    gameId: catanId,
    playerIds: [aliceId, bobId, carolId],
    status: 'completed',
    winnerId: carolId,
    createdAt: now - 7 * day + 20000,
  });

  const catan2Players = [aliceId, bobId, carolId];
  const catan2Scores: [number, number[]][] = [
    [1, [2, 2, 2]],
    [2, [2, 1, 3]],
    [3, [1, 2, 2]],
    [4, [2, 2, 1]],
    [5, [1, 2, 2]],
  ];
  for (const [round, scores] of catan2Scores) {
    for (let i = 0; i < catan2Players.length; i++) {
      await addScoreEntry({
        matchId: match4Id,
        playerId: catan2Players[i],
        roundNumber: round,
        value: scores[i],
        createdAt: now - 7 * day + 20000 + round * 1000,
      });
    }
  }

  console.log('[Demo] Seeded demo data successfully');
}
