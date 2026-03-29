# Scorekeeper TODO

## Bugs
- [ ] Adding a new player or game creates multiple duplicate copies (reported: added 1 user, got 6 copies; same for games)

## Features
- [ ] Add matches to a game night after it has already started
- [ ] Phase 10 built-in game with special scoring (each player tracks their own phase; no fixed round count)
- [ ] Per-round additional stats capture (e.g. "who went out first" in Five Crowns)
- [ ] Gitea sync support — **done, see Completed below**

## In Progress

## Completed

### Gitea sync support ✅
- [x] `types.ts` — added `provider: 'github' | 'gitea'` and `baseUrl?: string` to `SyncConfig`;
  backfill shim for configs saved before this change
- [x] `github.ts` — refactored in-place; unified adapter for both providers.
  Added `validateSyncConfig()`. `syncToGitHub` / `syncFromGitHub` / `testConnection` work for
  both GitHub and Gitea unchanged API surface.
- [x] `Settings.ts` — provider pill toggle (GitHub | Gitea); Base URL field shown only
  when Gitea selected; PAT label → "API Key" for Gitea; hints updated.
- [x] `main.css` — `.provider-toggle` / `.provider-btn` styles added

## Notes
- Gitea Contents API:
  - GET  `{baseUrl}/api/v1/repos/{owner}/{repo}/contents/{path}?ref={branch}`
  - PUT  `{baseUrl}/api/v1/repos/{owner}/{repo}/contents/{path}`
    body: `{ message, content (base64), sha (required for updates), branch }`
  - Auth: `Authorization: token {apiKey}` (identical format to GitHub)
