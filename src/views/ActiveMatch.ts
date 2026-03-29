import {
  getMatch, getGameNight, getMatchesForNight, updateMatch,
  addScoreEntry, getScoreEntriesForMatch, deleteLastScoreEntry, db
} from '../db';
import { navigate } from '../router';
import { showToast } from '../toast';
import type { Match, Game, GameNight, Player, ScoreEntry } from '../types';

interface PlayerScore {
  player: Player;
  total: number;
  entries: ScoreEntry[];
}

export class ActiveMatch {
  private matchId: number = 0;
  private match: Match | null = null;
  private game: Game | null = null;
  private night: GameNight | null = null;
  private players: Player[] = [];
  private entries: ScoreEntry[] = [];
  private playerScores: PlayerScore[] = [];
  private currentRound: number = 1;
  private nightMatches: Match[] = [];
  private tableView: boolean = false;

  /** Return the display name for a 1-based round number. */
  private roundLabel(roundNumber: number): string {
    const labels = this.game?.roundLabels;
    if (labels && labels.length >= roundNumber) {
      return labels[roundNumber - 1];
    }
    return `Round ${roundNumber}`;
  }

  async load(matchId: number): Promise<void> {
    this.matchId = matchId;
    this.match = (await getMatch(matchId)) ?? null;
    if (!this.match) return;

    const [game, night, players, entries, nightMatches] = await Promise.all([
      db.games.get(this.match.gameId),
      getGameNight(this.match.gameNightId),
      db.players.where('id').anyOf(this.match.playerIds).toArray(),
      getScoreEntriesForMatch(matchId),
      getMatchesForNight(this.match.gameNightId),
    ]);

    this.game = game ?? null;
    this.night = night ?? null;
    this.entries = entries;
    this.nightMatches = nightMatches;

    // Sort players to match the match.playerIds order
    this.players = this.match.playerIds.map(pid =>
      players.find(p => p.id === pid)
    ).filter((p): p is Player => p !== undefined);

    this.computeScores();
    this.currentRound = this.entries.length > 0
      ? Math.max(...this.entries.map(e => e.roundNumber)) + 1
      : 1;
  }

  /** For phase10 mode: return the current phase (1–10) for a player.
   *  Phase advances when a round entry has note.completed === true for that phase.
   *  Returns 11 once all 10 phases are done. */
  private getPlayerCurrentPhase(player: Player): number {
    const sorted = this.entries
      .filter(e => e.playerId === player.id)
      .sort((a, b) => a.roundNumber - b.roundNumber);
    let phase = 1;
    for (const e of sorted) {
      if (!e.note) continue;
      try {
        const data = JSON.parse(e.note) as { phase?: number; completed?: boolean };
        if (data.completed && data.phase === phase) {
          phase = Math.min(phase + 1, 11);
        }
      } catch { /* plain note like 'first_out', ignore */ }
    }
    return phase;
  }

  private computeScores(): void {
    this.playerScores = this.players.map(player => {
      const playerEntries = this.entries.filter(e => e.playerId === player.id);
      const total = playerEntries.reduce((sum, e) => sum + e.value, 0);
      return { player, total, entries: playerEntries };
    });

    const mode = this.game?.scoringMode;
    if (mode === 'low' || mode === 'phase10') {
      // phase10: primary sort by phase DESC (higher phase = better), secondary by total ASC (fewer penalty pts)
      if (mode === 'phase10') {
        this.playerScores.sort((a, b) => {
          const phaseA = this.getPlayerCurrentPhase(a.player);
          const phaseB = this.getPlayerCurrentPhase(b.player);
          if (phaseB !== phaseA) return phaseB - phaseA;
          return a.total - b.total;
        });
      } else {
        this.playerScores.sort((a, b) => a.total - b.total);
      }
    } else {
      this.playerScores.sort((a, b) => b.total - a.total);
    }
  }

  private rankIcon(rank: number): string {
    if (rank === 0) return '🥇';
    if (rank === 1) return '🥈';
    if (rank === 2) return '🥉';
    return '';
  }

  private rankClass(rank: number): string {
    if (rank === 0) return 'rank-1-card';
    if (rank === 1) return 'rank-2-card';
    if (rank === 2) return 'rank-3-card';
    return '';
  }

  private escHtml(str: string): string {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  private renderScoreTable(): string {
    if (this.players.length === 0 || this.entries.length === 0) {
      return `<div class="text-sm text-muted" style="padding:1rem 0; text-align:center">No scores yet — add a round to see the table.</div>`;
    }

    // Collect all round numbers in order
    const roundNums = [...new Set(this.entries.map(e => e.roundNumber))].sort((a, b) => a - b);

    // Build running totals: runningTotals[playerId][after round index] = cumulative sum
    const runningTotals = new Map<number, number>(); // playerId -> running total
    for (const p of this.players) runningTotals.set(p.id!, 0);

    // Header
    const headerCells = this.players.map(p =>
      `<th style="background:${p.color}22; border-bottom: 2px solid ${p.color}">
        <div class="flex items-center gap-1 justify-center">
          <span class="player-dot" style="background:${p.color}; flex-shrink:0"></span>
          <span>${this.escHtml(p.displayName)}</span>
        </div>
      </th>`
    ).join('');

    // Rows — one score row + one running-total row per round
    let rows = '';
    for (const rn of roundNums) {
      const roundEntries = this.entries.filter(e => e.roundNumber === rn);

      const isPhase10 = this.game?.scoringMode === 'phase10';

      // Score row
      const scoreCells = this.players.map(p => {
        const entry = roundEntries.find(e => e.playerId === p.id);
        if (!entry) return `<td class="score-table-score">–</td>`;
        const firstOut = entry.note === 'first_out';
        if (isPhase10) {
          try {
            const data = JSON.parse(entry.note ?? '{}') as { phase?: number; completed?: boolean; firstOut?: boolean };
            const phaseLabel = data.phase ? `Ph.${data.phase}` : '';
            const completedMark = data.completed ? ' ✓' : '';
            const foMark = data.firstOut ? ' ⚡' : '';
            return `<td class="score-table-score">${phaseLabel}${completedMark}${foMark}<br><small>${entry.value}pts</small></td>`;
          } catch { /* fall through */ }
        }
        return `<td class="score-table-score">${firstOut ? '⚡ ' : ''}${entry.value}</td>`;
      }).join('');

      rows += `<tr class="score-table-round-row">
        <td class="score-table-label">${this.escHtml(this.roundLabel(rn))}</td>
        ${scoreCells}
      </tr>`;

      // Running-total row
      const totalCells = this.players.map(p => {
        const entry = roundEntries.find(e => e.playerId === p.id);
        const prev = runningTotals.get(p.id!) ?? 0;
        const next = prev + (entry?.value ?? 0);
        runningTotals.set(p.id!, next);
        return `<td class="score-table-total">= ${next}</td>`;
      }).join('');

      rows += `<tr class="score-table-total-row">
        <td class="score-table-label-total">∑</td>
        ${totalCells}
      </tr>`;
    }

    // Final totals footer
    const footerCells = this.players.map(p => {
      const ps = this.playerScores.find(s => s.player.id === p.id);
      return `<td class="score-table-footer">${ps?.total ?? 0}</td>`;
    }).join('');

    return `
      <div class="score-table-wrapper" role="region" aria-label="Score table">
        <table class="score-table" aria-label="Scores by round">
          <thead>
            <tr>
              <th class="score-table-corner">Round</th>
              ${headerCells}
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
          <tfoot>
            <tr class="score-table-totals-row">
              <td class="score-table-label-total">Total</td>
              ${footerCells}
            </tr>
          </tfoot>
        </table>
      </div>
    `;
  }

  render(): string {
    if (!this.match || !this.game || !this.night) {
      return `
        <main class="view" aria-label="Match not found">
          <div class="empty-state">
            <div class="empty-state-icon">🔍</div>
            <div class="empty-state-title">Match not found</div>
            <p>This match may have been deleted.</p>
            <button class="btn btn-primary mt-4" id="back-to-dashboard">Back to Dashboard</button>
          </div>
        </main>
      `;
    }

    const isCompleted = this.match.status === 'completed';
    const mode = this.game.scoringMode;

    // Find next match in the night
    const myIndex = this.nightMatches.findIndex(m => m.id === this.matchId);
    const nextMatch = this.nightMatches[myIndex + 1];
    const allCompleted = this.nightMatches.every(m => m.status === 'completed' || m.id === this.matchId);

    const isPhase10 = mode === 'phase10';
    const scoreCardsHtml = this.playerScores.map((ps, rank) => {
      if (isPhase10) {
        const phase = this.getPlayerCurrentPhase(ps.player);
        const isDone = phase > 10;
        return `
          <div class="score-card ${this.rankClass(rank)}" aria-label="${this.escHtml(ps.player.displayName)}: Phase ${isDone ? '10 done' : phase}, ${ps.total} pts">
            ${rank < 3 ? `<span class="score-rank" aria-hidden="true">${this.rankIcon(rank)}</span>` : ''}
            <div class="player-avatar" style="background:${ps.player.color}">
              ${ps.player.displayName.charAt(0).toUpperCase()}
            </div>
            <div class="player-name">${this.escHtml(ps.player.displayName)}</div>
            <div class="score-total" style="font-size:1.1rem">${isDone ? '🏆 Done' : `Ph.${phase}`}</div>
            <div class="text-xs text-muted">${ps.total} penalty pts</div>
          </div>
        `;
      }
      return `
        <div class="score-card ${this.rankClass(rank)}" aria-label="${this.escHtml(ps.player.displayName)}: ${ps.total} points">
          ${rank < 3 ? `<span class="score-rank" aria-hidden="true">${this.rankIcon(rank)}</span>` : ''}
          <div class="player-avatar" style="background:${ps.player.color}">
            ${ps.player.displayName.charAt(0).toUpperCase()}
          </div>
          <div class="player-name">${this.escHtml(ps.player.displayName)}</div>
          <div class="score-total" aria-label="${ps.total} points">${ps.total}</div>
        </div>
      `;
    }).join('');

    // "Who went out first?" selector — reused in multiple modes
    const firstOutSelector = `
      <div class="form-group" style="margin-top:0.75rem">
        <label class="form-label" for="first-out-select" style="font-size:0.8rem">Who went out first? <span class="text-muted">(optional)</span></label>
        <select class="form-select" id="first-out-select" style="min-height:38px">
          <option value="">— none / unknown —</option>
          ${this.players.map(p => `<option value="${p.id}">${this.escHtml(p.displayName)}</option>`).join('')}
        </select>
      </div>
    `;

    // Score input section (only for active matches)
    let inputSectionHtml = '';
    if (!isCompleted) {
      if (mode === 'phase10') {
        const playerRows = this.players.map(p => {
          const phase = this.getPlayerCurrentPhase(p);
          const isDone = phase > 10;
          if (isDone) {
            return `
              <div class="phase10-player-row" style="opacity:0.6">
                <div class="flex items-center gap-2">
                  <span class="player-dot" style="background:${p.color}"></span>
                  <span class="font-semibold">${this.escHtml(p.displayName)}</span>
                  <span class="phase10-badge phase10-done">All phases done 🏆</span>
                </div>
              </div>
            `;
          }
          return `
            <div class="phase10-player-row">
              <div class="flex items-center gap-2 mb-1">
                <span class="player-dot" style="background:${p.color}"></span>
                <span class="font-semibold">${this.escHtml(p.displayName)}</span>
                <span class="phase10-badge">Phase ${phase}</span>
              </div>
              <div class="flex items-center gap-3 flex-wrap">
                <div style="display:flex; flex-direction:column; align-items:center; gap:2px">
                  <span class="text-xs text-muted">Penalty pts</span>
                  <input class="score-input" type="number" id="score-input-${p.id}" data-player-id="${p.id}"
                    placeholder="0" min="0" step="5" style="max-width:80px; text-align:center"
                    aria-label="${this.escHtml(p.displayName)} penalty points" />
                </div>
                <label class="flex items-center gap-2" style="cursor:pointer; padding: 4px 0">
                  <input type="checkbox" id="completed-${p.id}" style="width:18px; height:18px">
                  <span class="text-sm">Completed Phase ${phase}</span>
                </label>
              </div>
            </div>
          `;
        }).join('');

        inputSectionHtml = `
          <div class="card mt-4">
            <div class="card-header">
              <div class="card-title">Round ${this.currentRound}</div>
              <span class="round-badge">Phase 10</span>
            </div>
            ${playerRows}
            ${firstOutSelector}
            <div class="btn-group mt-3">
              <button class="btn btn-primary flex-1" id="add-round-btn" aria-label="Save round">
                ✓ Save Round
              </button>
              <button class="btn btn-secondary" id="undo-btn" ${this.entries.length === 0 ? 'disabled' : ''} aria-label="Undo last round">
                ↩ Undo
              </button>
            </div>
          </div>
        `;
      } else if (mode === 'rounds') {
        // Grid inputs - one per player
        const inputs = this.players.map(p => `
          <div style="display:flex; flex-direction:column; align-items:center; gap:4px;">
            <div class="flex items-center gap-1">
              <span class="player-dot" style="background:${p.color}"></span>
              <span class="text-xs font-semibold">${this.escHtml(p.displayName)}</span>
            </div>
            <input
              class="score-input"
              type="number"
              id="score-input-${p.id}"
              data-player-id="${p.id}"
              placeholder="0"
              aria-label="${this.escHtml(p.displayName)} score"
              step="1"
              style="max-width: 90px;"
            />
          </div>
        `).join('');

        inputSectionHtml = `
          <div class="card mt-4">
            <div class="card-header">
              <div class="card-title">${this.roundLabel(this.currentRound)}</div>
              <span class="round-badge">🎯 ${this.roundLabel(this.currentRound)}</span>
            </div>
            <div style="display:flex; flex-wrap:wrap; gap:0.75rem; justify-content:center; margin-bottom:0.5rem;">
              ${inputs}
            </div>
            ${firstOutSelector}
            <div class="btn-group mt-2">
              <button class="btn btn-primary flex-1" id="add-round-btn" aria-label="Save round scores">
                ✓ Add Round
              </button>
              <button class="btn btn-secondary" id="undo-btn" ${this.entries.length === 0 ? 'disabled' : ''} aria-label="Undo last round">
                ↩ Undo
              </button>
            </div>
          </div>
        `;
      } else if (mode === 'finish-order') {
        // Drag to set finish order - simplified as rank input
        const orderInputs = this.players.map(p => `
          <div class="flex items-center gap-3 mb-2">
            <span class="player-dot player-dot-lg" style="background:${p.color}"></span>
            <span class="font-semibold flex-1">${this.escHtml(p.displayName)}</span>
            <select class="form-select" style="max-width:120px; min-height:42px"
              id="order-input-${p.id}" data-player-id="${p.id}" aria-label="${this.escHtml(p.displayName)} position">
              <option value="">Place</option>
              ${this.players.map((_, i) => `<option value="${i + 1}">${i + 1}${['st','nd','rd'][i] || 'th'}</option>`).join('')}
            </select>
          </div>
        `).join('');

        inputSectionHtml = `
          <div class="card mt-4">
            <div class="card-header">
              <div class="card-title">Final Positions</div>
            </div>
            ${orderInputs}
            <div class="btn-group mt-4">
              <button class="btn btn-primary flex-1" id="add-round-btn" aria-label="Save finish order">
                ✓ Save Positions
              </button>
              <button class="btn btn-secondary" id="undo-btn" ${this.entries.length === 0 ? 'disabled' : ''} aria-label="Undo">
                ↩ Undo
              </button>
            </div>
          </div>
        `;
      } else {
        // high / low / custom - running total per player
        const runningInputs = this.players.map(p => {
          const current = this.playerScores.find(ps => ps.player.id === p.id)?.total ?? 0;
          return `
            <div class="flex items-center gap-3 mb-2">
              <span class="player-dot player-dot-lg" style="background:${p.color}"></span>
              <span class="font-semibold flex-1">${this.escHtml(p.displayName)}</span>
              <span class="text-sm text-muted" style="min-width:40px; text-align:right">=${current}</span>
              <input
                class="score-input"
                type="number"
                id="score-input-${p.id}"
                data-player-id="${p.id}"
                placeholder="+0"
                step="1"
                style="max-width: 90px; text-align:center"
                aria-label="${this.escHtml(p.displayName)} score to add"
              />
            </div>
          `;
        }).join('');

        const addLabel = mode === 'low' ? 'Add Scores (lower is better)' : 'Add Scores';
        inputSectionHtml = `
          <div class="card mt-4">
            <div class="card-header">
              <div class="card-title">${addLabel}</div>
              <span class="round-badge">${this.roundLabel(this.currentRound)}</span>
            </div>
            <div style="margin-bottom:0.5rem">
              ${runningInputs}
            </div>
            ${firstOutSelector}
            <div class="btn-group mt-2">
              <button class="btn btn-primary flex-1" id="add-round-btn" aria-label="Add scores">
                ✓ Add Scores
              </button>
              <button class="btn btn-secondary" id="undo-btn" ${this.entries.length === 0 ? 'disabled' : ''} aria-label="Undo last round">
                ↩ Undo
              </button>
            </div>
          </div>
        `;
      }

      // Add finish / next match buttons
      const finishOrNext = isCompleted ? '' : `
        <div class="btn-group mt-4">
          <button class="btn btn-success flex-1" id="finish-match-btn" aria-label="Finish this match">
            🏁 Finish Match
          </button>
        </div>
      `;
      inputSectionHtml += finishOrNext;
    } else {
      // Completed match - show winner and navigation
      const winner = this.playerScores[0];
      const nextOrFinishBtn = nextMatch
        ? `<button class="btn btn-primary btn-full mt-4" id="next-match-btn" aria-label="Go to next match">▶ Next Match</button>`
        : allCompleted
          ? `<button class="btn btn-success btn-full mt-4" id="finish-night-btn" aria-label="Finish the game night">🎉 Finish Night</button>`
          : '';

      inputSectionHtml = `
        <div class="card mt-4" style="text-align:center; padding:2rem 1rem;">
          <div style="font-size:3rem; margin-bottom:0.5rem">🏆</div>
          <div class="font-bold" style="font-size:1.25rem">${winner ? this.escHtml(winner.player.displayName) : 'Draw'} wins!</div>
          <div class="text-muted text-sm mt-4">Final score: ${winner?.total ?? 0}</div>
          ${nextOrFinishBtn}
          <button class="btn btn-secondary btn-full mt-4" id="back-to-night-btn">Back to Dashboard</button>
        </div>
      `;
    }

    // Match progress indicator
    const progressHtml = this.nightMatches.length > 1
      ? `<div class="flex gap-2 items-center justify-center mb-3">
          ${this.nightMatches.map((m) => {
            const isActive = m.id === this.matchId;
            const isDone = m.status === 'completed';
            return `<div style="width:8px; height:8px; border-radius:50%; background:${isActive ? 'var(--primary)' : isDone ? 'var(--success)' : 'var(--border)'}"></div>`;
          }).join('')}
        </div>`
      : '';

    return `
      <main class="view" aria-label="Active Match: ${this.escHtml(this.game.name)}">
        <header style="display:flex; align-items:center; gap:0.75rem; padding-top:1rem; margin-bottom:0.5rem;">
          <button class="btn btn-icon btn-sm" id="back-btn" aria-label="Go back">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <div class="match-header flex-1">
            <div class="match-game-name">${this.escHtml(this.game.name)}</div>
            <div class="match-night-name">${this.escHtml(this.night.title)}</div>
          </div>
          ${isCompleted ? '<span class="badge badge-success">Done</span>' : '<span class="badge badge-primary">Live</span>'}
        </header>

        ${progressHtml}

        <div class="view-toggle-bar">
          <button class="view-toggle-btn ${!this.tableView ? 'active' : ''}" id="toggle-cards" aria-pressed="${!this.tableView}" aria-label="Card view">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
            Cards
          </button>
          <button class="view-toggle-btn ${this.tableView ? 'active' : ''}" id="toggle-table" aria-pressed="${this.tableView}" aria-label="Table view">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 3h18v18H3z"/><path d="M3 9h18M3 15h18M9 3v18"/></svg>
            Table
          </button>
        </div>

        <section aria-label="Current scores">
          ${this.tableView ? this.renderScoreTable() : `<div class="score-grid" id="score-grid">${scoreCardsHtml}</div>`}
        </section>

        ${inputSectionHtml}
      </main>
    `;
  }

  afterRender(): void {
    document.getElementById('toggle-cards')?.addEventListener('click', () => {
      this.tableView = false;
      this.reRender();
    });
    document.getElementById('toggle-table')?.addEventListener('click', () => {
      this.tableView = true;
      this.reRender();
    });

    document.getElementById('back-to-dashboard')?.addEventListener('click', () => navigate('dashboard'));
    document.getElementById('back-btn')?.addEventListener('click', () => navigate('dashboard'));
    document.getElementById('back-to-night-btn')?.addEventListener('click', () => navigate('dashboard'));

    document.getElementById('add-round-btn')?.addEventListener('click', () => {
      this.handleAddRound();
    });

    document.getElementById('undo-btn')?.addEventListener('click', () => {
      this.handleUndo();
    });

    document.getElementById('finish-match-btn')?.addEventListener('click', () => {
      this.handleFinishMatch();
    });

    document.getElementById('next-match-btn')?.addEventListener('click', () => {
      const myIndex = this.nightMatches.findIndex(m => m.id === this.matchId);
      const nextMatch = this.nightMatches[myIndex + 1];
      if (nextMatch?.id !== undefined) {
        navigate('match', { id: String(nextMatch.id) });
      }
    });

    document.getElementById('finish-night-btn')?.addEventListener('click', () => {
      navigate('dashboard');
      showToast('Game night completed! 🎉', 'success');
    });

    // Enter key advances to next input in score grid
    document.querySelectorAll<HTMLInputElement>('.score-input').forEach((input, idx, all) => {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const next = all[idx + 1];
          if (next) next.focus();
          else document.getElementById('add-round-btn')?.click();
        }
      });
    });
  }

  private async handleAddRound(): Promise<void> {
    if (!this.match || !this.game) return;
    const mode = this.game.scoringMode;

    const entries: { playerId: number; value: number; note?: string }[] = [];

    if (mode === 'phase10') {
      const firstOutId = (document.getElementById('first-out-select') as HTMLSelectElement)?.value ?? '';
      for (const player of this.players) {
        const phase = this.getPlayerCurrentPhase(player);
        if (phase > 10) continue; // already completed all phases, skip
        const input = document.getElementById(`score-input-${player.id}`) as HTMLInputElement;
        const penaltyPts = parseFloat(input?.value ?? '0') || 0;
        const completed = (document.getElementById(`completed-${player.id}`) as HTMLInputElement)?.checked ?? false;
        const firstOut = firstOutId === String(player.id);
        const note = JSON.stringify({ phase, completed, ...(firstOut ? { firstOut: true } : {}) });
        entries.push({ playerId: player.id!, value: penaltyPts, note });
      }
      if (entries.length === 0) {
        showToast('All players have completed all phases', 'info');
        return;
      }
    } else if (mode === 'finish-order') {
      const positions = new Set<number>();
      for (const player of this.players) {
        const sel = document.getElementById(`order-input-${player.id}`) as HTMLSelectElement;
        const pos = parseInt(sel?.value ?? '', 10);
        if (!pos || isNaN(pos)) {
          showToast(`Set position for ${player.displayName}`, 'error');
          return;
        }
        if (positions.has(pos)) {
          showToast('Each player must have a unique position', 'error');
          return;
        }
        positions.add(pos);
        // Score inversely by position: 1st = N points, last = 1 point
        const score = this.players.length - pos + 1;
        entries.push({ playerId: player.id!, value: score });
      }
    } else {
      // rounds / high / low / custom — with optional "who went out first"
      const firstOutId = (document.getElementById('first-out-select') as HTMLSelectElement)?.value ?? '';
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

      // Reload and re-render
      await this.load(this.matchId);

      // Phase 10: check if any player just completed phase 10
      if (mode === 'phase10') {
        const anyFinished = this.players.some(p => this.getPlayerCurrentPhase(p) > 10);
        if (anyFinished) {
          await this.handleFinishMatch();
          return;
        }
      }

      this.reRender();
    } catch (err) {
      console.error('Failed to save scores:', err);
      showToast('Failed to save scores', 'error');
    }
  }

  private async handleUndo(): Promise<void> {
    if (!this.match) return;
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
      console.error('Failed to undo:', err);
      showToast('Failed to undo', 'error');
    }
  }

  private async handleFinishMatch(): Promise<void> {
    if (!this.match || !this.game) return;

    if (this.playerScores.length === 0) {
      showToast('Add at least one round before finishing', 'error');
      return;
    }

    // For phase10: winner is the player who completed all phases (highest phase, fewest penalty pts)
    // computeScores() already sorts correctly for phase10, so playerScores[0] is the winner
    const winner = this.playerScores[0];
    const winnerId = winner?.player.id;

    try {
      await updateMatch(this.matchId, {
        status: 'completed',
        winnerId,
      });

      showToast(`${winner?.player.displayName ?? 'Player'} wins! 🏆`, 'success');
      await this.load(this.matchId);
      this.reRender();
    } catch (err) {
      console.error('Failed to finish match:', err);
      showToast('Failed to finish match', 'error');
    }
  }

  private reRender(): void {
    const container = document.getElementById('view-container');
    if (!container) return;
    container.innerHTML = this.render();
    this.afterRender();
  }
}
