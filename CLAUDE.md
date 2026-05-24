# Game Night Scorekeeper — Project Guide for Claude

## What This Is

A mobile-first Progressive Web App for tracking board game scores across weekly game nights. Fully static (no server), deployed to GitHub Pages. Primary device is a phone held in one hand.

Live: https://taylorjason.github.io/Scorekeeper/

---

## Tech Stack

| Layer | Choice |
|---|---|
| Language | TypeScript |
| Build | Vite 8 |
| Storage | Dexie.js → IndexedDB (primary) |
| Real-time sync | Firebase Firestore (hardcoded project config) |
| Backup sync | GitHub / Gitea REST API |
| Charts | Chart.js |
| QR codes | qrcode |
| PWA | vite-plugin-pwa (Service Worker + manifest) |
| CSS | Custom hand-written CSS (~2200 lines), no framework |
| Routing | Hash-based SPA (`#/route/param`) |

No React, no Vue, no Tailwind. Views are plain TypeScript classes with `render() → string` + `afterRender()`.

---

## File Structure

```
src/
├── main.ts           # App shell HTML, routing init, Firebase init, sidebar toggle
├── router.ts         # parseRoute / navigate / onRouteChange (hash-based, 8 routes)
├── types.ts          # All TypeScript interfaces
├── db.ts             # Dexie schema + CRUD helpers (getMatch, addScoreEntry, etc.)
├── demo.ts           # Seeds demo data on first run (skipped when Firebase active)
├── firebase-sync.ts  # Firestore real-time sync; hardcoded Firebase config
├── github.ts         # GitHub + Gitea REST API import/export
├── stats.ts          # Win-rate, avg-score, trend calculations
├── toast.ts          # showToast(message, type) utility
├── vite-env.d.ts     # __APP_VERSION__, __BUILD_NUMBER__, __BUILD_TIME__ globals
├── styles/
│   └── main.css      # All styles; mobile-first with 900px desktop breakpoint
└── views/
    ├── Dashboard.ts      # Recent nights, quick player stats
    ├── NewNight.ts       # Create game night + add matches
    ├── ActiveMatch.ts    # Live scoring, undo, finish match
    ├── History.ts        # Browsable past game nights
    ├── Stats.ts          # Charts, win rates, leaderboard
    ├── Settings.ts       # Players, games, Firebase room, GitHub sync
    ├── Scoreboard.ts     # Full-screen scoreboard (opens new tab)
    └── RoundDisplay.ts   # Full-screen round display for iPhone (opens new tab)
```

---

## Routes

| Hash | View | Notes |
|---|---|---|
| `#/dashboard` | Dashboard | Default route |
| `#/new-night` | NewNight | |
| `#/match/:id` | ActiveMatch | |
| `#/history` | History | |
| `#/stats` | Stats | |
| `#/settings` | Settings | |
| `#/scoreboard/:id` | Scoreboard | Opens in new tab; hides app shell |
| `#/round-display/:id` | RoundDisplay | Opens in new tab; hides app shell |

`scoreboard-mode` / `round-display-mode` body classes hide the nav, header, and footer when those views are active.

---

## Data Model

```typescript
Player      { id, displayName, color: string /* hex */, active, createdAt }
Game        { id, name, scoringMode, rules?, targetScore?, roundLabels?: string[], createdAt }
GameNight   { id, title, date /* YYYY-MM-DD */, notes?, createdAt }
Match       { id, gameNightId, gameId, playerIds: number[], status, winnerId?, createdAt }
ScoreEntry  { id, matchId, playerId, roundNumber, value, note?, createdAt }
StatSnapshot { id, playerId, gameId, wins, losses, avgScore, lastPlayed }
FirebaseRoomConfig { roomId, apiKey?, projectId?, appId?, lastSync? }
SyncConfig  { provider, baseUrl?, username, repo, pat, filePath, branch, lastSync? }
```

`ScoreEntry.note` carries structured JSON for special modes:
- Phase 10: `{"phase": 3, "completed": true}`
- UNO first-out: `"first_out"` (string, not JSON)

---

## Scoring Modes

| Mode | Win condition | Notes |
|---|---|---|
| `high` | Highest total | Default |
| `low` | Lowest total | Golf, etc. |
| `rounds` | Highest total across rounds | Per-round entry UI |
| `finish-order` | Earliest finisher wins | Position-based |
| `custom` | Same as high | Use rules/notes field |
| `phase10` | Most phases + lowest penalty | Special sort: phase DESC, total ASC |

`Game.roundLabels` provides per-round names (e.g. `["Phase 1", "Phase 2", ...]`). Falls back to `Round N` when absent.

---

## Layout System

### Mobile (< 900px)
- Bottom nav bar with 5 icon+label buttons
- FAB "New Night" button (hidden at ≥ 900px)
- Full-width content

### Desktop (≥ 900px)
- Sidebar nav (220px default, collapses to 64px icon-only)
- Collapse state persisted in `localStorage` (`scorekeeper_sidebar_collapsed`)
- `body.sidebar-collapsed` drives all collapsed styles via `--sidebar-width: 64px`
- `--sidebar-width` CSS custom property shifts header, main content, and version footer
- Smooth 0.22s width transition

### Scoreboard / Round Display
- Body class hides all shell elements
- `margin-left: 0 !important` overrides sidebar shift on `.main-content`
- Scoreboard: dark full-screen grid of player cards, auto-refreshes every 5s
- Round Display: single large centered text, optimized for iPhone safe areas

---

## Firebase Sync

Firebase project credentials are **hardcoded** in `firebase-sync.ts`:

```typescript
const DEFAULT_FIREBASE_CONFIG = {
  apiKey: 'AIzaSyBbZi_h_jLEi3ioJ1IBpGq2x4Uk7XN1mKA',
  projectId: 'scorekeeper-c9b39',
  appId: '1:762963882089:web:68bafeb234d5d05f5d32f8',
};
```

Users only enter a **Room ID** (short string). The room ID namespaces documents in Firestore. Multiple devices sharing the same Room ID stay in sync in real time.

- `buildShareableUrl(config)` → `#room=<roomId>` hash link
- `parseRoomFromHash()` auto-imports a Room ID from that hash on page load
- `experimentalAutoDetectLongPolling: true` is set for better mobile/PWA compatibility
- Demo data is skipped when a room is configured (avoids polluting shared room)

---

## GitHub / Gitea Sync

Full data export/import via REST API. Supports both GitHub and self-hosted Gitea.

- Data serialized as `AppData` JSON (all players, games, nights, matches, entries)
- User provides: username, repo, PAT, file path, branch
- PAT stored in `localStorage` — warn users not to use on shared devices

---

## View Pattern

All views follow the same interface:

```typescript
class MyView {
  async load(/* params */): Promise<void>  // fetch data from DB
  render(): string                          // return full HTML string
  afterRender(): void                       // attach event listeners
  teardown?(): void                         // clear intervals, listeners (Scoreboard, RoundDisplay)
}
```

`main.ts` calls `_viewTeardown?.()` before loading a new view. Only views that poll or listen to events need `teardown`.

---

## CSS Conventions

- CSS custom properties: `--primary`, `--surface`, `--bg`, `--border`, `--text`, `--text-muted`, `--danger`, `--radius-sm`
- `[data-theme="dark"]` / `[data-theme="light"]` on `<html>` for theming
- `color-mix(in srgb, var(--pc) N%, #111827)` for player-color card tinting
- `clamp(min, preferred-vw, max)` for fluid scoreboard typography
- Scoreboard player color exposed as `--pc` CSS custom property via inline style

---

## Key Gotchas

- **Scoreboard margin**: `.scoreboard-mode .main-content` needs `margin-left: 0 !important` to override the 900px sidebar shift rule.
- **Phase 10 sort**: Phase DESC (higher phase = better), then total ASC (fewer penalty pts).
- **currentRound in ActiveMatch**: `max(roundNumber) + 1` — the round *being entered*, not the last completed one.
- **currentRound in Scoreboard/RoundDisplay**: `max(roundNumber)` — the last *completed* round.
- **Demo seed race**: `seedDemoData()` is skipped when Firebase is active; otherwise it checks `players.count > 0` before inserting.
- **`window.scorekeeper:datachanged`** custom event fires after any DB write; Scoreboard listens to it for instant refresh without waiting for the poll interval.
