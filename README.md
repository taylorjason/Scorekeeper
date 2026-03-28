# Game Night Scorekeeper

A mobile-first Progressive Web App for tracking scores, stats, and history across game nights with friends.

[ScoreKeeper](https://taylorjason.github.io/Scorekeeper/)

## Features

- **Game Nights**: Organize multiple matches into themed sessions
- **Live Scoring**: Real-time score tracking with 5 scoring modes (high, low, rounds, finish-order, custom)
- **Undo**: Remove the last round of scores with one tap
- **History**: Browse all past game nights with expandable match details
- **Stats and Charts**: Win rates, score trends, and per-game breakdowns via Chart.js
- **Leaderboard**: See who is dominating your game nights
- **Player Management**: Add players with custom colors
- **Game Library**: Configure games with specific scoring rules
- **GitHub Sync**: Optional backup/restore to a private GitHub repository
- **Offline-first PWA**: Works without internet after first load
- **Dark/Light theme**: System-preference aware with manual toggle
- **IndexedDB persistence**: All data stored locally via Dexie.js
- **Demo data**: Pre-seeded with example players, games, and nights

## Tech Stack

- TypeScript + Vite
- Dexie.js (IndexedDB wrapper)
- Chart.js (statistics charts)
- vite-plugin-pwa (Service Worker + manifest)
- Hash-based routing (no server required)
- Zero runtime framework dependencies

## Setup and Development

### Prerequisites

- Node.js 18+
- npm 9+

### Install and Run

```bash
npm install
npm run dev
```

App will be available at http://localhost:5173

### Build for Production

```bash
npm run build
```

Output is in the `dist/` directory — a fully static bundle that can be served from any web server or CDN.

### Preview Production Build

```bash
npm run preview
```

## Deploy to GitHub Pages

1. Build the project:
   ```bash
   npm run build
   ```

2. Install gh-pages:
   ```bash
   npm install -g gh-pages
   ```

3. Deploy:
   ```bash
   gh-pages -d dist
   ```

4. Enable GitHub Pages in your repository settings, pointing to the `gh-pages` branch.

The app will be available at `https://<username>.github.io/<repo>/`

## GitHub Sync Setup

The app can optionally sync your data to a GitHub repository as a JSON file. This lets you share data across devices or keep a remote backup.

### Create a Personal Access Token (PAT)

1. Go to GitHub Settings > Developer settings > Personal access tokens > Tokens (classic)
2. Click Generate new token (classic)
3. Give it a name (e.g. `Scorekeeper Sync`)
4. Select the `repo` scope (full control of private repositories)
5. Click Generate token and copy it immediately

### Configure in the App

1. Open the app > Settings > GitHub Sync
2. Enter:
   - Username: Your GitHub username
   - Repository: The repo name to store data in (must exist)
   - Personal Access Token: The PAT you just created
   - File Path: e.g. `scorekeeper.json`
   - Branch: e.g. `main`
3. Click Test to verify the connection
4. Click Push to GitHub to sync your local data up
5. On another device, configure the same settings and click Pull from GitHub

Security Note: Your PAT is stored in localStorage. Only use this on devices you trust, and never share your PAT. Consider creating a dedicated repo for scorekeeper data.

## Data Storage

| Data | Location |
|------|----------|
| Game data (players, games, nights, scores) | IndexedDB (ScorekeeperDB) |
| Theme preference | localStorage (theme) |
| GitHub sync config + PAT | localStorage (scorekeeper_sync_config) |

## PWA Installation

### iOS (Safari)
1. Open the app in Safari
2. Tap the Share button
3. Tap Add to Home Screen
4. Tap Add

### Android (Chrome)
1. Open the app in Chrome
2. Tap the three-dot menu
3. Tap Add to Home Screen or Install app
4. Tap Install

### Desktop (Chrome/Edge)
1. Click the install icon in the address bar
2. Click Install

Once installed, the app works fully offline.

## Scoring Modes

| Mode | Description |
|------|-------------|
| high | Highest cumulative score wins |
| low | Lowest cumulative score wins (e.g. golf) |
| rounds | Enter per-player scores each round; highest total wins |
| finish-order | Players get assigned a finishing position (1st, 2nd...) |
| custom | Same as high; use notes field for custom rules |

## Screenshots

Add screenshots here after first run.

## License

MIT
