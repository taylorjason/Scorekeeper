import {
  getPlayers, createPlayer, updatePlayer, deletePlayer,
  getGames, createGame, updateGame, deleteGame,
  exportAll, importAll, db
} from '../db';
import { importExternalGame } from '../import-game';
import type { ExternalGameData } from '../import-game';
import { getSyncConfig, saveSyncConfig, testConnection, syncToGitHub, syncFromGitHub, validateSyncConfig } from '../github';
import {
  getRoomConfig, saveRoomConfig, clearRoomConfig, generateRoomId,
  buildShareableUrl, initFirebaseSync, teardownFirebaseSync,
  isFirebaseSyncActive, pushNow, pullNow,
} from '../firebase-sync';
import { showToast } from '../toast';
import { escHtml } from '../utils';
import { PLAYER_COLORS } from '../constants';
import type { Player, Game, SyncConfig, FirebaseRoomConfig } from '../types';
import {
  loadFieldConfig, saveFieldConfig, BUILTIN_FIELDS,
} from '../query-engine';
import type { FieldConfig } from '../query-engine';

export class Settings {
  private players: Player[] = [];
  private games: Game[] = [];
  private syncConfig: SyncConfig | null = null;
  private roomConfig: FirebaseRoomConfig | null = null;
  private editingPlayerId: number | null = null;
  private editingGameId: number | null = null;
  private activeTab: 'players' | 'games' | 'sync' | 'data' | 'stats' = 'players';
  private fieldConfig: FieldConfig = loadFieldConfig();

  async load(): Promise<void> {
    const [players, games] = await Promise.all([getPlayers(), getGames()]);
    this.players = players;
    this.games = games;
    this.syncConfig = getSyncConfig();
    this.roomConfig = getRoomConfig();
    this.fieldConfig = loadFieldConfig();
  }

  private formatTimestamp(ts: number | undefined): string {
    if (!ts) return 'Never';
    return new Date(ts).toLocaleString();
  }

  render(): string {
    const theme = document.documentElement.getAttribute('data-theme') ?? 'dark';
    const isDark = theme !== 'light';
    const t = this.activeTab;
    const panel = (id: typeof t) => id === t ? '' : 'style="display:none"';

    return `
      <main class="view" aria-label="Settings">
        <header class="page-header">
          <h1 class="page-title">Settings</h1>
        </header>

        <div class="stats-main-tabs" role="tablist" aria-label="Settings sections">
          <button class="stats-main-tab-btn ${t === 'players' ? 'active' : ''}" data-settings-tab="players" role="tab">Players</button>
          <button class="stats-main-tab-btn ${t === 'games'   ? 'active' : ''}" data-settings-tab="games"   role="tab">Games</button>
          <button class="stats-main-tab-btn ${t === 'sync'    ? 'active' : ''}" data-settings-tab="sync"    role="tab">Sync</button>
          <button class="stats-main-tab-btn ${t === 'data'    ? 'active' : ''}" data-settings-tab="data"    role="tab">Data</button>
          <button class="stats-main-tab-btn ${t === 'stats'   ? 'active' : ''}" data-settings-tab="stats"   role="tab">Stats Fields</button>
        </div>

        <!-- Players tab -->
        <div id="settings-tab-players" role="tabpanel" ${panel('players')}>
          <div id="players-list">${this.renderPlayersList()}</div>
          <div class="card mt-4" id="add-player-form-container">
            <h3 class="card-title mb-3">${this.editingPlayerId !== null ? 'Edit Player' : 'Add Player'}</h3>
            ${this.renderPlayerForm()}
          </div>
        </div>

        <!-- Games tab -->
        <div id="settings-tab-games" role="tabpanel" ${panel('games')}>
          <div id="games-list">${this.renderGamesList()}</div>
          <div class="card mt-4" id="add-game-form-container">
            <h3 class="card-title mb-3">${this.editingGameId !== null ? 'Edit Game' : 'Add Game'}</h3>
            ${this.renderGameForm()}
          </div>
        </div>

        <!-- Sync tab -->
        <div id="settings-tab-sync" role="tabpanel" ${panel('sync')}>
          <section class="settings-section" aria-labelledby="live-sync-heading">
            <h2 class="settings-section-title" id="live-sync-heading">
              <span>⚡</span> Live Sync
              ${isFirebaseSyncActive() ? '<span class="sync-live-badge">● Live</span>' : ''}
            </h2>
            ${this.renderFirebaseSection()}
          </section>

          <section class="settings-section" aria-labelledby="git-sync-heading">
            <h2 class="settings-section-title" id="git-sync-heading">
              <span>☁️</span> Git Backup
            </h2>
            <div class="alert alert-warning mb-3">
              <span>⚠️</span>
              <span>Your API key / token is stored in localStorage. Never share it or use it on untrusted devices.</span>
            </div>
            <div class="card">
              <form id="sync-form" novalidate>
                <div class="form-group">
                  <label class="form-label">Provider</label>
                  <div class="provider-toggle" role="group" aria-label="Sync provider">
                    <button type="button" class="provider-btn ${(this.syncConfig?.provider ?? 'github') === 'github' ? 'active' : ''}"
                      id="provider-github" data-provider="github" aria-pressed="${(this.syncConfig?.provider ?? 'github') === 'github'}">GitHub</button>
                    <button type="button" class="provider-btn ${this.syncConfig?.provider === 'gitea' ? 'active' : ''}"
                      id="provider-gitea" data-provider="gitea" aria-pressed="${this.syncConfig?.provider === 'gitea'}">Gitea</button>
                  </div>
                </div>
                <div class="form-group" id="sync-baseurl-group" style="display:${this.syncConfig?.provider === 'gitea' ? 'block' : 'none'}">
                  <label class="form-label" for="sync-baseurl">Gitea Base URL</label>
                  <input class="form-input" type="url" id="sync-baseurl"
                    placeholder="https://gitea.example.com" autocomplete="off"
                    value="${this.syncConfig?.baseUrl ? escHtml(this.syncConfig.baseUrl) : ''}" />
                  <span class="form-hint">Your Gitea instance URL, no trailing slash</span>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label" for="sync-username">Username</label>
                    <input class="form-input" type="text" id="sync-username" placeholder="octocat" autocomplete="off"
                      value="${this.syncConfig ? escHtml(this.syncConfig.username) : ''}" />
                  </div>
                  <div class="form-group">
                    <label class="form-label" for="sync-repo">Repository</label>
                    <input class="form-input" type="text" id="sync-repo" placeholder="my-scores" autocomplete="off"
                      value="${this.syncConfig ? escHtml(this.syncConfig.repo) : ''}" />
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label" for="sync-pat" id="sync-pat-label">
                    ${this.syncConfig?.provider === 'gitea' ? 'API Key' : 'Personal Access Token'}
                  </label>
                  <input class="form-input" type="password" id="sync-pat"
                    placeholder="${this.syncConfig?.provider === 'gitea' ? 'your-api-key' : 'ghp_xxxxxxxxxxxxxxxxxxxx'}"
                    autocomplete="off" value="${this.syncConfig ? escHtml(this.syncConfig.pat) : ''}" />
                  <span class="form-hint" id="sync-pat-hint">
                    ${this.syncConfig?.provider === 'gitea'
                      ? 'Settings → Applications → Generate Token (needs repository read/write)'
                      : 'Needs <code>repo</code> scope'}
                  </span>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label" for="sync-filepath">File Path</label>
                    <input class="form-input" type="text" id="sync-filepath" placeholder="scorekeeper.json"
                      value="${this.syncConfig ? escHtml(this.syncConfig.filePath) : 'scorekeeper.json'}" />
                  </div>
                  <div class="form-group">
                    <label class="form-label" for="sync-branch">Branch</label>
                    <input class="form-input" type="text" id="sync-branch" placeholder="main"
                      value="${this.syncConfig ? escHtml(this.syncConfig.branch) : 'main'}" />
                  </div>
                </div>
                <div class="text-sm text-muted mb-3">
                  Last sync: <strong id="last-sync-time">${this.formatTimestamp(this.syncConfig?.lastSync)}</strong>
                </div>
                <div class="btn-group">
                  <button type="button" class="btn btn-secondary" id="test-connection-btn">Test</button>
                  <button type="button" class="btn btn-primary flex-1" id="sync-to-github-btn">↑ Push</button>
                  <button type="button" class="btn btn-secondary flex-1" id="sync-from-github-btn">↓ Pull</button>
                </div>
              </form>
            </div>
          </section>
        </div>

        <!-- Data tab -->
        <div id="settings-tab-data" role="tabpanel" ${panel('data')}>
          <section class="settings-section" aria-labelledby="data-heading">
            <h2 class="settings-section-title" id="data-heading"><span>💾</span> Data</h2>
            <div class="card">
              <div class="btn-group" style="flex-direction:column;gap:0.625rem">
                <button class="btn btn-secondary btn-full" id="export-btn">📤 Export All Data (JSON)</button>
                <button class="btn btn-secondary btn-full" id="import-btn">📥 Import Data (JSON)</button>
                <input type="file" id="import-file-input" accept=".json,.JSON,application/json" style="display:none" aria-label="Import JSON file" />
                <button class="btn btn-secondary btn-full" id="import-external-btn">📥 Import External Game</button>
                <input type="file" id="import-external-file-input" accept=".json,.JSON,.txt,.TXT,application/json,text/plain" style="display:none" aria-label="Import external game file" />
                <div class="divider" style="margin:0.25rem 0"></div>
                <button class="btn btn-danger btn-full" id="clear-data-btn">🗑️ Clear All Data</button>
              </div>
            </div>
          </section>

          <section class="settings-section" aria-labelledby="appearance-heading">
            <h2 class="settings-section-title" id="appearance-heading"><span>🎨</span> Appearance</h2>
            <div class="card">
              <div class="toggle-row">
                <div>
                  <div class="font-semibold">Dark Mode</div>
                  <div class="text-sm text-muted">Use dark theme</div>
                </div>
                <label class="toggle" aria-label="Toggle dark mode">
                  <input type="checkbox" id="theme-toggle" ${isDark ? 'checked' : ''} role="switch" aria-checked="${isDark}" />
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>
          </section>

          <section class="settings-section" aria-labelledby="about-heading">
            <h2 class="settings-section-title" id="about-heading"><span>ℹ️</span> About</h2>
            <div class="card">
              <div class="text-sm" style="display:flex;flex-direction:column;gap:0.4rem">
                <div class="flex items-center gap-2">
                  <span class="text-muted">Version</span>
                  <span class="font-semibold">v${__APP_VERSION__}</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-muted">Build</span>
                  <span class="font-semibold">${__BUILD_NUMBER__}</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-muted">Built</span>
                  <span class="font-semibold">${new Date(__BUILD_TIME__).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </section>
        </div>

        <!-- Stats Fields tab -->
        <div id="settings-tab-stats" role="tabpanel" ${panel('stats')}>
          ${this.renderStatsFieldsTab()}
        </div>

        <div style="height:1rem"></div>
      </main>
    `;
  }

  private renderStatsFieldsTab(): string {
    const cfg = this.fieldConfig;

    const builtinRows = cfg.builtinOrder.map((key, idx) => {
      const def = BUILTIN_FIELDS.find(f => f.key === key);
      if (!def) return '';
      const enabled = cfg.builtinEnabled[key] !== false;
      return `
        <div class="sf-row" data-field-key="${escHtml(key)}">
          <label class="toggle sf-toggle" aria-label="Enable ${escHtml(def.label)}">
            <input type="checkbox" class="sf-builtin-toggle" data-field-key="${escHtml(key)}" ${enabled ? 'checked' : ''} role="switch">
            <span class="toggle-slider"></span>
          </label>
          <span class="sf-label ${enabled ? '' : 'text-muted'}">${escHtml(def.label)}</span>
          <span class="sf-type-pill">${def.type}</span>
          <div class="sf-reorder">
            <button class="btn btn-icon btn-sm sf-up" data-field-key="${escHtml(key)}" ${idx === 0 ? 'disabled' : ''} aria-label="Move up">↑</button>
            <button class="btn btn-icon btn-sm sf-down" data-field-key="${escHtml(key)}" ${idx === cfg.builtinOrder.length - 1 ? 'disabled' : ''} aria-label="Move down">↓</button>
          </div>
        </div>`;
    }).join('');

    const customRows = cfg.customFields.map(cf => `
      <div class="sf-row sf-custom-row">
        <span class="sf-label">${escHtml(cf.label)}</span>
        <span class="sf-type-pill">${cf.type}</span>
        <code class="sf-expr text-muted">${escHtml(cf.expression)}</code>
        <div class="sf-reorder">
          <button class="btn btn-sm btn-secondary sf-edit-custom" data-custom-id="${escHtml(cf.id)}" style="font-size:0.75rem;padding:2px 8px">Edit</button>
          <button class="btn btn-sm btn-danger sf-del-custom" data-custom-id="${escHtml(cf.id)}" style="font-size:0.75rem;padding:2px 8px">✕</button>
        </div>
      </div>`).join('');

    return `
      <section class="settings-section" aria-labelledby="sf-builtin-heading">
        <h2 class="settings-section-title" id="sf-builtin-heading"><span>🔧</span> Built-in Filter Fields</h2>
        <p class="text-sm text-muted mb-2">Enable or disable fields that appear in the Stats Explorer condition builder. Use the arrows to reorder.</p>
        <div class="card sf-list" id="sf-builtin-list">
          ${builtinRows || '<p class="text-sm text-muted" style="padding:0.5rem">No built-in fields found.</p>'}
        </div>
      </section>

      <section class="settings-section" aria-labelledby="sf-custom-heading">
        <h2 class="settings-section-title" id="sf-custom-heading"><span>✨</span> Custom Fields</h2>
        <p class="text-sm text-muted mb-2">Write a JavaScript expression using the <code>row</code> variable to create any derived field.
          E.g. <code>row.playerCount > 3</code> (boolean) or <code>row.matchIndexInNight + 1</code> (number).</p>
        <div class="card sf-list mb-2" id="sf-custom-list">
          ${customRows || '<p class="text-sm text-muted" style="padding:0.5rem 0">No custom fields yet.</p>'}
        </div>
        <button class="btn btn-secondary btn-sm" id="sf-add-custom-btn">+ Add Custom Field</button>
      </section>

      <!-- Custom field editor (hidden by default) -->
      <div id="sf-custom-editor" style="display:none">
        <section class="settings-section">
          <div class="card">
            <h3 class="card-title mb-3" id="sf-editor-title">New Custom Field</h3>
            <div class="form-group">
              <label class="form-label" for="sf-cf-label">Name</label>
              <input class="form-input" type="text" id="sf-cf-label" placeholder="e.g. Big Match Night" />
            </div>
            <div class="form-group">
              <label class="form-label" for="sf-cf-type">Returns</label>
              <select class="form-input" id="sf-cf-type">
                <option value="boolean">Boolean (yes/no condition)</option>
                <option value="number">Number (use with =, >, &lt;, etc.)</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="sf-cf-expr">Expression <span class="text-muted">(JS, variable: <code>row</code>)</span></label>
              <textarea class="form-input" id="sf-cf-expr" rows="3"
                placeholder="row.playerCount > 3"
                style="font-family:monospace;font-size:0.85rem;resize:vertical"></textarea>
              <div class="form-hint">Available: row.playerCount, row.matchIndexInNight, row.dayOfWeek, row.month, row.year, row.quarter, row.isWinner, row.isFirstOut, row.roundNumber, row.value, row.scoringMode, row.gameName, row.playerName, row.nightDate, row.matchPlayerIds</div>
            </div>
            <div id="sf-cf-test-result" style="min-height:1.5rem;font-size:0.85rem;margin-bottom:0.5rem"></div>
            <div class="btn-group">
              <button class="btn btn-secondary" id="sf-cf-cancel">Cancel</button>
              <button class="btn btn-secondary" id="sf-cf-test">Test Expression</button>
              <button class="btn btn-primary flex-1" id="sf-cf-save">Save Field</button>
            </div>
          </div>
        </section>
      </div>
    `;
  }

  private renderFirebaseSection(): string {
    const cfg = this.roomConfig;
    const active = isFirebaseSyncActive();

    if (cfg && active) {
      const shareUrl = buildShareableUrl(cfg);
      return `
        <div class="card">
          <div class="toggle-row mb-3">
            <div>
              <div class="font-semibold">Room ID</div>
              <div class="text-sm text-muted font-mono">${escHtml(cfg.roomId)}</div>
            </div>
            <span class="badge badge-success">Connected</span>
          </div>

          <div class="text-sm text-muted mb-3">
            Last sync: <strong id="fb-last-sync">${this.formatTimestamp(cfg.lastSync)}</strong>
          </div>

          <div class="form-group">
            <label class="form-label">Share with friends</label>
            <div class="input-group">
              <input class="form-input" type="text" id="fb-share-url"
                readonly value="${escHtml(shareUrl)}" aria-label="Shareable room link" />
              <button class="btn btn-secondary" id="fb-copy-url-btn" type="button">Copy</button>
            </div>
            <span class="form-hint">Anyone who opens this link joins your room automatically.</span>
          </div>

          <div id="fb-qr-container" class="mb-3" style="text-align:center"></div>
          <button class="btn btn-secondary btn-full mb-2" id="fb-show-qr-btn" type="button">
            Show QR Code
          </button>

          <div class="btn-group mb-2">
            <button class="btn btn-primary flex-1" id="fb-push-btn" type="button">↑ Push Now</button>
            <button class="btn btn-secondary flex-1" id="fb-pull-btn" type="button">↓ Pull Now</button>
          </div>
          <button class="btn btn-danger btn-full" id="fb-disconnect-btn" type="button">
            Disconnect
          </button>
        </div>
      `;
    }

    // Not connected — show setup form
    const pendingRoomId = cfg?.roomId ?? generateRoomId();

    return `
      <div class="alert alert-info mb-3">
        <span>ℹ️</span>
        <span>Real-time sync for your friend group — no login needed. Create a room or enter one someone shared with you.</span>
      </div>

      <div class="card">
        <form id="fb-config-form" novalidate>
          <div class="form-group">
            <label class="form-label" for="fb-room-id">Room ID</label>
            <div class="input-group">
              <input class="form-input font-mono" type="text" id="fb-room-id"
                value="${escHtml(pendingRoomId)}" autocomplete="off"
                placeholder="Enter a room ID or generate one" />
              <button class="btn btn-secondary" type="button" id="fb-new-room-btn">New</button>
            </div>
            <span class="form-hint">Share this ID with friends so you all sync to the same room.</span>
          </div>
          <button class="btn btn-primary btn-full" type="submit" id="fb-connect-btn">
            Connect &amp; Sync
          </button>
        </form>
      </div>
    `;
  }

  private renderPlayersList(): string {
    if (this.players.length === 0) {
      return `<p class="text-sm text-muted">No players yet. Add one below.</p>`;
    }
    return this.players.map(p => `
      <div class="player-list-item" data-player-id="${p.id}">
        <div class="player-avatar player-avatar-sm" style="background:${p.color}">
          ${p.displayName.charAt(0).toUpperCase()}
        </div>
        <div class="flex-1">
          <div class="font-semibold text-sm">${escHtml(p.displayName)}</div>
          <div class="text-xs text-muted">${p.active ? 'Active' : 'Inactive'}</div>
        </div>
        <div class="actions">
          <button class="btn btn-icon btn-sm edit-player-btn" data-player-id="${p.id}" aria-label="Edit ${escHtml(p.displayName)}">
            ✏️
          </button>
          <button class="btn btn-icon btn-sm delete-player-btn" data-player-id="${p.id}" aria-label="Delete ${escHtml(p.displayName)}">
            🗑️
          </button>
        </div>
      </div>
    `).join('');
  }

  private renderPlayerForm(player?: Player): string {
    const name = player?.displayName ?? '';
    const selectedColor = player?.color ?? PLAYER_COLORS[0];
    const isActive = player?.active ?? true;

    const colorSwatches = PLAYER_COLORS.map(c => `
      <div class="color-swatch ${c === selectedColor ? 'selected' : ''}"
        style="background:${c}" data-color="${c}" role="option" aria-label="Color ${c}"
        aria-selected="${c === selectedColor}" tabindex="0"></div>
    `).join('');

    return `
      <form id="player-form" novalidate>
        <input type="hidden" id="player-editing-id" value="${player?.id ?? ''}" />
        <div class="form-group">
          <label class="form-label" for="player-name">Name <span aria-hidden="true">*</span></label>
          <input class="form-input" type="text" id="player-name" placeholder="e.g. Alice"
            value="${escHtml(name)}" required maxlength="30" autocomplete="off" />
          <span class="form-error" id="player-name-error" role="alert" aria-live="polite"></span>
        </div>
        <div class="form-group">
          <label class="form-label">Color</label>
          <input type="hidden" id="player-color" value="${selectedColor}" />
          <div class="color-options" role="listbox" aria-label="Player color">
            ${colorSwatches}
          </div>
        </div>
        <div class="form-group">
          <label class="checkbox-item" for="player-active">
            <input type="checkbox" id="player-active" ${isActive ? 'checked' : ''} />
            <span>Active player</span>
          </label>
        </div>
        <div class="btn-group">
          <button type="submit" class="btn btn-primary flex-1" id="save-player-btn">
            ${player ? 'Update Player' : 'Add Player'}
          </button>
          ${player ? `<button type="button" class="btn btn-secondary" id="cancel-edit-player-btn">Cancel</button>` : ''}
        </div>
      </form>
    `;
  }

  private renderGamesList(): string {
    if (this.games.length === 0) {
      return `<p class="text-sm text-muted">No games yet. Add one below.</p>`;
    }
    return this.games.map(g => `
      <div class="game-list-item" data-game-id="${g.id}">
        <span style="font-size:1.25rem">🎯</span>
        <div class="flex-1">
          <div class="font-semibold text-sm">${escHtml(g.name)}</div>
          <div class="text-xs text-muted">${g.scoringMode} scoring${g.roundLabels?.length ? ` · ${g.roundLabels.length} round labels` : ''}${g.rules ? ' · ' + escHtml(g.rules.substring(0, 40)) : ''}</div>
        </div>
        <div class="actions">
          <button class="btn btn-icon btn-sm edit-game-btn" data-game-id="${g.id}" aria-label="Edit ${escHtml(g.name)}">
            ✏️
          </button>
          <button class="btn btn-icon btn-sm delete-game-btn" data-game-id="${g.id}" aria-label="Delete ${escHtml(g.name)}">
            🗑️
          </button>
        </div>
      </div>
    `).join('');
  }

  private renderGameForm(game?: Game): string {
    const name = game?.name ?? '';
    const mode = game?.scoringMode ?? 'high';
    const rules = game?.rules ?? '';
    const target = game?.targetScore ?? '';
    const labels = (game?.roundLabels ?? []).join('\n');

    return `
      <form id="game-form" novalidate>
        <input type="hidden" id="game-editing-id" value="${game?.id ?? ''}" />
        <div class="form-group">
          <label class="form-label" for="game-name">Game Name <span aria-hidden="true">*</span></label>
          <input class="form-input" type="text" id="game-name" placeholder="e.g. Five Crowns"
            value="${escHtml(name)}" required maxlength="50" autocomplete="off" />
          <span class="form-error" id="game-name-error" role="alert" aria-live="polite"></span>
        </div>
        <div class="form-group">
          <label class="form-label" for="game-mode">Scoring Mode</label>
          <select class="form-select" id="game-mode">
            <option value="high" ${mode === 'high' ? 'selected' : ''}>High score wins</option>
            <option value="low" ${mode === 'low' ? 'selected' : ''}>Low score wins</option>
            <option value="rounds" ${mode === 'rounds' ? 'selected' : ''}>Rounds (per-round input)</option>
            <option value="finish-order" ${mode === 'finish-order' ? 'selected' : ''}>Finish order (1st, 2nd...)</option>
            <option value="custom" ${mode === 'custom' ? 'selected' : ''}>Custom</option>
            <option value="phase10" ${mode === 'phase10' ? 'selected' : ''}>Phase 10 (track phases + penalty points)</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="game-round-labels">Round Labels (optional)</label>
          <textarea class="form-textarea" id="game-round-labels"
            placeholder="One label per line, e.g.&#10;Phase 1&#10;Phase 2&#10;Phase 3"
            rows="4">${escHtml(labels)}</textarea>
          <span class="form-hint">Names each round — great for Phase 10, Five Crowns, etc. Leave blank to use "Round 1, Round 2…"</span>
        </div>
        <div class="form-group">
          <label class="form-label" for="game-rules">Rules / Notes (optional)</label>
          <textarea class="form-textarea" id="game-rules" placeholder="Any rule notes..."
            maxlength="200" rows="2">${escHtml(rules)}</textarea>
        </div>
        <div class="form-group">
          <label class="form-label" for="game-target">Target Score (optional)</label>
          <input class="form-input" type="number" id="game-target"
            placeholder="e.g. 10" value="${target}" min="1" />
          <span class="form-hint">Win condition score, if applicable</span>
        </div>
        <div class="btn-group">
          <button type="submit" class="btn btn-primary flex-1" id="save-game-btn">
            ${game ? 'Update Game' : 'Add Game'}
          </button>
          ${game ? `<button type="button" class="btn btn-secondary" id="cancel-edit-game-btn">Cancel</button>` : ''}
        </div>
      </form>
    `;
  }

  afterRender(): void {
    document.querySelectorAll<HTMLButtonElement>('[data-settings-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.activeTab = btn.dataset['settingsTab'] as typeof this.activeTab;
        document.querySelectorAll('[data-settings-tab]').forEach(b =>
          b.classList.toggle('active', b === btn)
        );
        document.querySelectorAll<HTMLElement>('[id^="settings-tab-"]').forEach(panel => {
          panel.style.display = panel.id === `settings-tab-${this.activeTab}` ? '' : 'none';
        });
      });
    });

    this.bindPlayerForm();
    this.bindGameForm();
    this.bindFirebaseSection();
    this.bindSyncForm();
    this.bindDataButtons();
    this.bindThemeToggle();
    this.bindColorSwatches();
    this.bindStatsFields();
  }

  private _editingCustomId: string | null = null;

  private bindStatsFields(): void {
    // Built-in toggles
    document.querySelectorAll<HTMLInputElement>('.sf-builtin-toggle').forEach(cb => {
      cb.addEventListener('change', () => {
        const key = cb.dataset['fieldKey']!;
        this.fieldConfig.builtinEnabled[key] = cb.checked;
        saveFieldConfig(this.fieldConfig);
        this._refreshStatsTab();
      });
    });

    // Reorder up
    document.querySelectorAll<HTMLButtonElement>('.sf-up').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset['fieldKey']!;
        const idx = this.fieldConfig.builtinOrder.indexOf(key);
        if (idx > 0) {
          [this.fieldConfig.builtinOrder[idx - 1], this.fieldConfig.builtinOrder[idx]] =
          [this.fieldConfig.builtinOrder[idx],     this.fieldConfig.builtinOrder[idx - 1]];
          saveFieldConfig(this.fieldConfig);
          this._refreshStatsTab();
        }
      });
    });

    // Reorder down
    document.querySelectorAll<HTMLButtonElement>('.sf-down').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset['fieldKey']!;
        const idx = this.fieldConfig.builtinOrder.indexOf(key);
        const len = this.fieldConfig.builtinOrder.length;
        if (idx < len - 1) {
          [this.fieldConfig.builtinOrder[idx], this.fieldConfig.builtinOrder[idx + 1]] =
          [this.fieldConfig.builtinOrder[idx + 1], this.fieldConfig.builtinOrder[idx]];
          saveFieldConfig(this.fieldConfig);
          this._refreshStatsTab();
        }
      });
    });

    // Delete custom field
    document.querySelectorAll<HTMLButtonElement>('.sf-del-custom').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset['customId']!;
        this.fieldConfig.customFields = this.fieldConfig.customFields.filter(cf => cf.id !== id);
        saveFieldConfig(this.fieldConfig);
        this._refreshStatsTab();
      });
    });

    // Edit custom field
    document.querySelectorAll<HTMLButtonElement>('.sf-edit-custom').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset['customId']!;
        const cf = this.fieldConfig.customFields.find(c => c.id === id);
        if (!cf) return;
        this._editingCustomId = id;
        this._showCustomEditor(cf.label, cf.type, cf.expression);
      });
    });

    // Add custom field button
    document.getElementById('sf-add-custom-btn')?.addEventListener('click', () => {
      this._editingCustomId = null;
      this._showCustomEditor('', 'boolean', '');
    });

    // Editor: cancel
    document.getElementById('sf-cf-cancel')?.addEventListener('click', () => {
      this._hideCustomEditor();
    });

    // Editor: test expression
    document.getElementById('sf-cf-test')?.addEventListener('click', () => {
      const expr = (document.getElementById('sf-cf-expr') as HTMLTextAreaElement)?.value ?? '';
      const resultEl = document.getElementById('sf-cf-test-result');
      if (!resultEl) return;
      try {
        // eslint-disable-next-line no-new-func
        const fn = new Function('row', `"use strict"; return (${expr});`);
        const sampleRow = { playerCount: 4, matchIndexInNight: 0, dayOfWeek: 5, month: 6, year: 2025,
          quarter: 2, isWinner: true, isFirstOut: false, roundNumber: 3, value: 42,
          scoringMode: 'high', gameName: 'Catan', playerName: 'Player', nightDate: '2025-06-01',
          matchPlayerIds: [1, 2, 3, 4] };
        const result = fn(sampleRow);
        resultEl.innerHTML = `<span style="color:var(--success)">✓ Result on sample row: <strong>${JSON.stringify(result)}</strong></span>`;
      } catch (e) {
        resultEl.innerHTML = `<span style="color:var(--danger)">✗ Error: ${escHtml(String(e))}</span>`;
      }
    });

    // Editor: save
    document.getElementById('sf-cf-save')?.addEventListener('click', () => {
      const label = (document.getElementById('sf-cf-label') as HTMLInputElement)?.value.trim() ?? '';
      const type  = (document.getElementById('sf-cf-type')  as HTMLSelectElement)?.value as 'boolean' | 'number';
      const expr  = (document.getElementById('sf-cf-expr')  as HTMLTextAreaElement)?.value.trim() ?? '';
      if (!label) { showToast('Enter a field name', 'error'); return; }
      if (!expr)  { showToast('Enter an expression', 'error'); return; }

      const key = 'custom_' + label.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 30);

      if (this._editingCustomId) {
        const idx = this.fieldConfig.customFields.findIndex(cf => cf.id === this._editingCustomId);
        if (idx !== -1) this.fieldConfig.customFields[idx] = { id: this._editingCustomId, key, label, type, expression: expr };
      } else {
        const id = `cf-${Date.now()}`;
        this.fieldConfig.customFields.push({ id, key, label, type, expression: expr });
      }

      saveFieldConfig(this.fieldConfig);
      this._editingCustomId = null;
      this._refreshStatsTab();
    });
  }

  private _showCustomEditor(label: string, type: string, expr: string): void {
    const editor = document.getElementById('sf-custom-editor');
    if (!editor) return;
    editor.style.display = '';
    (document.getElementById('sf-cf-label') as HTMLInputElement).value = label;
    (document.getElementById('sf-cf-type')  as HTMLSelectElement).value = type;
    (document.getElementById('sf-cf-expr')  as HTMLTextAreaElement).value = expr;
    const title = document.getElementById('sf-editor-title');
    if (title) title.textContent = label ? `Edit: ${label}` : 'New Custom Field';
    const result = document.getElementById('sf-cf-test-result');
    if (result) result.innerHTML = '';
    editor.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  private _hideCustomEditor(): void {
    const editor = document.getElementById('sf-custom-editor');
    if (editor) editor.style.display = 'none';
    this._editingCustomId = null;
  }

  private _refreshStatsTab(): void {
    const panel = document.getElementById('settings-tab-stats');
    if (!panel) return;
    panel.innerHTML = this.renderStatsFieldsTab();
    this.bindStatsFields();
  }

  private bindFirebaseSection(): void {
    const cfg = this.roomConfig;
    const active = isFirebaseSyncActive();

    if (cfg && active) {
      // ── Connected state bindings ──────────────────────────────────────────

      document.getElementById('fb-copy-url-btn')?.addEventListener('click', () => {
        const input = document.getElementById('fb-share-url') as HTMLInputElement;
        navigator.clipboard.writeText(input.value).then(() => {
          showToast('Link copied!', 'success');
        }).catch(() => {
          input.select();
          document.execCommand('copy');
          showToast('Link copied!', 'success');
        });
      });

      document.getElementById('fb-show-qr-btn')?.addEventListener('click', async () => {
        const btn = document.getElementById('fb-show-qr-btn') as HTMLButtonElement;
        const container = document.getElementById('fb-qr-container');
        if (!container) return;
        if (container.innerHTML) { container.innerHTML = ''; btn.textContent = 'Show QR Code'; return; }
        btn.textContent = 'Generating…';
        try {
          const { default: QRCode } = await import('qrcode');
          const shareUrl = buildShareableUrl(cfg);
          const svg = await QRCode.toString(shareUrl, { type: 'svg', margin: 1, width: 220 });
          container.innerHTML = svg;
          btn.textContent = 'Hide QR Code';
        } catch (err) {
          console.error('QR generation failed:', err);
          btn.textContent = 'Show QR Code';
          showToast('QR generation failed', 'error');
        }
      });

      document.getElementById('fb-push-btn')?.addEventListener('click', async () => {
        const btn = document.getElementById('fb-push-btn') as HTMLButtonElement;
        btn.disabled = true; btn.textContent = 'Pushing…';
        try {
          const result = await pushNow();
          showToast(result.message, result.ok ? 'success' : 'error');
          if (result.ok) {
            this.roomConfig = getRoomConfig();
            const timeEl = document.getElementById('fb-last-sync');
            if (timeEl) timeEl.textContent = this.formatTimestamp(this.roomConfig?.lastSync);
          }
        } finally { btn.disabled = false; btn.textContent = '↑ Push Now'; }
      });

      document.getElementById('fb-pull-btn')?.addEventListener('click', async () => {
        const btn = document.getElementById('fb-pull-btn') as HTMLButtonElement;
        btn.disabled = true; btn.textContent = 'Pulling…';
        try {
          const result = await pullNow();
          showToast(result.message, result.ok ? 'success' : 'error');
          if (result.ok) {
            this.roomConfig = getRoomConfig();
            const timeEl = document.getElementById('fb-last-sync');
            if (timeEl) timeEl.textContent = this.formatTimestamp(this.roomConfig?.lastSync);
          }
        } finally { btn.disabled = false; btn.textContent = '↓ Pull Now'; }
      });

      document.getElementById('fb-disconnect-btn')?.addEventListener('click', () => {
        if (!confirm('Disconnect from live sync? Local data is kept, sync stops.')) return;
        teardownFirebaseSync();
        clearRoomConfig();
        this.roomConfig = null;
        const container = document.getElementById('view-container');
        if (container) { container.innerHTML = this.render(); this.afterRender(); }
        showToast('Disconnected from live sync', 'info');
      });

      return;
    }

    // ── Not connected state bindings ──────────────────────────────────────────

    document.getElementById('fb-new-room-btn')?.addEventListener('click', () => {
      const input = document.getElementById('fb-room-id') as HTMLInputElement;
      if (input) input.value = generateRoomId();
    });

    const form = document.getElementById('fb-config-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const roomId = (document.getElementById('fb-room-id') as HTMLInputElement).value.trim();

      if (!roomId) {
        showToast('Room ID is required', 'error');
        return;
      }

      const config: FirebaseRoomConfig = { roomId };
      saveRoomConfig(config);
      this.roomConfig = config;

      const btn = document.getElementById('fb-connect-btn') as HTMLButtonElement;
      btn.disabled = true; btn.textContent = 'Connecting…';

      try {
        const result = await initFirebaseSync(config, () => {
          // Remote update: reload this settings view
          const container = document.getElementById('view-container');
          if (container) { container.innerHTML = this.render(); this.afterRender(); }
        });

        if (result.ok) {
          showToast(result.message, 'success');
          this.roomConfig = getRoomConfig();
          const container = document.getElementById('view-container');
          if (container) { container.innerHTML = this.render(); this.afterRender(); }
        } else {
          showToast(result.message, 'error');
          btn.disabled = false; btn.textContent = 'Connect & Sync';
        }
      } catch (err) {
        showToast(`Connection error: ${err instanceof Error ? err.message : String(err)}`, 'error');
        btn.disabled = false; btn.textContent = 'Connect & Sync';
      }
    });
  }

  private bindColorSwatches(): void {
    document.querySelectorAll<HTMLElement>('.color-swatch').forEach(swatch => {
      const activate = () => {
        const color = swatch.dataset['color'] ?? '';
        document.querySelectorAll('.color-swatch').forEach(s => {
          s.classList.remove('selected');
          s.setAttribute('aria-selected', 'false');
        });
        swatch.classList.add('selected');
        swatch.setAttribute('aria-selected', 'true');
        const hiddenInput = document.getElementById('player-color') as HTMLInputElement;
        if (hiddenInput) hiddenInput.value = color;
      };
      swatch.addEventListener('click', activate);
      swatch.addEventListener('keydown', (e) => {
        if ((e as KeyboardEvent).key === 'Enter' || (e as KeyboardEvent).key === ' ') {
          e.preventDefault();
          activate();
        }
      });
    });
  }

  private bindPlayerForm(): void {
    // Edit buttons
    document.querySelectorAll('.edit-player-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const pid = parseInt((e.currentTarget as HTMLElement).dataset['playerId'] ?? '', 10);
        this.editingPlayerId = pid;
        const player = this.players.find(p => p.id === pid);
        const container = document.getElementById('add-player-form-container');
        if (container && player) {
          const title = container.querySelector('h3');
          if (title) title.textContent = 'Edit Player';
          const formEl = container.querySelector('#player-form');
          if (formEl) formEl.outerHTML = this.renderPlayerForm(player);
          container.innerHTML = `<h3 class="card-title mb-3">Edit Player</h3>${this.renderPlayerForm(player)}`;
          this.bindColorSwatches();
          this.bindPlayerFormSubmit();
          document.getElementById('cancel-edit-player-btn')?.addEventListener('click', () => {
            this.editingPlayerId = null;
            container.innerHTML = `<h3 class="card-title mb-3">Add Player</h3>${this.renderPlayerForm()}`;
            this.bindColorSwatches();
            this.bindPlayerFormSubmit();
          });
          container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      });
    });

    // Delete buttons
    document.querySelectorAll('.delete-player-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const pid = parseInt((e.currentTarget as HTMLElement).dataset['playerId'] ?? '', 10);
        const player = this.players.find(p => p.id === pid);
        if (!player) return;
        if (!confirm(`Delete player "${player.displayName}"? This will not affect existing match records.`)) return;
        try {
          await deletePlayer(pid);
          this.players = this.players.filter(p => p.id !== pid);
          const listEl = document.getElementById('players-list');
          if (listEl) listEl.innerHTML = this.renderPlayersList();
          this.bindPlayerForm();
          showToast('Player deleted', 'info');
        } catch {
          showToast('Failed to delete player', 'error');
        }
      });
    });

    this.bindPlayerFormSubmit();
  }

  private bindPlayerFormSubmit(): void {
    // Clone-replace the form element to clear any previously attached submit listeners,
    // preventing duplicate submissions when this method is called more than once.
    const old = document.getElementById('player-form');
    if (!old) return;
    const form = old.cloneNode(true) as HTMLElement;
    old.replaceWith(form);
    // cloneNode does not copy event listeners — re-bind color swatches on the new node.
    this.bindColorSwatches();
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const nameInput = document.getElementById('player-name') as HTMLInputElement;
      const colorInput = document.getElementById('player-color') as HTMLInputElement;
      const activeInput = document.getElementById('player-active') as HTMLInputElement;
      const editingId = (document.getElementById('player-editing-id') as HTMLInputElement)?.value;
      const nameError = document.getElementById('player-name-error');

      const name = nameInput.value.trim();
      if (!name) {
        if (nameError) nameError.textContent = 'Name is required';
        nameInput.focus();
        return;
      }
      if (nameError) nameError.textContent = '';

      const playerData = {
        displayName: name,
        color: colorInput.value || PLAYER_COLORS[0],
        active: activeInput.checked,
        createdAt: Date.now(),
      };

      try {
        if (editingId) {
          await updatePlayer(parseInt(editingId, 10), {
            displayName: playerData.displayName,
            color: playerData.color,
            active: playerData.active,
          });
          showToast('Player updated', 'success');
        } else {
          await createPlayer(playerData);
          showToast(`${name} added!`, 'success');
        }

        this.players = await getPlayers();
        this.editingPlayerId = null;
        const listEl = document.getElementById('players-list');
        if (listEl) listEl.innerHTML = this.renderPlayersList();
        const container = document.getElementById('add-player-form-container');
        if (container) {
          container.innerHTML = `<h3 class="card-title mb-3">Add Player</h3>${this.renderPlayerForm()}`;
        }
        this.bindColorSwatches();
        this.bindPlayerFormSubmit();
        this.bindPlayerForm();
      } catch (err) {
        console.error(err);
        showToast('Failed to save player', 'error');
      }
    });
  }

  private bindGameForm(): void {
    document.querySelectorAll('.edit-game-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const gid = parseInt((e.currentTarget as HTMLElement).dataset['gameId'] ?? '', 10);
        this.editingGameId = gid;
        const game = this.games.find(g => g.id === gid);
        const container = document.getElementById('add-game-form-container');
        if (container && game) {
          container.innerHTML = `<h3 class="card-title mb-3">Edit Game</h3>${this.renderGameForm(game)}`;
          this.bindGameFormSubmit();
          document.getElementById('cancel-edit-game-btn')?.addEventListener('click', () => {
            this.editingGameId = null;
            container.innerHTML = `<h3 class="card-title mb-3">Add Game</h3>${this.renderGameForm()}`;
            this.bindGameFormSubmit();
          });
          container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      });
    });

    document.querySelectorAll('.delete-game-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const gid = parseInt((e.currentTarget as HTMLElement).dataset['gameId'] ?? '', 10);
        const game = this.games.find(g => g.id === gid);
        if (!game) return;
        if (!confirm(`Delete game "${game.name}"? This will not affect existing match records.`)) return;
        try {
          await deleteGame(gid);
          this.games = this.games.filter(g => g.id !== gid);
          const listEl = document.getElementById('games-list');
          if (listEl) listEl.innerHTML = this.renderGamesList();
          this.bindGameForm();
          showToast('Game deleted', 'info');
        } catch {
          showToast('Failed to delete game', 'error');
        }
      });
    });

    this.bindGameFormSubmit();
  }

  private bindGameFormSubmit(): void {
    const old = document.getElementById('game-form');
    if (!old) return;
    const form = old.cloneNode(true) as HTMLElement;
    old.replaceWith(form);
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const nameInput = document.getElementById('game-name') as HTMLInputElement;
      const modeInput = document.getElementById('game-mode') as HTMLSelectElement;
      const rulesInput = document.getElementById('game-rules') as HTMLTextAreaElement;
      const targetInput = document.getElementById('game-target') as HTMLInputElement;
      const labelsInput = document.getElementById('game-round-labels') as HTMLTextAreaElement;
      const editingId = (document.getElementById('game-editing-id') as HTMLInputElement)?.value;
      const nameError = document.getElementById('game-name-error');

      const name = nameInput.value.trim();
      if (!name) {
        if (nameError) nameError.textContent = 'Game name is required';
        nameInput.focus();
        return;
      }
      if (nameError) nameError.textContent = '';

      const roundLabels = labelsInput.value
        .split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 0);

      const gameData = {
        name,
        scoringMode: modeInput.value as Game['scoringMode'],
        rules: rulesInput.value.trim() || undefined,
        targetScore: targetInput.value ? parseInt(targetInput.value, 10) : undefined,
        roundLabels: roundLabels.length > 0 ? roundLabels : undefined,
        createdAt: Date.now(),
      };

      try {
        if (editingId) {
          await updateGame(parseInt(editingId, 10), {
            name: gameData.name,
            scoringMode: gameData.scoringMode,
            rules: gameData.rules,
            targetScore: gameData.targetScore,
            roundLabels: gameData.roundLabels,
          });
          showToast('Game updated', 'success');
        } else {
          await createGame(gameData);
          showToast(`${name} added!`, 'success');
        }

        this.games = await getGames();
        this.editingGameId = null;
        const listEl = document.getElementById('games-list');
        if (listEl) listEl.innerHTML = this.renderGamesList();
        const container = document.getElementById('add-game-form-container');
        if (container) {
          container.innerHTML = `<h3 class="card-title mb-3">Add Game</h3>${this.renderGameForm()}`;
        }
        this.bindGameFormSubmit();
        this.bindGameForm();
      } catch (err) {
        console.error(err);
        showToast('Failed to save game', 'error');
      }
    });
  }

  private bindSyncForm(): void {
    // Track selected provider reactively in the form (without full re-render)
    let activeProvider: SyncConfig['provider'] =
      this.syncConfig?.provider ?? 'github';

    const applyProvider = (p: SyncConfig['provider']) => {
      activeProvider = p;

      // Toggle button styles
      document.querySelectorAll<HTMLButtonElement>('.provider-btn').forEach(btn => {
        const isActive = btn.dataset['provider'] === p;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-pressed', String(isActive));
      });

      // Show/hide base-URL field
      const baseUrlGroup = document.getElementById('sync-baseurl-group') as HTMLElement | null;
      if (baseUrlGroup) baseUrlGroup.style.display = p === 'gitea' ? 'block' : 'none';

      // Update PAT label & hint
      const patLabel = document.getElementById('sync-pat-label');
      const patInput = document.getElementById('sync-pat') as HTMLInputElement | null;
      const patHint  = document.getElementById('sync-pat-hint');
      if (patLabel) patLabel.textContent = p === 'gitea' ? 'API Key' : 'Personal Access Token';
      if (patInput) patInput.placeholder = p === 'gitea' ? 'your-api-key' : 'ghp_xxxxxxxxxxxxxxxxxxxx';
      if (patHint)  patHint.innerHTML = p === 'gitea'
        ? 'Settings → Applications → Generate Token (needs repository read/write)'
        : 'Needs <code>repo</code> scope';
    };

    document.querySelectorAll<HTMLButtonElement>('.provider-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        applyProvider(btn.dataset['provider'] as SyncConfig['provider']);
      });
    });

    const getFormConfig = (): SyncConfig => ({
      provider: activeProvider,
      baseUrl: activeProvider === 'gitea'
        ? (document.getElementById('sync-baseurl') as HTMLInputElement).value.trim().replace(/\/+$/, '')
        : undefined,
      username: (document.getElementById('sync-username') as HTMLInputElement).value.trim(),
      repo:     (document.getElementById('sync-repo')     as HTMLInputElement).value.trim(),
      pat:      (document.getElementById('sync-pat')      as HTMLInputElement).value.trim(),
      filePath: (document.getElementById('sync-filepath') as HTMLInputElement).value.trim() || 'scorekeeper.json',
      branch:   (document.getElementById('sync-branch')   as HTMLInputElement).value.trim() || 'main',
      lastSync: this.syncConfig?.lastSync,
    });

    const validateConfig = (config: SyncConfig): boolean => {
      const err = validateSyncConfig(config);
      if (err) { showToast(err, 'error'); return false; }
      return true;
    };

    document.getElementById('test-connection-btn')?.addEventListener('click', async () => {
      const config = getFormConfig();
      if (!validateConfig(config)) return;
      const btn = document.getElementById('test-connection-btn') as HTMLButtonElement;
      btn.disabled = true; btn.textContent = 'Testing…';
      try {
        saveSyncConfig(config);
        this.syncConfig = config;
        const result = await testConnection(config);
        showToast(result.message, result.ok ? 'success' : 'error');
      } finally { btn.disabled = false; btn.textContent = 'Test'; }
    });

    document.getElementById('sync-to-github-btn')?.addEventListener('click', async () => {
      const config = getFormConfig();
      if (!validateConfig(config)) return;
      const btn = document.getElementById('sync-to-github-btn') as HTMLButtonElement;
      btn.disabled = true; btn.textContent = 'Pushing…';
      try {
        saveSyncConfig(config);
        this.syncConfig = config;
        const result = await syncToGitHub(config);
        showToast(result.message, result.ok ? 'success' : 'error');
        if (result.ok) {
          this.syncConfig = getSyncConfig();
          const timeEl = document.getElementById('last-sync-time');
          if (timeEl) timeEl.textContent = this.formatTimestamp(this.syncConfig?.lastSync);
        }
      } finally { btn.disabled = false; btn.textContent = '↑ Push'; }
    });

    document.getElementById('sync-from-github-btn')?.addEventListener('click', async () => {
      const config = getFormConfig();
      if (!validateConfig(config)) return;
      const btn = document.getElementById('sync-from-github-btn') as HTMLButtonElement;
      btn.disabled = true; btn.textContent = 'Pulling…';
      try {
        saveSyncConfig(config);
        this.syncConfig = config;
        const label = config.provider === 'gitea' ? 'Gitea' : 'GitHub';
        const result = await syncFromGitHub(config, async () =>
          confirm(`Local data exists. Overwrite with ${label} data? This cannot be undone.`)
        );
        showToast(result.message, result.ok ? 'success' : 'error');
        if (result.ok) {
          this.syncConfig = getSyncConfig();
          const timeEl = document.getElementById('last-sync-time');
          if (timeEl) timeEl.textContent = this.formatTimestamp(this.syncConfig?.lastSync);
          await this.load();
          const playersEl = document.getElementById('players-list');
          if (playersEl) playersEl.innerHTML = this.renderPlayersList();
          const gamesEl = document.getElementById('games-list');
          if (gamesEl) gamesEl.innerHTML = this.renderGamesList();
          this.bindPlayerForm();
          this.bindGameForm();
        }
      } finally { btn.disabled = false; btn.textContent = '↓ Pull'; }
    });
  }

  private bindDataButtons(): void {
    document.getElementById('export-btn')?.addEventListener('click', async () => {
      try {
        const data = await exportAll();
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `scorekeeper-export-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Data exported!', 'success');
      } catch {
        showToast('Export failed', 'error');
      }
    });

    document.getElementById('import-btn')?.addEventListener('click', () => {
      document.getElementById('import-file-input')?.click();
    });

    document.getElementById('import-file-input')?.addEventListener('change', async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      if (!confirm('Import will replace ALL current data. Continue?')) return;

      try {
        const text = await file.text();
        const data = JSON.parse(text);
        await importAll(data);
        showToast('Data imported successfully!', 'success');
        await this.load();
        // Full re-render
        const container = document.getElementById('view-container');
        if (container) {
          container.innerHTML = this.render();
          this.afterRender();
        }
      } catch (err) {
        console.error(err);
        showToast('Import failed — invalid JSON', 'error');
      }
    });

    document.getElementById('import-external-btn')?.addEventListener('click', () => {
      document.getElementById('import-external-file-input')?.click();
    });

    document.getElementById('import-external-file-input')?.addEventListener('change', async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const data = JSON.parse(text) as ExternalGameData;
        const summary = await importExternalGame(data);

        const newMsg = summary.newPlayers.length > 0
          ? ` (${summary.newPlayers.length} new player${summary.newPlayers.length > 1 ? 's' : ''}: ${summary.newPlayers.join(', ')})`
          : '';
        showToast(`Imported ${summary.gameName} on ${summary.date}: ${summary.playerCount} players, ${summary.roundCount} rounds${newMsg}`, 'success');

        await this.load();
        const playersEl = document.getElementById('players-list');
        if (playersEl) playersEl.innerHTML = this.renderPlayersList();
        const gamesEl = document.getElementById('games-list');
        if (gamesEl) gamesEl.innerHTML = this.renderGamesList();
        this.bindPlayerForm();
        this.bindGameForm();
      } catch (err) {
        console.error(err);
        showToast('Import failed — check the file format', 'error');
      } finally {
        (e.target as HTMLInputElement).value = '';
      }
    });

    document.getElementById('clear-data-btn')?.addEventListener('click', async () => {
      if (!confirm('Clear ALL data? This permanently deletes all players, games, nights, and scores. This CANNOT be undone.')) return;
      if (!confirm('Are you absolutely sure? All data will be lost forever.')) return;
      try {
        await db.transaction('rw', [
          db.players, db.games, db.gameNights, db.matches, db.scoreEntries
        ], async () => {
          await db.players.clear();
          await db.games.clear();
          await db.gameNights.clear();
          await db.matches.clear();
          await db.scoreEntries.clear();
        });
        showToast('All data cleared', 'info');
        window.location.reload();
      } catch {
        showToast('Failed to clear data', 'error');
      }
    });
  }

  private bindThemeToggle(): void {
    const toggle = document.getElementById('theme-toggle') as HTMLInputElement | null;
    toggle?.addEventListener('change', () => {
      const isDark = toggle.checked;
      const theme = isDark ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);
      toggle.setAttribute('aria-checked', String(isDark));
    });
  }
}
