# Game Night Scorekeeper

A mobile-first Progressive Web App for tracking board game scores, stats, and history across game nights with friends.

**[Open the app →](https://taylorjason.github.io/Scorekeeper/)**

---

## Features

- **Game Nights** — Organize multiple matches into themed sessions with a date and notes
- **Live Scoring** — 6 scoring modes: high score, low score, rounds, finish order, Phase 10, and custom
- **Scoreboard** — Full-screen display view for a TV or second screen; auto-refreshes in real time
- **Round Display** — iPhone-optimized view showing just the current round name (great to pass around the table)
- **Undo** — Remove the last round of scores with one tap
- **History** — Browse all past game nights with expandable match details
- **Stats & Charts** — Win rates, score trends, and per-game breakdowns
- **Player Management** — Add players with custom display names and colors
- **Game Library** — Configure games with specific scoring rules and optional per-round labels
- **Firebase Sync** — Real-time cross-device sync using a shared Room ID (no account needed)
- **GitHub / Gitea Sync** — Optional full data backup and restore via a repository
- **Offline-first PWA** — Install to home screen; works without internet after first load
- **Dark / Light theme** — Manual toggle, persisted across sessions
- **Demo data** — Pre-seeded on first run so there's something to explore immediately

---

## Scoring Modes

| Mode | How it works |
|------|-------------|
| **High score** | Highest cumulative score wins |
| **Low score** | Lowest cumulative score wins (golf, etc.) |
| **Rounds** | Enter per-player scores each round; highest total wins |
| **Finish order** | Players are ranked by when they finish |
| **Phase 10** | Tracks phases completed and penalty points; most phases + fewest points wins |
| **Custom** | Same as high score; use the rules field for any special notes |

---

## Setup & Development

### Prerequisites

- Node.js 18+
- npm 9+

### Run locally

```bash
npm install
npm run dev
```

App runs at http://localhost:5173

### Build for production

```bash
npm run build
```

Output goes to `dist/` — a fully static bundle deployable anywhere.

### Preview the production build

```bash
npm run preview
```

---

## Deploy to GitHub Pages

```bash
npm run build
npm install -g gh-pages
gh-pages -d dist
```

Then enable GitHub Pages in repository settings, pointing to the `gh-pages` branch.

---

## Real-Time Sync (Firebase)

Share scores across devices during a game night using a Room ID — no account or sign-up required.

1. Open **Settings → Firebase Room**
2. Enter any short Room ID (e.g. `friday-night`)
3. Tap **Connect**
4. Share the Room ID (or the generated link) with other players
5. Everyone on the same Room ID sees score updates in real time

The Room ID namespaces your data within a shared Firebase project. Firestore security rules control access.

---

## Backup Sync (GitHub / Gitea)

Export your full game history to a repository as a JSON file. Useful for long-term backups or migrating between devices.

### Create a Personal Access Token

1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate a token with the `repo` scope
3. Copy it immediately

### Configure in the app

1. Open **Settings → GitHub Sync**
2. Enter your username, repository name, PAT, file path, and branch
3. Tap **Test** to verify the connection
4. Tap **Push** to upload your data, or **Pull** to restore it

> Your PAT is stored in `localStorage`. Only use this on devices you own. Consider a dedicated repository for scorekeeper data.

---

## PWA Installation

### iPhone / iPad (Safari)
1. Open the app in Safari
2. Tap the Share button
3. Tap **Add to Home Screen**

### Android (Chrome)
1. Open the app in Chrome
2. Tap the three-dot menu → **Add to Home Screen** or **Install app**

### Desktop (Chrome / Edge)
1. Click the install icon in the address bar
2. Click **Install**

Once installed, the app works fully offline.

---

## Data Storage

| Data | Location |
|------|----------|
| Players, games, nights, scores | IndexedDB (`ScorekeeperDB` via Dexie.js) |
| Theme preference | `localStorage` |
| Sidebar collapsed state | `localStorage` |
| Firebase Room ID | `localStorage` |
| GitHub sync config & PAT | `localStorage` |

All data is local to your browser unless you configure Firebase or GitHub sync.

---

## Tech Stack

- **TypeScript** + **Vite**
- **Dexie.js** — IndexedDB wrapper
- **Firebase Firestore** — real-time sync
- **Chart.js** — statistics charts
- **vite-plugin-pwa** — Service Worker + Web App Manifest
- Hash-based routing — no server required
- Zero runtime UI framework

---

## License

MIT
