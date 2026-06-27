import {
  getMatch, getGameNight, getMatchesForNight, updateMatch,
  addScoreEntry, getScoreEntriesForMatch, deleteLastScoreEntry, db
} from '../db';
import { navigate } from '../router';
import { showToast } from '../toast';
import { escHtml, formatDuration, computeRoundDurations } from '../utils';
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
  private nightMatchGames: Map<number, Game> = new Map();
  private tableView: boolean = false;
  private _roundStartMs: number = 0;
  private _timerInterval: ReturnType<typeof setInterval> | null = null;

  /** Return the display name for a 1-based round number. */
  private roundLabel(roundNumber: number): string {
    const labels = this.game?.roundLabels;
    if (labels && labels.length >= roundNumber) {
      return labels[roundNumber - 1];
    }
    return `Round ${roundNumber}`;
  }

  /** Return the display label for a sequential phase number (1-based). */
  private phaseLabel(n: number): string {
    const labels = this.game?.roundLabels;
    if (labels && labels.length >= n) return labels[n - 1];
    return `Phase ${n}`;
  }

  /** Total number of phases in this game (defaults to 10). */
  private totalPhases(): number {
    return this.game?.roundLabels?.length ?? 10;
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

    // Load game names for all matches in this night
    const gameIds = [...new Set(nightMatches.map(m => m.gameId))];
    const nightGames = gameIds.length > 0
      ? await db.games.where('id').anyOf(gameIds).toArray()
      : [];
    this.nightMatchGames = new Map(nightGames.map(g => [g.id!, g]));

    // Sort players to match the match.playerIds order
    this.players = this.match.playerIds.map(pid =>
      players.find(p => p.id === pid)
    ).filter((p): p is Player => p !== undefined);

    this.computeScores();
    this.currentRound = this.entries.length > 0
      ? Math.max(...this.entries.map(e => e.roundNumber)) + 1
      : 1;

    // Start of the current (not-yet-submitted) round = end of the last completed round
    this._roundStartMs = this.entries.length > 0
      ? Math.max(...this.entries.map(e => e.createdAt))
      : (this.match?.createdAt ?? Date.now());
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
          phase = Math.min(phase + 1, this.totalPhases() + 1);
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

  private _effectiveRanks(): number[] {
    const ranks: number[] = [];
    for (let i = 0; i < this.playerScores.length; i++) {
      if (i === 0) { ranks.push(0); continue; }
      const curr = this.playerScores[i];
      const prev = this.playerScores[i - 1];
      const tied = this.game?.scoringMode === 'phase10'
        ? this.getPlayerCurrentPhase(curr.player) === this.getPlayerCurrentPhase(prev.player) && curr.total === prev.total
        : curr.total === prev.total;
      ranks.push(tied ? ranks[i - 1] : i);
    }
    return ranks;
  }

  private _currentDealerId(): number | null {
    if (this.match?.firstDealerIndex == null || this.players.length === 0) return null;
    const idx = (this.match.firstDealerIndex + this.currentRound - 1) % this.players.length;
    return this.match.playerIds[idx] ?? null;
  }

  private renderScoreTable(): string {
    if (this.players.length === 0 || this.entries.length === 0) {
      return `<div class="text-sm text-muted" style="padding:1rem 0; text-align:center">No scores yet — add a round to see the table.</div>`;
    }

    const isPhase10 = this.game?.scoringMode === 'phase10';

    // Collect round numbers; display most-recent first
    const roundNums = [...new Set(this.entries.map(e => e.roundNumber))]
      .sort((a, b) => b - a); // descending

    const dealerId = this._currentDealerId();
    const headerCells = this.players.map(p =>
      `<th style="background:${p.color}22; border-bottom: 2px solid ${p.color}">
        <div class="flex items-center gap-1 justify-center">
          <span class="player-dot" style="background:${p.color}; flex-shrink:0"></span>
          <span>${escHtml(p.displayName)}</span>
          ${p.id === dealerId ? '<span class="dealer-badge" title="Current dealer">🃏</span>' : ''}
        </div>
      </th>`
    ).join('');

    // Totals row pinned under the header
    const totalCells = this.players.map(p => {
      const ps = this.playerScores.find(s => s.player.id === p.id);
      return `<td class="score-table-footer">${ps?.total ?? 0}</td>`;
    }).join('');

    // Pre-compute cumulative totals per player per round (ascending) for the ∑ rows
    const ascRoundNums = [...roundNums].sort((a, b) => a - b);
    const runningTotals = new Map<number, Map<number, number>>(); // roundNum -> playerId -> cumSum
    const cumulative = new Map<number, number>(this.players.map(p => [p.id!, 0]));
    for (const rn of ascRoundNums) {
      const roundEntries = this.entries.filter(e => e.roundNumber === rn);
      for (const p of this.players) {
        const val = roundEntries.find(e => e.playerId === p.id)?.value ?? 0;
        cumulative.set(p.id!, (cumulative.get(p.id!) ?? 0) + val);
      }
      runningTotals.set(rn, new Map(cumulative));
    }

    const roundDurations = computeRoundDurations(this.entries, this.match?.createdAt ?? 0);

    // Round rows — newest at top, each followed by its cumulative ∑ row
    let rows = '';
    for (const rn of roundNums) {
      const roundEntries = this.entries.filter(e => e.roundNumber === rn);
      const dur = roundDurations.get(rn);
      const durHtml = dur !== undefined ? ` <span class="score-table-dur">${formatDuration(dur)}</span>` : '';
      const scoreCells = this.players.map(p => {
        const entry = roundEntries.find(e => e.playerId === p.id);
        if (!entry) return `<td class="score-table-score">–</td>`;
        const editAttrs = `data-entry-id="${entry.id}" data-player-id="${p.id}" data-round="${rn}"`;
        if (isPhase10) {
          try {
            const data = JSON.parse(entry.note ?? '{}') as { phase?: number; completed?: boolean; firstOut?: boolean };
            const phaseLabel = data.phase ? this.phaseLabel(data.phase) : '';
            const completedMark = data.completed ? ' ✓' : '';
            const foMark = data.firstOut ? ' ⚡' : '';
            return `<td class="score-table-score score-cell-editable" ${editAttrs}>${phaseLabel}${completedMark}${foMark}<br><small>${entry.value}pts</small></td>`;
          } catch { /* fall through */ }
        }
        const firstOut = entry.note === 'first_out';
        return `<td class="score-table-score score-cell-editable" ${editAttrs}>${firstOut ? '⚡ ' : ''}${entry.value}</td>`;
      }).join('');

      const runCells = this.players.map(p => {
        const cum = runningTotals.get(rn)?.get(p.id!) ?? 0;
        return `<td class="score-table-total">= ${cum}</td>`;
      }).join('');

      rows += `<tr class="score-table-round-row">
        <td class="score-table-label">${escHtml(this.roundLabel(rn))}${durHtml}</td>
        ${scoreCells}
      </tr>
      <tr class="score-table-total-row">
        <td class="score-table-label-total">∑</td>
        ${runCells}
      </tr>`;
    }

    return `
      <div class="score-table-wrapper" role="region" aria-label="Score table">
        <table class="score-table" aria-label="Scores by round">
          <thead>
            <tr>
              <th class="score-table-corner">Round</th>
              ${headerCells}
            </tr>
            <tr class="score-table-totals-row">
              <td class="score-table-label-total">Total</td>
              ${totalCells}
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
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
    const dealerId = this._currentDealerId();
    const effRanks = this._effectiveRanks();
    const scoreCardsHtml = this.playerScores.map((ps, i) => {
      const er = effRanks[i];
      const isDealer = ps.player.id === dealerId;
      if (isPhase10) {
        const phase = this.getPlayerCurrentPhase(ps.player);
        const isDone = phase > this.totalPhases();
        return `
          <div class="score-card ${this.rankClass(er)}" aria-label="${escHtml(ps.player.displayName)}: ${isDone ? 'done' : this.phaseLabel(phase)}, ${ps.total} pts">
            ${er < 3 ? `<span class="score-rank" aria-hidden="true">${this.rankIcon(er)}</span>` : ''}
            ${isDealer ? '<span class="dealer-badge dealer-badge--card" title="Current dealer">🃏</span>' : ''}
            <div class="player-avatar" style="background:${ps.player.color}">
              ${ps.player.displayName.charAt(0).toUpperCase()}
            </div>
            <div class="player-name">${escHtml(ps.player.displayName)}</div>
            <div class="score-total" style="font-size:1.1rem">${isDone ? '🏆 Done' : this.phaseLabel(phase)}</div>
            <div class="text-xs text-muted">${ps.total} penalty pts</div>
          </div>
        `;
      }
      return `
        <div class="score-card ${this.rankClass(er)}" aria-label="${escHtml(ps.player.displayName)}: ${ps.total} points">
          ${er < 3 ? `<span class="score-rank" aria-hidden="true">${this.rankIcon(er)}</span>` : ''}
          ${isDealer ? '<span class="dealer-badge dealer-badge--card" title="Current dealer">🃏</span>' : ''}
          <div class="player-avatar" style="background:${ps.player.color}">
            ${ps.player.displayName.charAt(0).toUpperCase()}
          </div>
          <div class="player-name">${escHtml(ps.player.displayName)}</div>
          <div class="score-total" aria-label="${ps.total} points">${ps.total}</div>
        </div>
      `;
    }).join('');

    const firstOutSelector = `
      <div class="form-group" style="margin-top:0.75rem">
        <label class="form-label" for="first-out-select" style="font-size:0.8rem">Who went out first? <span class="text-muted">(optional)</span></label>
        <select class="form-select" id="first-out-select" style="min-height:38px">
          <option value="">— none / unknown —</option>
          ${this.players.map(p => `<option value="${p.id}">${escHtml(p.displayName)}</option>`).join('')}
        </select>
      </div>
    `;

    // Score input section (only for active matches)
    let inputSectionHtml = '';
    if (!isCompleted) {
      if (mode === 'phase10') {
        const playerRows = this.players.map(p => {
          const phase = this.getPlayerCurrentPhase(p);
          const isDone = phase > this.totalPhases();
          if (isDone) {
            return `
              <div class="phase10-player-row" data-player-id="${p.id}" style="opacity:0.6">
                <div class="flex items-center gap-2">
                  <span class="player-dot" style="background:${p.color}"></span>
                  <span class="font-semibold">${escHtml(p.displayName)}</span>
                  <span class="phase10-badge phase10-done">All phases done 🏆</span>
                </div>
              </div>
            `;
          }
          return `
            <div class="phase10-player-row" data-player-id="${p.id}">
              <div class="flex items-center gap-2 mb-1">
                <span class="player-dot" style="background:${p.color}"></span>
                <span class="font-semibold">${escHtml(p.displayName)}</span>
                <span class="phase10-badge">${this.phaseLabel(phase)}</span>
              </div>
              <div class="flex items-center gap-3 flex-wrap">
                <div style="display:flex; flex-direction:column; align-items:center; gap:2px">
                  <span class="text-xs text-muted">Penalty pts</span>
                  <input class="score-input" type="number" id="score-input-${p.id}" data-player-id="${p.id}"
                    placeholder="0" min="0" step="5" style="max-width:80px; text-align:center"
                    aria-label="${escHtml(p.displayName)} penalty points" />
                </div>
                <label class="flex items-center gap-2" style="cursor:pointer; padding: 4px 0">
                  <input type="checkbox" id="completed-${p.id}" style="width:18px; height:18px">
                  <span class="text-sm">Completed ${this.phaseLabel(phase)}</span>
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
            <div id="player-rows-container">${playerRows}</div>
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
          <div style="display:flex; flex-direction:column; align-items:center; gap:4px;" data-player-id="${p.id}">
            <div class="flex items-center gap-1">
              <span class="player-dot" style="background:${p.color}"></span>
              <span class="text-xs font-semibold">${escHtml(p.displayName)}</span>
            </div>
            <input
              class="score-input"
              type="number"
              id="score-input-${p.id}"
              data-player-id="${p.id}"
              placeholder="0"
              aria-label="${escHtml(p.displayName)} score"
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
            <div id="player-rows-container" style="display:flex; flex-wrap:wrap; gap:0.75rem; justify-content:center; margin-bottom:0.5rem;">
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
            <span class="font-semibold flex-1">${escHtml(p.displayName)}</span>
            <select class="form-select" style="max-width:120px; min-height:42px"
              id="order-input-${p.id}" data-player-id="${p.id}" aria-label="${escHtml(p.displayName)} position">
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
            <div class="flex items-center gap-3 mb-2" data-player-id="${p.id}">
              <span class="player-dot player-dot-lg" style="background:${p.color}"></span>
              <span class="font-semibold flex-1">${escHtml(p.displayName)}</span>
              <span class="text-sm text-muted" style="min-width:40px; text-align:right">=${current}</span>
              <input
                class="score-input"
                type="number"
                id="score-input-${p.id}"
                data-player-id="${p.id}"
                placeholder="+0"
                step="1"
                style="max-width: 90px; text-align:center"
                aria-label="${escHtml(p.displayName)} score to add"
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
            <div id="player-rows-container" style="margin-bottom:0.5rem">
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
          <div class="font-bold" style="font-size:1.25rem">${winner ? escHtml(winner.player.displayName) : 'Draw'} wins!</div>
          <div class="text-muted text-sm mt-4">Final score: ${winner?.total ?? 0}</div>
          ${nextOrFinishBtn}
          <button class="btn btn-secondary btn-full mt-4" id="back-to-night-btn">Back to Dashboard</button>
        </div>
      `;
    }

    // Match switcher
    const progressHtml = this.nightMatches.length > 1
      ? `<div class="match-switcher" role="navigation" aria-label="Switch match">
          ${this.nightMatches.map((m, idx) => {
            const isActive = m.id === this.matchId;
            const isDone = m.status === 'completed';
            const gameName = this.nightMatchGames.get(m.gameId)?.name ?? `Match ${idx + 1}`;
            const stateClass = isActive ? 'match-pill--active' : isDone ? 'match-pill--done' : 'match-pill--idle';
            const label = isDone ? `✓ ${gameName}` : gameName;
            return `<button class="match-pill ${stateClass}" data-match-id="${m.id}"
              aria-label="Go to ${escHtml(gameName)}" aria-current="${isActive}"
              ${isActive ? 'disabled' : ''}>${escHtml(label)}</button>`;
          }).join('')}
        </div>`
      : '';

    return `
      <main class="view match-view" aria-label="Active Match: ${escHtml(this.game.name)}">
        <header style="display:flex; align-items:center; gap:0.75rem; padding-top:1rem; margin-bottom:0.5rem;">
          <button class="btn btn-icon btn-sm" id="back-btn" aria-label="Go back">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <div class="match-header flex-1">
            <div class="match-game-name">${escHtml(this.game.name)}</div>
            <div class="match-night-name">${escHtml(this.night.title)}</div>
          </div>
          ${isCompleted ? '<span class="badge badge-success">Done</span>' : '<span class="badge badge-primary">Live</span>'}
          ${!isCompleted ? `<button class="btn btn-icon btn-sm" id="score-input-btn" aria-label="Mobile score input" title="Mobile Score Input">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <rect x="5" y="2" width="14" height="20" rx="2"/><circle cx="12" cy="18" r="1" fill="currentColor" stroke="none"/>
            </svg>
          </button>` : ''}
          <button class="btn btn-icon btn-sm" id="round-display-btn" aria-label="Show current round" title="Round Display">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
          </button>
          <button class="btn btn-icon btn-sm" id="scoreboard-btn" aria-label="Open scoreboard" title="Open Scoreboard">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
          </button>
        </header>

        ${progressHtml}

        <div class="match-body">
          <div class="match-col-left">
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

            ${!isCompleted ? (() => {
              const dealer = dealerId !== null ? this.players.find(p => p.id === dealerId) : null;
              return `<div class="current-round-banner" aria-label="Current round">
                <span class="round-banner-label">Now scoring</span>
                ${escHtml(this.roundLabel(this.currentRound))}
                ${dealer ? `<span class="dealer-pill">🃏 ${escHtml(dealer.displayName)}</span>` : ''}
                <span class="round-timer" id="round-timer-display" aria-label="Round elapsed time">⏱ ${formatDuration(Date.now() - this._roundStartMs)}</span>
              </div>`;
            })() : ''}

            <section aria-label="Current scores">
              ${this.tableView
                ? this.renderScoreTable()
                : `<div class="score-grid" id="score-grid" style="grid-template-columns:repeat(${Math.min(this.playerScores.length, 3)},1fr)">${scoreCardsHtml}</div>`}
            </section>
          </div>

          <div class="match-col-right">
            ${inputSectionHtml}
          </div>
        </div>
      </main>
    `;
  }

  afterRender(): void {
    // Live round timer — tick every second while the match is active
    const timerEl = document.getElementById('round-timer-display');
    if (timerEl) {
      this._timerInterval = setInterval(() => {
        timerEl.textContent = `⏱ ${formatDuration(Date.now() - this._roundStartMs)}`;
      }, 1000);
    }

    document.getElementById('toggle-cards')?.addEventListener('click', () => {
      this.tableView = false;
      this.reRender();
    });
    document.getElementById('toggle-table')?.addEventListener('click', () => {
      this.tableView = true;
      this.reRender();
    });

    document.querySelectorAll<HTMLButtonElement>('.match-pill[data-match-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset['matchId'];
        if (id) navigate('match', { id });
      });
    });

    document.getElementById('back-to-dashboard')?.addEventListener('click', () => navigate('dashboard'));
    document.getElementById('back-btn')?.addEventListener('click', () => navigate('dashboard'));
    document.getElementById('back-to-night-btn')?.addEventListener('click', () => navigate('dashboard'));

    document.getElementById('score-input-btn')?.addEventListener('click', () => {
      const base = window.location.href.replace(/#.*$/, '');
      window.open(`${base}#/score-input/${this.matchId}`, '_blank');
    });

    document.getElementById('round-display-btn')?.addEventListener('click', () => {
      const base = window.location.href.replace(/#.*$/, '');
      window.open(`${base}#/round-display/${this.matchId}`, '_blank');
    });

    document.getElementById('scoreboard-btn')?.addEventListener('click', () => {
      const base = window.location.href.replace(/#.*$/, '');
      window.open(`${base}#/scoreboard/${this.matchId}`, '_blank');
    });

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

    // Editable score cells in the table view
    document.querySelectorAll<HTMLTableCellElement>('.score-cell-editable').forEach(cell => {
      cell.addEventListener('click', () => {
        const entryId = parseInt(cell.dataset.entryId ?? '', 10);
        const playerId = parseInt(cell.dataset.playerId ?? '', 10);
        const rn = parseInt(cell.dataset.round ?? '', 10);
        if (isNaN(entryId)) return;
        const entry = this.entries.find(e => e.id === entryId);
        const player = this.players.find(p => p.id === playerId);
        if (!entry || !player) return;
        this.showEditModal(entryId, entry.value, player.displayName, this.roundLabel(rn));
      });
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

    // First-out select: reorder player rows, set score to 0, focus next
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
      const firstOutRow = rows.find(r => r.dataset['playerId'] === selectedId);
      if (!firstOutRow) return;
      container.insertBefore(firstOutRow, container.firstChild);

      const input = document.getElementById(`score-input-${selectedId}`) as HTMLInputElement | null;
      if (input) input.value = '0';

      const remaining = Array.from(container.querySelectorAll<HTMLElement>('[data-player-id]'))
        .filter(r => r.dataset['playerId'] !== selectedId);
      const nextId = remaining[0]?.dataset['playerId'];
      if (nextId) (document.getElementById(`score-input-${nextId}`) as HTMLInputElement | null)?.focus();
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
        if (phase > this.totalPhases()) continue; // already completed all phases, skip
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
        const score = this.players.length - pos + 1;
        entries.push({ playerId: player.id!, value: score });
      }
    } else {
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

      // Auto-finish when all labeled rounds have been played
      const labels = this.game?.roundLabels;
      if (labels && labels.length > 0 && this.currentRound > labels.length) {
        await this.handleFinishMatch();
        return;
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

  private showEditModal(entryId: number, currentValue: number, playerName: string, roundLbl: string): void {
    document.getElementById('score-edit-modal')?.remove();

    const overlay = document.createElement('div');
    overlay.id = 'score-edit-modal';
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="edit-modal-title">
        <div class="modal-message">
          <div id="edit-modal-title" style="font-weight:600; margin-bottom:0.75rem">
            ${escHtml(playerName)} — ${escHtml(roundLbl)}
          </div>
          <input class="form-input" type="number" id="edit-score-input"
            value="${currentValue}" step="1"
            style="text-align:center; font-size:1.25rem; width:100%"
            aria-label="Score value" />
        </div>
        <div class="modal-actions">
          <button class="btn btn-secondary" id="edit-cancel-btn">Cancel</button>
          <button class="btn btn-primary" id="edit-save-btn">Save</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const input = overlay.querySelector<HTMLInputElement>('#edit-score-input')!;
    input.focus();
    input.select();

    const close = () => overlay.remove();
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    overlay.querySelector('#edit-cancel-btn')?.addEventListener('click', close);

    const save = async () => {
      const newValue = parseFloat(input.value);
      if (isNaN(newValue)) { showToast('Invalid score', 'error'); return; }
      try {
        await db.scoreEntries.update(entryId, { value: newValue });
        close();
        showToast('Score updated', 'success');
        await this.load(this.matchId);
        this.reRender();
      } catch (err) {
        console.error('Failed to update score:', err);
        showToast('Failed to update score', 'error');
      }
    };

    overlay.querySelector('#edit-save-btn')?.addEventListener('click', save);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); save(); }
      if (e.key === 'Escape') close();
    });
  }

  teardown(): void {
    if (this._timerInterval) { clearInterval(this._timerInterval); this._timerInterval = null; }
  }

  private reRender(): void {
    this.teardown();
    const container = document.getElementById('view-container');
    if (!container) return;
    container.innerHTML = this.render();
    this.afterRender();
  }
}
