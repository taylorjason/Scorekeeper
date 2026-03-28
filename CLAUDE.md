```markdown
# Game Night Scorekeeper - COMPLETE PROJECT SPECIFICATION

## Overview

Static, mobile-first web app for tracking scores and stats during weekly friends' game nights. Supports multiple games, player history, persistent local storage (IndexedDB), and optional GitHub repo sync for backups. Deploys to GitHub Pages.

**Key Goals:**
- Fast, one-handed score entry on phones
- Offline-first with automatic local saves  
- Cross-session stats and history
- Optional cloud backup via GitHub API

## Architecture

```
FRONT-END ONLY: HTML/CSS/JS (or React/Vue → static build)
STORAGE: IndexedDB (primary) + localStorage (config/PAT)
SYNC: GitHub REST API v3 Contents endpoint
OFFLINE: Service Worker + PWA manifest
DEPLOYMENT: GitHub Pages (static hosting)
```

No server, database, or external auth beyond user-provided GitHub PAT.

## Data Model (EXACT)

| Entity | Fields |
|---|---|
| **Player** | `id`, `displayName`, `color`, `active`, `createdAt` |
| **Game** | `id`, `name`, `scoringMode`, `rules`, `targetScore`, `createdAt` |
| **GameNight** | `id`, `title`, `date`, `notes`, `createdAt` |
| **Match** | `id`, `gameNightId`, `gameId`, `playerIds[]`, `status`, `winnerId`, `createdAt` |
| **ScoreEntry** | `id`, `matchId`, `playerId`, `roundNumber`, `value`, `note`, `createdAt` |
| **StatSnapshot** | `playerId`, `gameId`, `wins`, `losses`, `avgScore`, `lastPlayed` |
| **SyncConfig** | `username`, `repo`, `pat`, `filePath`, `branch`, `lastSync` |

**Full app state → single JSON file for sync (`data/game-stats.json`)**

## Core Features

### 1. Main Flows
```
DASHBOARD → NEW GAME NIGHT → SELECT GAME/PLAYERS → SCORE → STATS/HISTORY
```

### 2. Scoring Modes
- [ ] Higher score wins
- [ ] Lower score wins  
- [ ] Points per round
- [ ] Finish order ranking
- [ ] Custom target/bonuses

### 3. Persistence
```
LOCAL (PRIMARY): Auto-save every score entry to IndexedDB
CLOUD (OPTIONAL): GitHub API PUT/GET JSON export
SECURITY: PAT stored in localStorage (warn user)
```

### 4. UI Screens
```
1. DASHBOARD: Recent nights + quick stats
2. NEW NIGHT: Title/date + game/player picker
3. SCORING: Live totals, rankings, big buttons
4. HISTORY: Filter by player/game/night
5. STATS: Wins, avg, trends (charts)
6. SETTINGS: Players/games + GitHub sync
```

## GitHub Sync Details

**User provides:**
```
USERNAME: their GitHub username
REPO: target repo name  
PAT: Personal Access Token (repo/Contents:write scope)
FILE: data/game-stats.json (default)
BRANCH: main (default)
```

**API Calls:**
```javascript
// READ
GET https://api.github.com/repos/{user}/{repo}/contents/{path}
Authorization: Bearer ${pat}

// WRITE  
PUT same URL
{ message: "Game stats sync", content: btoa(JSON.stringify(data)), sha: currentSHA }
```

**Flow:** Settings → Test Connection → Save/Load buttons → Auto-prompt after game night

## Technical Stack

```
RECOMMENDED:
├── TypeScript (safety)
├── Dexie.js (IndexedDB wrapper) 
├── Tailwind CSS (mobile-first)
├── Chart.js (stats viz)
├── Vite (build tool → static)
├── Vanilla JS modules (lightest)

MINIMAL:
├── Vanilla HTML/CSS/JS
├── Native IndexedDB
├── CSS Grid/Flexbox
```

## File Structure (FINAL)

```
├── index.html           # App entry
├── src/
│   ├── app.js          # Main state/UI
│   ├── db.js           # IndexedDB wrapper
│   ├── github.js       # API sync logic
│   ├── models.js       # Data classes
│   ├── scoring.js      # Game logic
│   ├── stats.js        # Calculations
│   └── ui.js           # Screen rendering
├── css/app.css
├── sw.js              # Service Worker
├── manifest.json      # PWA
├── README.md          # User guide
└── docs/
    └── spec.md        # This file
```

## Development Workflow (16+ Commits)

```
PHASE 1 (Foundation)
1. "feat: HTML/CSS mobile structure"
2. "feat: IndexedDB setup + models" 
3. "feat: localStorage sync config"

PHASE 2 (Core UI)
4. "feat: player CRUD"
5. "feat: game definitions"
6. "feat: game night + dashboard"
7. "feat: scoring UI + live totals"

PHASE 3 (Persistence)
8. "feat: auto-save scores"
9. "feat: stats engine"
10. "feat: history + undo"

PHASE 4 (GitHub Sync)
11. "feat: sync settings UI"
12. "feat: GitHub API read"
13. "feat: GitHub API write"

PHASE 5 (Polish)
14. "feat: responsive + a11y"
15. "feat: PWA/offline"
16. "chore: deploy + demo data"
```

## Testing Checklist (Before Each Push)

- [ ] Data persists after refresh/close
- [ ] All scoring modes work
- [ ] Stats calculate correctly
- [ ] GitHub sync (test PAT)
- [ ] Mobile responsive (<600px)
- [ ] Offline after first load
- [ ] No console errors

## README.md Template

```markdown
# Game Night Scorekeeper

Mobile scorekeeper for game nights with stats + GitHub backup.

## Quick Start
1. Open `index.html`
2. Add players/games in Settings
3. Start scoring!

## GitHub Sync  
1. Settings → GitHub Sync
2. Enter username/repo/PAT
3. Test → Sync Now

## Deploy to Pages
```bash
npm run build
git subtree push --prefix dist origin gh-pages
```

## Data Locations
- **Local**: Browser IndexedDB
- **Backup**: Your repo `/data/game-stats.json`
```

## Acceptance Criteria

✅ **Create/track complete game night**  
✅ **Data survives browser restart**  
✅ **Stats/history work across sessions**  
✅ **GitHub sync reads/writes**  
✅ **Works 100% offline**  
✅ **Deploys to GitHub Pages**  
✅ **16+ git commits with history**

---

## LLM BUILD PROMPT

```
Build this Game Night Scorekeeper per EXACT spec above.

1. Follow 16-commit workflow
2. Use data model EXACTLY as tabled  
3. Mobile-first UI (phone = primary)
4. IndexedDB primary, GitHub sync secondary
5. Static output for GitHub Pages
6. Test each commit before push

DELIVER: Complete source code + README + git history.
```

---

**SAVE AS `game-night-scorekeeper.md`** and give to any LLM. Contains everything needed for complete implementation.
```

**Click "Download" or copy-paste to create `game-night-scorekeeper.md`** - ready for LLM development! 🚀

Sources
