// Player represents a person who plays games
export interface Player {
  id?: number;
  displayName: string;
  color: string; // hex color like "#ef4444"
  active: boolean;
  createdAt: number; // timestamp ms
}

// Scoring modes for games
export type ScoringMode = 'high' | 'low' | 'rounds' | 'finish-order' | 'custom' | 'phase10';

// Game represents a board game / card game
export interface Game {
  id?: number;
  name: string;
  scoringMode: ScoringMode;
  rules?: string; // optional notes about rules
  targetScore?: number; // for finish-order or target-based modes
  roundLabels?: string[]; // optional per-round names, e.g. ["Phase 1", "Phase 2", ...]
  createdAt: number;
}

// GameNight is a session containing one or more matches
export interface GameNight {
  id?: number;
  title: string;
  date: string; // ISO date string YYYY-MM-DD
  notes?: string;
  createdAt: number;
}

// Match is one playthrough of a game within a game night
export interface Match {
  id?: number;
  gameNightId: number;
  gameId: number;
  playerIds: number[]; // array of Player.id
  status: 'active' | 'completed';
  winnerId?: number; // Player.id of winner
  createdAt: number;
}

// ScoreEntry is one score contribution (one round or one player score)
export interface ScoreEntry {
  id?: number;
  matchId: number;
  playerId: number;
  roundNumber: number;
  value: number;
  note?: string;
  createdAt: number;
}

// StatSnapshot is a cached stats record per player per game
export interface StatSnapshot {
  id?: number;
  playerId: number;
  gameId: number;
  wins: number;
  losses: number;
  avgScore: number;
  lastPlayed: number; // timestamp
}

// SyncConfig for GitHub / Gitea API integration
export interface SyncConfig {
  provider: 'github' | 'gitea'; // which forge to sync with
  baseUrl?: string;              // Gitea only: e.g. "https://gitea.example.com"
  username: string;
  repo: string;
  pat: string;                   // GitHub PAT or Gitea API key
  filePath: string;
  branch: string;
  lastSync?: number; // timestamp
}

// Export format for all app data
export interface AppData {
  players: Player[];
  games: Game[];
  gameNights: GameNight[];
  matches: Match[];
  scoreEntries: ScoreEntry[];
  exportedAt: number;
  version: string;
}
