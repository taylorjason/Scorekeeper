import { getPlayers, getGames, createGameNight, createMatch } from '../db';
import { navigate } from '../router';
import { showToast } from '../toast';
import type { Player, Game } from '../types';

interface MatchConfig {
  gameId: number;
  gameName: string;
  playerIds: number[];
  playerNames: string[];
  firstDealerIndex: number;
}

interface PendingMatch {
  gameId: number;
  gameName: string;
  playerIds: number[];
  firstDealerIndex: number;
}

export class NewNight {
  private players: Player[] = [];
  private games: Game[] = [];
  private matches: MatchConfig[] = [];
  private pending: PendingMatch | null = null;

  async load(): Promise<void> {
    const [players, games] = await Promise.all([getPlayers(), getGames()]);
    this.players = players.filter(p => p.active);
    this.games = games;
  }

  private escHtml(str: string): string {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  render(): string {
    const today = new Date().toISOString().split('T')[0];

    const gameOptions = this.games.length === 0
      ? '<option value="">No games — add in Settings</option>'
      : this.games.map(g => `<option value="${g.id}">${this.escHtml(g.name)}</option>`).join('');

    const playerCheckboxes = this.players.length === 0
      ? '<p class="text-sm text-muted">No players — add in Settings</p>'
      : this.players.map(p => `
          <label class="checkbox-item" for="player-check-${p.id}">
            <input type="checkbox" id="player-check-${p.id}" value="${p.id}" class="match-player-check" aria-label="${this.escHtml(p.displayName)}">
            <span class="player-dot" style="background:${p.color}"></span>
            <span>${this.escHtml(p.displayName)}</span>
          </label>
        `).join('');

    const matchListHtml = this.renderMatchList();

    return `
      <main class="view" aria-label="New Game Night">
        <header class="page-header flex items-center gap-3">
          <button class="btn btn-icon" id="back-btn" aria-label="Go back">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <h1 class="page-title" style="font-size:1.375rem">New Game Night</h1>
        </header>

        <form id="new-night-form" novalidate>
          <section class="settings-section">
            <h2 class="settings-section-title">Night Details</h2>

            <div class="form-group">
              <label class="form-label" for="night-title">Title <span aria-hidden="true">*</span></label>
              <input class="form-input" type="text" id="night-title" name="title"
                placeholder="e.g. Friday Night Games" required maxlength="80"
                aria-required="true" autocomplete="off" />
              <span class="form-error" id="title-error" role="alert" aria-live="polite"></span>
            </div>

            <div class="form-group">
              <label class="form-label" for="night-date">Date</label>
              <input class="form-input" type="date" id="night-date" name="date" value="${today}" />
            </div>

            <div class="form-group">
              <label class="form-label" for="night-notes">Notes (optional)</label>
              <textarea class="form-textarea" id="night-notes" name="notes"
                placeholder="Any notes about tonight..." rows="2" maxlength="300"></textarea>
            </div>
          </section>

          <section class="settings-section">
            <h2 class="settings-section-title">Add Match</h2>

            <div id="match-selector">
              <div class="form-group">
                <label class="form-label" for="match-game">Game</label>
                <select class="form-select" id="match-game" ${this.games.length === 0 ? 'disabled' : ''}>
                  <option value="">— Select a game —</option>
                  ${gameOptions}
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Players</label>
                <div id="player-checkboxes" role="group" aria-label="Select players">
                  ${playerCheckboxes}
                </div>
              </div>

              <button type="button" class="btn btn-secondary btn-full" id="add-match-btn"
                ${this.games.length === 0 || this.players.length === 0 ? 'disabled' : ''}>
                + Add Match to List
              </button>
            </div>

            <div id="configure-panel" style="display:none">
              <div class="configure-panel-header">
                <span class="configure-panel-title">Player Order &amp; First Dealer</span>
                <span class="configure-panel-hint">Tap 🃏 to set the first dealer</span>
              </div>
              <div id="configure-player-list"></div>
              <div class="btn-group mt-3">
                <button type="button" class="btn btn-primary flex-1" id="confirm-add-btn">+ Add to List</button>
                <button type="button" class="btn btn-secondary" id="cancel-config-btn">Cancel</button>
              </div>
            </div>
          </section>

          <section class="settings-section">
            <div class="flex items-center justify-between mb-3">
              <h2 class="settings-section-title" style="margin-bottom:0">Matches to Play</h2>
              <span class="badge badge-primary" id="match-count">${this.matches.length}</span>
            </div>
            <div id="match-list">
              ${matchListHtml}
            </div>
          </section>

          <div style="padding-bottom: 1rem">
            <button type="submit" class="btn btn-primary btn-full" id="start-night-btn"
              ${this.matches.length === 0 ? 'disabled' : ''}>
              🎮 Start Game Night
            </button>
          </div>
        </form>
      </main>
    `;
  }

  private renderMatchList(): string {
    if (this.matches.length === 0) {
      return `<p class="text-sm text-muted" id="no-matches-msg">No matches added yet. Add at least one above.</p>`;
    }
    return this.matches.map((m, i) => {
      const dealerName = m.playerNames[m.firstDealerIndex] ?? '';
      return `
        <div class="player-list-item" data-match-index="${i}">
          <span style="font-size:1.25rem">🎯</span>
          <div style="flex:1; min-width:0">
            <div class="font-semibold text-sm">${this.escHtml(m.gameName)}</div>
            <div class="text-xs text-muted">${m.playerNames.map(n => this.escHtml(n)).join(' → ')}</div>
            ${dealerName ? `<div class="text-xs text-muted">🃏 First dealer: ${this.escHtml(dealerName)}</div>` : ''}
          </div>
          <div class="actions">
            <button type="button" class="btn btn-icon btn-sm remove-match-btn" data-index="${i}" aria-label="Remove match ${i + 1}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6l-1 14H6L5 6"></path>
                <path d="M10 11v6M14 11v6"></path>
              </svg>
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  private renderConfigurePlayerList(): string {
    if (!this.pending) return '';
    return this.pending.playerIds.map((pid, index) => {
      const player = this.players.find(p => p.id === pid);
      if (!player) return '';
      const isDealer = index === this.pending!.firstDealerIndex;
      const isFirst = index === 0;
      const isLast = index === this.pending!.playerIds.length - 1;
      return `
        <div class="configure-player-row">
          <div class="configure-player-info">
            <span class="player-dot" style="background:${player.color}; flex-shrink:0"></span>
            <span class="configure-player-name">${this.escHtml(player.displayName)}</span>
          </div>
          <div class="configure-player-actions">
            <button type="button" class="btn btn-icon btn-sm configure-dealer-btn ${isDealer ? 'dealer-selected' : ''}"
              data-index="${index}" aria-label="Set as first dealer" title="First dealer" aria-pressed="${isDealer}">
              🃏
            </button>
            <button type="button" class="btn btn-icon btn-sm move-up-btn" data-index="${index}"
              ${isFirst ? 'disabled' : ''} aria-label="Move up">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="18 15 12 9 6 15"/></svg>
            </button>
            <button type="button" class="btn btn-icon btn-sm move-down-btn" data-index="${index}"
              ${isLast ? 'disabled' : ''} aria-label="Move down">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  afterRender(): void {
    document.getElementById('back-btn')?.addEventListener('click', () => navigate('dashboard'));

    document.getElementById('add-match-btn')?.addEventListener('click', () => {
      this.handleAddMatch();
    });

    document.getElementById('new-night-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSubmit();
    });

    this.bindRemoveButtons();
  }

  private bindRemoveButtons(): void {
    document.querySelectorAll('.remove-match-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt((e.currentTarget as HTMLElement).dataset['index'] ?? '0', 10);
        this.matches.splice(idx, 1);
        this.refreshMatchList();
      });
    });
  }

  private bindConfigurePanel(): void {
    document.getElementById('confirm-add-btn')?.addEventListener('click', () => this.handleConfirmAdd());
    document.getElementById('cancel-config-btn')?.addEventListener('click', () => this.hideConfigurePanel());

    document.querySelectorAll('.configure-dealer-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt((e.currentTarget as HTMLElement).dataset['index'] ?? '0', 10);
        if (this.pending) {
          this.pending.firstDealerIndex = idx;
          this.refreshConfigurePanel();
        }
      });
    });

    document.querySelectorAll('.move-up-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt((e.currentTarget as HTMLElement).dataset['index'] ?? '0', 10);
        this.movePlayer(idx, -1);
      });
    });

    document.querySelectorAll('.move-down-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt((e.currentTarget as HTMLElement).dataset['index'] ?? '0', 10);
        this.movePlayer(idx, 1);
      });
    });
  }

  private movePlayer(index: number, direction: -1 | 1): void {
    if (!this.pending) return;
    const ids = this.pending.playerIds;
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= ids.length) return;

    // Swap
    [ids[index], ids[newIndex]] = [ids[newIndex], ids[index]];

    // Keep dealer pointing to the same player after swap
    if (this.pending.firstDealerIndex === index) {
      this.pending.firstDealerIndex = newIndex;
    } else if (this.pending.firstDealerIndex === newIndex) {
      this.pending.firstDealerIndex = index;
    }

    this.refreshConfigurePanel();
  }

  private refreshConfigurePanel(): void {
    const listEl = document.getElementById('configure-player-list');
    if (listEl) listEl.innerHTML = this.renderConfigurePlayerList();
    this.bindConfigurePanel();
  }

  private showConfigurePanel(): void {
    document.getElementById('match-selector')!.style.display = 'none';
    const panel = document.getElementById('configure-panel')!;
    panel.style.display = 'block';
    this.refreshConfigurePanel();
  }

  private hideConfigurePanel(): void {
    this.pending = null;
    document.getElementById('configure-panel')!.style.display = 'none';
    document.getElementById('match-selector')!.style.display = 'block';
  }

  private handleAddMatch(): void {
    const gameSelect = document.getElementById('match-game') as HTMLSelectElement;
    const gameId = parseInt(gameSelect.value, 10);

    if (!gameId) {
      showToast('Please select a game', 'error');
      return;
    }

    const checkedBoxes = document.querySelectorAll<HTMLInputElement>('.match-player-check:checked');
    const playerIds = Array.from(checkedBoxes).map(cb => parseInt(cb.value, 10));

    if (playerIds.length < 1) {
      showToast('Select at least one player', 'error');
      return;
    }

    const game = this.games.find(g => g.id === gameId);
    if (!game) return;

    this.pending = { gameId, gameName: game.name, playerIds, firstDealerIndex: 0 };
    this.showConfigurePanel();
  }

  private handleConfirmAdd(): void {
    if (!this.pending) return;

    const playerNames = this.pending.playerIds.map(pid =>
      this.players.find(p => p.id === pid)?.displayName ?? `Player ${pid}`
    );

    this.matches.push({
      gameId: this.pending.gameId,
      gameName: this.pending.gameName,
      playerIds: [...this.pending.playerIds],
      playerNames,
      firstDealerIndex: this.pending.firstDealerIndex,
    });

    // Reset selector
    const gameSelect = document.getElementById('match-game') as HTMLSelectElement | null;
    if (gameSelect) gameSelect.value = '';
    document.querySelectorAll<HTMLInputElement>('.match-player-check').forEach(cb => { cb.checked = false; });

    showToast(`Added ${this.pending.gameName} to the list`, 'success');
    this.hideConfigurePanel();
    this.refreshMatchList();
  }

  private refreshMatchList(): void {
    const listEl = document.getElementById('match-list');
    if (listEl) {
      listEl.innerHTML = this.renderMatchList();
      this.bindRemoveButtons();
    }
    const countEl = document.getElementById('match-count');
    if (countEl) countEl.textContent = String(this.matches.length);

    const startBtn = document.getElementById('start-night-btn') as HTMLButtonElement | null;
    if (startBtn) startBtn.disabled = this.matches.length === 0;
  }

  private async handleSubmit(): Promise<void> {
    const titleInput = document.getElementById('night-title') as HTMLInputElement;
    const dateInput = document.getElementById('night-date') as HTMLInputElement;
    const notesInput = document.getElementById('night-notes') as HTMLTextAreaElement;
    const titleError = document.getElementById('title-error');

    const title = titleInput.value.trim();
    if (!title) {
      titleInput.classList.add('error');
      if (titleError) titleError.textContent = 'Title is required';
      titleInput.focus();
      return;
    }
    if (titleError) titleError.textContent = '';
    titleInput.classList.remove('error');

    if (this.matches.length === 0) {
      showToast('Add at least one match to the night', 'error');
      return;
    }

    const startBtn = document.getElementById('start-night-btn') as HTMLButtonElement;
    startBtn.disabled = true;
    startBtn.textContent = 'Creating...';

    try {
      const nightId = await createGameNight({
        title,
        date: dateInput.value || new Date().toISOString().split('T')[0],
        notes: notesInput.value.trim() || undefined,
        createdAt: Date.now(),
      });

      const matchIds: number[] = [];
      for (const m of this.matches) {
        const matchId = await createMatch({
          gameNightId: nightId,
          gameId: m.gameId,
          playerIds: m.playerIds,
          status: 'active',
          firstDealerIndex: m.firstDealerIndex,
          createdAt: Date.now(),
        });
        matchIds.push(matchId);
      }

      showToast('Game night created!', 'success');
      navigate('match', { id: String(matchIds[0]) });
    } catch (err) {
      console.error('Failed to create game night:', err);
      showToast('Failed to create game night', 'error');
      startBtn.disabled = false;
      startBtn.textContent = '🎮 Start Game Night';
    }
  }
}
