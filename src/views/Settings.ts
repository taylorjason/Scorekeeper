import {
  getPlayers, createPlayer, updatePlayer, deletePlayer,
  getGames, createGame, updateGame, deleteGame,
  exportAll, importAll, db
} from '../db';
import { getSyncConfig, saveSyncConfig, testConnection, syncToGitHub, syncFromGitHub } from '../github';
import { showToast } from '../toast';
import type { Player, Game, SyncConfig } from '../types';

const PLAYER_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308',
  '#10b981', '#14b8a6', '#3b82f6', '#6366f1',
  '#8b5cf6', '#ec4899', '#64748b', '#d97706',
];

export class Settings {
  private players: Player[] = [];
  private games: Game[] = [];
  private syncConfig: SyncConfig | null = null;
  private editingPlayerId: number | null = null;
  private editingGameId: number | null = null;

  async load(): Promise<void> {
    const [players, games] = await Promise.all([getPlayers(), getGames()]);
    this.players = players;
    this.games = games;
    this.syncConfig = getSyncConfig();
  }

  private escHtml(str: string): string {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  private formatTimestamp(ts: number | undefined): string {
    if (!ts) return 'Never';
    return new Date(ts).toLocaleString();
  }

  render(): string {
    const theme = document.documentElement.getAttribute('data-theme') ?? 'dark';
    const isDark = theme !== 'light';

    return `
      <main class="view" aria-label="Settings">
        <header class="page-header">
          <h1 class="page-title">Settings</h1>
        </header>

        <!-- Players Section -->
        <section class="settings-section" aria-labelledby="players-section-heading">
          <h2 class="settings-section-title" id="players-section-heading">
            <span>👥</span> Players
          </h2>
          <div id="players-list">
            ${this.renderPlayersList()}
          </div>
          <div class="card mt-4" id="add-player-form-container">
            <h3 class="card-title mb-3">${this.editingPlayerId !== null ? 'Edit Player' : 'Add Player'}</h3>
            ${this.renderPlayerForm()}
          </div>
        </section>

        <!-- Games Section -->
        <section class="settings-section" aria-labelledby="games-section-heading">
          <h2 class="settings-section-title" id="games-section-heading">
            <span>🎯</span> Games
          </h2>
          <div id="games-list">
            ${this.renderGamesList()}
          </div>
          <div class="card mt-4" id="add-game-form-container">
            <h3 class="card-title mb-3">${this.editingGameId !== null ? 'Edit Game' : 'Add Game'}</h3>
            ${this.renderGameForm()}
          </div>
        </section>

        <!-- GitHub Sync Section -->
        <section class="settings-section" aria-labelledby="sync-section-heading">
          <h2 class="settings-section-title" id="sync-section-heading">
            <span>☁️</span> GitHub Sync
          </h2>

          <div class="alert alert-warning mb-3">
            <span>⚠️</span>
            <span>Your Personal Access Token (PAT) is stored in localStorage. Never share your PAT or use it on untrusted devices.</span>
          </div>

          <div class="card">
            <form id="sync-form" novalidate>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label" for="sync-username">GitHub Username</label>
                  <input class="form-input" type="text" id="sync-username"
                    placeholder="octocat" autocomplete="off"
                    value="${this.syncConfig ? this.escHtml(this.syncConfig.username) : ''}" />
                </div>
                <div class="form-group">
                  <label class="form-label" for="sync-repo">Repository</label>
                  <input class="form-input" type="text" id="sync-repo"
                    placeholder="my-scores" autocomplete="off"
                    value="${this.syncConfig ? this.escHtml(this.syncConfig.repo) : ''}" />
                </div>
              </div>
              <div class="form-group">
                <label class="form-label" for="sync-pat">Personal Access Token</label>
                <input class="form-input" type="password" id="sync-pat"
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx" autocomplete="off"
                  value="${this.syncConfig ? this.escHtml(this.syncConfig.pat) : ''}" />
                <span class="form-hint">Needs <code>repo</code> scope</span>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label" for="sync-filepath">File Path</label>
                  <input class="form-input" type="text" id="sync-filepath"
                    placeholder="scorekeeper.json"
                    value="${this.syncConfig ? this.escHtml(this.syncConfig.filePath) : 'scorekeeper.json'}" />
                </div>
                <div class="form-group">
                  <label class="form-label" for="sync-branch">Branch</label>
                  <input class="form-input" type="text" id="sync-branch"
                    placeholder="main"
                    value="${this.syncConfig ? this.escHtml(this.syncConfig.branch) : 'main'}" />
                </div>
              </div>
              <div class="text-sm text-muted mb-3">
                Last sync: <strong id="last-sync-time">${this.formatTimestamp(this.syncConfig?.lastSync)}</strong>
              </div>
              <div class="btn-group">
                <button type="button" class="btn btn-secondary" id="test-connection-btn">Test</button>
                <button type="button" class="btn btn-primary flex-1" id="sync-to-github-btn">↑ Push to GitHub</button>
                <button type="button" class="btn btn-secondary flex-1" id="sync-from-github-btn">↓ Pull from GitHub</button>
              </div>
            </form>
          </div>
        </section>

        <!-- Data Section -->
        <section class="settings-section" aria-labelledby="data-section-heading">
          <h2 class="settings-section-title" id="data-section-heading">
            <span>💾</span> Data
          </h2>
          <div class="card">
            <div class="btn-group" style="flex-direction:column; gap:0.625rem">
              <button class="btn btn-secondary btn-full" id="export-btn">
                📤 Export All Data (JSON)
              </button>
              <button class="btn btn-secondary btn-full" id="import-btn">
                📥 Import Data (JSON)
              </button>
              <input type="file" id="import-file-input" accept=".json" style="display:none" aria-label="Import JSON file" />
              <div class="divider" style="margin: 0.25rem 0"></div>
              <button class="btn btn-danger btn-full" id="clear-data-btn">
                🗑️ Clear All Data
              </button>
            </div>
          </div>
        </section>

        <!-- Appearance Section -->
        <section class="settings-section" aria-labelledby="appearance-section-heading">
          <h2 class="settings-section-title" id="appearance-section-heading">
            <span>🎨</span> Appearance
          </h2>
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

        <div style="height: 1rem"></div>
      </main>
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
          <div class="font-semibold text-sm">${this.escHtml(p.displayName)}</div>
          <div class="text-xs text-muted">${p.active ? 'Active' : 'Inactive'}</div>
        </div>
        <div class="actions">
          <button class="btn btn-icon btn-sm edit-player-btn" data-player-id="${p.id}" aria-label="Edit ${this.escHtml(p.displayName)}">
            ✏️
          </button>
          <button class="btn btn-icon btn-sm delete-player-btn" data-player-id="${p.id}" aria-label="Delete ${this.escHtml(p.displayName)}">
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
            value="${this.escHtml(name)}" required maxlength="30" autocomplete="off" />
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
          <div class="font-semibold text-sm">${this.escHtml(g.name)}</div>
          <div class="text-xs text-muted">${g.scoringMode} scoring${g.roundLabels?.length ? ` · ${g.roundLabels.length} round labels` : ''}${g.rules ? ' · ' + this.escHtml(g.rules.substring(0, 40)) : ''}</div>
        </div>
        <div class="actions">
          <button class="btn btn-icon btn-sm edit-game-btn" data-game-id="${g.id}" aria-label="Edit ${this.escHtml(g.name)}">
            ✏️
          </button>
          <button class="btn btn-icon btn-sm delete-game-btn" data-game-id="${g.id}" aria-label="Delete ${this.escHtml(g.name)}">
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
            value="${this.escHtml(name)}" required maxlength="50" autocomplete="off" />
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
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="game-round-labels">Round Labels (optional)</label>
          <textarea class="form-textarea" id="game-round-labels"
            placeholder="One label per line, e.g.&#10;Phase 1&#10;Phase 2&#10;Phase 3"
            rows="4">${this.escHtml(labels)}</textarea>
          <span class="form-hint">Names each round — great for Phase 10, Five Crowns, etc. Leave blank to use "Round 1, Round 2…"</span>
        </div>
        <div class="form-group">
          <label class="form-label" for="game-rules">Rules / Notes (optional)</label>
          <textarea class="form-textarea" id="game-rules" placeholder="Any rule notes..."
            maxlength="200" rows="2">${this.escHtml(rules)}</textarea>
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
    this.bindPlayerForm();
    this.bindGameForm();
    this.bindSyncForm();
    this.bindDataButtons();
    this.bindThemeToggle();
    this.bindColorSwatches();
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
          this.afterRender();
          showToast('Player deleted', 'info');
        } catch {
          showToast('Failed to delete player', 'error');
        }
      });
    });

    this.bindPlayerFormSubmit();
  }

  private bindPlayerFormSubmit(): void {
    document.getElementById('player-form')?.addEventListener('submit', async (e) => {
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
    document.getElementById('game-form')?.addEventListener('submit', async (e) => {
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
    const getFormConfig = (): SyncConfig => ({
      username: (document.getElementById('sync-username') as HTMLInputElement).value.trim(),
      repo: (document.getElementById('sync-repo') as HTMLInputElement).value.trim(),
      pat: (document.getElementById('sync-pat') as HTMLInputElement).value.trim(),
      filePath: (document.getElementById('sync-filepath') as HTMLInputElement).value.trim() || 'scorekeeper.json',
      branch: (document.getElementById('sync-branch') as HTMLInputElement).value.trim() || 'main',
      lastSync: this.syncConfig?.lastSync,
    });

    const validateConfig = (config: SyncConfig): boolean => {
      if (!config.username || !config.repo || !config.pat) {
        showToast('Fill in username, repo, and PAT', 'error');
        return false;
      }
      return true;
    };

    document.getElementById('test-connection-btn')?.addEventListener('click', async () => {
      const config = getFormConfig();
      if (!validateConfig(config)) return;
      const btn = document.getElementById('test-connection-btn') as HTMLButtonElement;
      btn.disabled = true;
      btn.textContent = 'Testing...';
      try {
        saveSyncConfig(config);
        this.syncConfig = config;
        const result = await testConnection(config);
        showToast(result.message, result.ok ? 'success' : 'error');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Test';
      }
    });

    document.getElementById('sync-to-github-btn')?.addEventListener('click', async () => {
      const config = getFormConfig();
      if (!validateConfig(config)) return;
      const btn = document.getElementById('sync-to-github-btn') as HTMLButtonElement;
      btn.disabled = true;
      btn.textContent = 'Pushing...';
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
      } finally {
        btn.disabled = false;
        btn.textContent = '↑ Push to GitHub';
      }
    });

    document.getElementById('sync-from-github-btn')?.addEventListener('click', async () => {
      const config = getFormConfig();
      if (!validateConfig(config)) return;
      const btn = document.getElementById('sync-from-github-btn') as HTMLButtonElement;
      btn.disabled = true;
      btn.textContent = 'Pulling...';
      try {
        saveSyncConfig(config);
        this.syncConfig = config;
        const result = await syncFromGitHub(config, async () => {
          return confirm('Local data exists. Overwrite with GitHub data? This cannot be undone.');
        });
        showToast(result.message, result.ok ? 'success' : 'error');
        if (result.ok) {
          this.syncConfig = getSyncConfig();
          const timeEl = document.getElementById('last-sync-time');
          if (timeEl) timeEl.textContent = this.formatTimestamp(this.syncConfig?.lastSync);
          // Reload players/games since they may have changed
          await this.load();
          const playersEl = document.getElementById('players-list');
          if (playersEl) playersEl.innerHTML = this.renderPlayersList();
          const gamesEl = document.getElementById('games-list');
          if (gamesEl) gamesEl.innerHTML = this.renderGamesList();
          this.bindPlayerForm();
          this.bindGameForm();
        }
      } finally {
        btn.disabled = false;
        btn.textContent = '↓ Pull from GitHub';
      }
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
