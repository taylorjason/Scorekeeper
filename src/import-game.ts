import { db } from './db';
import { PLAYER_COLORS } from './constants';
import type { Game, ScoreEntry, ScoringMode } from './types';

// ─── External format ──────────────────────────────────────────────────────────

interface ExternalRoundScore {
  round_number: number;
  round_name: string;
  round_score: number;
  phase?: number;
  phase_completed?: boolean | null;
  running_total?: number;
}

interface ExternalPlayer {
  name: string;
  final_score: number;
  is_winner: boolean;
  round_scores: ExternalRoundScore[];
}

export interface ExternalGameData {
  game_name: string;
  date_played: string; // YYYY-MM-DD
  is_complete: boolean;
  players: ExternalPlayer[];
}

export interface ImportSummary {
  gameName: string;
  date: string;
  playerCount: number;
  newPlayers: string[];
  roundCount: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function detectScoringMode(data: ExternalGameData): ScoringMode {
  const hasPhase = data.players.some(p =>
    p.round_scores.some(r => r.phase !== undefined)
  );
  return hasPhase ? 'phase10' : 'rounds';
}

function extractRoundLabels(data: ExternalGameData): string[] | undefined {
  const roundMap = new Map<number, string>();
  for (const player of data.players) {
    for (const r of player.round_scores) {
      if (!roundMap.has(r.round_number)) {
        roundMap.set(r.round_number, r.round_name);
      }
    }
  }

  const sorted = [...roundMap.entries()].sort((a, b) => a[0] - b[0]);
  const allSequential = sorted.every(([num, name]) => name === String(num));
  if (allSequential) return undefined;

  return sorted.map(([, name]) => name);
}

function resolveWinner(
  data: ExternalGameData,
  playerIdMap: Map<string, number>,
  mode: ScoringMode
): number | undefined {
  const winners = data.players.filter(p => p.is_winner);
  if (winners.length === 0) return undefined;
  if (winners.length === 1) return playerIdMap.get(winners[0].name.trim().toLowerCase());

  // Multiple is_winner: true — break tie by score
  const best = (mode === 'phase10' || mode === 'low')
    ? winners.reduce((a, b) => a.final_score < b.final_score ? a : b)
    : winners.reduce((a, b) => a.final_score > b.final_score ? a : b);
  return playerIdMap.get(best.name.trim().toLowerCase());
}

// ─── Main import ──────────────────────────────────────────────────────────────

export async function importExternalGame(data: ExternalGameData): Promise<ImportSummary> {
  if (!data.game_name || !data.date_played || !Array.isArray(data.players) || data.players.length === 0) {
    throw new Error('Invalid format: missing game_name, date_played, or players');
  }

  const scoringMode = detectScoringMode(data);
  const roundLabels = extractRoundLabels(data);
  const now = Date.now();

  let summary!: ImportSummary;

  await db.transaction('rw', [db.players, db.games, db.gameNights, db.matches, db.scoreEntries], async () => {
    const newPlayerNames: string[] = [];

    // ── Resolve players ──────────────────────────────────────────────────────
    const existingPlayers = await db.players.toArray();
    const playerLookup = new Map(
      existingPlayers.map(p => [p.displayName.trim().toLowerCase(), p.id!])
    );
    const playerIdMap = new Map<string, number>();

    for (const ep of data.players) {
      const key = ep.name.trim().toLowerCase();
      if (playerLookup.has(key)) {
        playerIdMap.set(key, playerLookup.get(key)!);
      } else {
        const colorIndex = (existingPlayers.length + newPlayerNames.length) % PLAYER_COLORS.length;
        const id = await db.players.add({
          displayName: ep.name.trim(),
          color: PLAYER_COLORS[colorIndex],
          active: true,
          createdAt: now,
        });
        playerIdMap.set(key, id as number);
        newPlayerNames.push(ep.name.trim());
      }
    }

    // ── Resolve game ─────────────────────────────────────────────────────────
    const existingGames = await db.games.toArray();
    const gameNameLower = data.game_name.trim().toLowerCase();
    const existingGame = existingGames.find(g => g.name.trim().toLowerCase() === gameNameLower);
    let gameId: number;

    if (existingGame) {
      gameId = existingGame.id!;
    } else {
      const gameData: Omit<Game, 'id'> = {
        name: data.game_name.trim(),
        scoringMode,
        createdAt: now,
      };
      if (roundLabels) gameData.roundLabels = roundLabels;
      gameId = (await db.games.add(gameData)) as number;
    }

    // ── Create GameNight ─────────────────────────────────────────────────────
    const gameNightId = (await db.gameNights.add({
      title: data.game_name.trim(),
      date: data.date_played,
      createdAt: now,
    })) as number;

    // ── Create Match ─────────────────────────────────────────────────────────
    const playerIds = data.players.map(p => playerIdMap.get(p.name.trim().toLowerCase())!);
    const winnerId = resolveWinner(data, playerIdMap, scoringMode);

    const matchId = (await db.matches.add({
      gameNightId,
      gameId,
      playerIds,
      status: data.is_complete ? 'completed' : 'active',
      winnerId,
      createdAt: now,
    })) as number;

    // ── Create ScoreEntries ──────────────────────────────────────────────────
    const entries: Omit<ScoreEntry, 'id'>[] = [];
    for (const ep of data.players) {
      const playerId = playerIdMap.get(ep.name.trim().toLowerCase())!;
      for (const r of ep.round_scores) {
        const entry: Omit<ScoreEntry, 'id'> = {
          matchId,
          playerId,
          roundNumber: r.round_number,
          value: r.round_score,
          createdAt: now,
        };
        if (scoringMode === 'phase10' && r.phase !== undefined) {
          entry.note = JSON.stringify({ phase: r.phase, completed: !!r.phase_completed });
        }
        entries.push(entry);
      }
    }
    await db.scoreEntries.bulkAdd(entries);

    const maxRound = Math.max(...data.players.flatMap(p => p.round_scores.map(r => r.round_number)));
    summary = {
      gameName: data.game_name.trim(),
      date: data.date_played,
      playerCount: data.players.length,
      newPlayers: newPlayerNames,
      roundCount: maxRound,
    };
  });

  window.dispatchEvent(new CustomEvent('scorekeeper:datachanged'));
  return summary;
}
