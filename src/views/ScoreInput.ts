import {
  getMatch, getScoreEntriesForMatch, addScoreEntry, deleteLastScoreEntry, db
} from '../db';
import { navigate } from '../router';
import { showToast } from '../toast';
import { escHtml } from '../utils';
import type { Match, Game, Player, ScoreEntry } from '../types';

export class ScoreInput {
  private matchId = 0;
  private match: Match | null = null;
  private game: Game | null = null;
  private players: Player[] = [];
  private entries: ScoreEntry[] = [];
  private currentRound = 1;

  async load(matchId: number): Promise<void> {
    this.matchId = matchId;
    this.match = (await getMatch(matchId)) ?? null;
    if (!this.match) return;

    const [game, players, entries] = await Promise.all([
      db.games.get(this.match.gameId),
      db.players.where('id').anyOf(this.match.playerIds).toArray(),
      getScoreEntriesForMatch(matchId),
    ]);

    this.game = game ?? null;
    this.entries = entries;
    this.players = this.match.playerIds
      .map(pid => players.find(p => p.id === pid))
      .filter((p): p is Player => p !== undefined);

    this.currentRound = entries.length > 0
      ? Math.max(...entries.map(e => e.roundNumber)) + 1
      : 1;
  }

  private roundLabel(n: number): string {
    const labels = this.game?.roundLabels;
    return labels && labels.length >= n ? labels[n - 1] : `Round ${n}`;
  }

  private getPlayerCurrentPhase(player: Player): number {
    const sorted = this.entries
      .filter(e => e.playerId === player.id)
      .sort((a, b) => a.roundNumber - b.roundNumber);
    let phase = 1;
    for (const e of sorted) {
      if (!e.note) continue;
      try {
        const d = JSON.parse(e.note) as { phase?: number; completed?: boolean };
        if (d.completed && d.phase === phase) phase = Math.min(phase + 1, 11);
      } catch { /* plain string note */ }
    }
    return phase;
  }

  render(): string {
    if (!this.match || !this.game) {
      return `<div class="si-screen"><p style="padding:2rem;font-size:1.25rem;color:var(--danger)">Match not found</p></div>`;
    }

    if (this.match.status === 'completed') {
      return `
        <div class="si-screen">
          <div class="si-header">
            <button class="si-close" id="si-close" aria-label="Close">✕</button>
            <div>
              <div class="si-game-name">${escHtml(this.game.name)}</div>
              <div class="si-round">Match complete</div>
            </div>
          </div>
          <div style="flex:1;display:flex;align-items:center;justify-content:center;font-size:5rem">🏆</div>
        </div>`;
    }

    const mode = this.game.scoringMode;
    const isPhase10 = mode === 'phase10';
    const isFinishOrder = mode === 'finish-order';

    const playerRows = this.players.map(p => {
      if (isPhase10) {
        const phase = this.getPlayerCurrentPhase(p);
        const isDone = phase > 10;
        if (isDone) return `
          <div class="si-player" data-player-id="${p.id}" style="opacity:0.45">
            <div class="si-player-bar" style="background:${p.color}"></div>
            <div class="si-player-info">
              <div class="si-player-name">${escHtml(p.displayName)}</div>
              <div class="si-player-sub">All phases done 🏆</div>
            </div>
          </div>`;
        return `
          <div class="si-player" data-player-id="${p.id}">
            <div class="si-player-bar" style="background:${p.color}"></div>
            <div class="si-player-info">
              <div class="si-player-name">${escHtml(p.displayName)}</div>
              <div class="si-player-sub">Phase ${phase}</div>
            </div>
            <div class="si-player-controls">
              <input class="si-score-input" type="number" id="score-input-${p.id}"
                placeholder="0" min="0" step="5" inputmode="numeric"
                aria-label="${escHtml(p.displayName)} penalty points" />
              <label class="si-checkbox-label">
                <input type="checkbox" id="completed-${p.id}" style="width:22px;height:22px;accent-color:${p.color}">
                <span>✓ Done</span>
              </label>
            </div>
          </div>`;
      }

      if (isFinishOrder) {
        return `
          <div class="si-player" data-player-id="${p.id}">
            <div class="si-player-bar" style="background:${p.color}"></div>
            <div class="si-player-info">
              <div class="si-player-name">${escHtml(p.displayName)}</div>
            </div>
            <select class="si-order-select" id="score-input-${p.id}" aria-label="${escHtml(p.displayName)} position">
              <option value="">Place</option>
              ${this.players.map((_, i) => `<option value="${i + 1}">${i + 1}${['st', 'nd', 'rd'][i] ?? 'th'}</option>`).join('')}
            </select>
          </div>`;
      }

      return `
        <div class="si-player" data-player-id="${p.id}">
          <div class="si-player-bar" style="background:${p.color}"></div>
          <div class="si-player-info">
            <div class="si-player-name">${escHtml(p.displayName)}</div>
          </div>
          <input class="si-score-input" type="number" id="score-input-${p.id}"
            placeholder="0" step="1" inputmode="numeric"
            aria-label="${escHtml(p.displayName)} score" />
        </div>`;
    }).join('');

    const firstOutSelector = (!isPhase10 && !isFinishOrder) ? `
      <div class="si-first-out">
        <div class="si-first-out-label">⚡ Who went out first?</div>
        <select class="si-first-out-select" id="first-out-select">
          <option value="">— none / unknown —</option>
          ${this.players.map(p => `<option value="${p.id}">${escHtml(p.displayName)}</option>`).join('')}
        </select>
      </div>` : '';

    return `
      <div class="si-screen">
        <div class="si-header">
          <button class="si-close" id="si-close" aria-label="Close">✕</button>
          <div style="flex:1;min-width:0">
            <div class="si-game-name">${escHtml(this.game.name)}</div>
            <div class="si-round">${escHtml(this.roundLabel(this.currentRound))}</div>
          </div>
        </div>

        <div class="si-players" id="player-rows-container">
          ${playerRows}
        </div>

        ${firstOutSelector}

        <div class="si-footer">
          <button class="btn btn-primary si-save-btn" id="si-save">
            ✓ Save ${escHtml(this.roundLabel(this.currentRound))}
          </button>
          <button class="btn btn-secondary si-undo-btn" id="si-undo" ${this.entries.length === 0 ? 'disabled' : ''}>
            ↩ Undo Last Round
          </button>
        </div>
      </div>`;
  }

  afterRender(): void {
    document.getElementById('si-close')?.addEventListener('click', () => {
      if (window.history.length > 1) window.history.back();
      else navigate('dashboard');
    });

    document.getElementById('si-save')?.addEventListener('click', () => { this.handleSave(); });
    document.getElementById('si-undo')?.addEventListener('click', () => { this.handleUndo(); });

    // First-out: reorder rows, zero score, focus next
    document.getElementById('first-out-select')?.addEventListener('change', (e) => {
      const selectedId = (e.target as HTMLSelectElement).value;
      const container = document.getElementById('player-rows-container');
      if (!container) return;

      if (!selectedId) {
        const rows = Array.from(container.querySelectorAll<HTMLElement>('[data-player-id]'));
        const rowMap = new Map(rows.map(r => [r.dataset['playerId']!, r]));
        this.players.forEach(p => {
          const row = rowMap.get(String(p.id));
          if (row) container.appendChild(row);
        });
        return;
      }

      const rows = Array.from(container.querySelectorAll<HTMLElement>('[data-player-id]'));
      const foRow = rows.find(r => r.dataset['playerId'] === selectedId);
      if (!foRow) return;
      container.insertBefore(foRow, container.firstChild);

      const input = document.getElementById(`score-input-${selectedId}`) as HTMLInputElement | null;
      if (input) input.value = '0';

      const remaining = Array.from(container.querySelectorAll<HTMLElement>('[data-player-id]'))
        .filter(r => r.dataset['playerId'] !== selectedId);
      const nextId = remaining[0]?.dataset['playerId'];
      if (nextId) (document.getElementById(`score-input-${nextId}`) as HTMLInputElement | null)?.focus();
    });

    // Enter advances through inputs
    const inputs = Array.from(document.querySelectorAll<HTMLInputElement>('.si-score-input'));
    inputs.forEach((input, idx) => {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const next = inputs[idx + 1];
          if (next) next.focus();
          else document.getElementById('si-save')?.click();
        }
      });
    });

    // Auto-focus first input
    inputs[0]?.focus();
  }

  private async handleSave(): Promise<void> {
    if (!this.match || !this.game) return;
    const mode = this.game.scoringMode;
    const entries: { playerId: number; value: number; note?: string }[] = [];

    if (mode === 'phase10') {
      for (const player of this.players) {
        const phase = this.getPlayerCurrentPhase(player);
        if (phase > 10) continue;
        const input = document.getElementById(`score-input-${player.id}`) as HTMLInputElement;
        const penaltyPts = parseFloat(input?.value ?? '0') || 0;
        const completed = (document.getElementById(`completed-${player.id}`) as HTMLInputElement | null)?.checked ?? false;
        const note = JSON.stringify({ phase, completed });
        entries.push({ playerId: player.id!, value: penaltyPts, note });
      }
      if (entries.length === 0) { showToast('All players have completed all phases', 'info'); return; }
    } else if (mode === 'finish-order') {
      const positions = new Set<number>();
      for (const player of this.players) {
        const sel = document.getElementById(`score-input-${player.id}`) as HTMLSelectElement;
        const pos = parseInt(sel?.value ?? '', 10);
        if (!pos || isNaN(pos)) { showToast(`Set position for ${player.displayName}`, 'error'); return; }
        if (positions.has(pos)) { showToast('Each player must have a unique position', 'error'); return; }
        positions.add(pos);
        entries.push({ playerId: player.id!, value: this.players.length - pos + 1 });
      }
    } else {
      const firstOutId = (document.getElementById('first-out-select') as HTMLSelectElement | null)?.value ?? '';
      for (const player of this.players) {
        const input = document.getElementById(`score-input-${player.id}`) as HTMLInputElement;
        const val = parseFloat(input?.value ?? '0') || 0;
        const firstOut = firstOutId === String(player.id);
        entries.push({ playerId: player.id!, value: val, ...(firstOut ? { note: 'first_out' } : {}) });
      }
    }

    const now = Date.now();
    try {
      for (const entry of entries) {
        await addScoreEntry({
          matchId: this.matchId,
          playerId: entry.playerId,
          roundNumber: this.currentRound,
          value: entry.value,
          ...(entry.note !== undefined ? { note: entry.note } : {}),
          createdAt: now,
        });
      }
      showToast(`${this.roundLabel(this.currentRound)} saved`, 'success');
      await this.load(this.matchId);
      this.reRender();
    } catch (err) {
      console.error('Failed to save scores:', err);
      showToast('Failed to save scores', 'error');
    }
  }

  private async handleUndo(): Promise<void> {
    const prevRound = this.currentRound - 1;
    if (prevRound < 1) return;
    try {
      const done = await deleteLastScoreEntry(this.matchId);
      if (done) {
        showToast(`Removed ${this.roundLabel(prevRound)}`, 'info');
        await this.load(this.matchId);
        this.reRender();
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to undo', 'error');
    }
  }

  teardown(): void { /* nothing to clean up */ }

  private reRender(): void {
    const container = document.getElementById('view-container');
    if (!container) return;
    container.innerHTML = this.render();
    this.afterRender();
  }
}
