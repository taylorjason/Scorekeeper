import { getMatch, getGameNight, getScoreEntriesForMatch, db } from '../db';
import { navigate } from '../router';
import { getRoomConfig, initFirebaseSync } from '../firebase-sync';
import { escHtml, formatDuration, computeRoundDurations } from '../utils';
import type { Match, Game, GameNight, Player, ScoreEntry } from '../types';

interface PlayerScore {
  player: Player;
  total: number;
  phase?: number;
}

export class Scoreboard {
  private matchId = 0;
  private match: Match | null = null;
  private game: Game | null = null;
  private night: GameNight | null = null;
  private players: Player[] = [];
  private entries: ScoreEntry[] = [];
  private playerScores: PlayerScore[] = [];
  private currentRound = 0;
  private lastUpdated = new Date();
  private _view: 'cards' | 'table' = 'cards';

  private _pollInterval: ReturnType<typeof setInterval> | null = null;
  private _dataChangedHandler: (() => void) | null = null;

  async load(matchId: number): Promise<void> {
    this.matchId = matchId;
    await this._fetchData();
  }

  private async _fetchData(): Promise<void> {
    this.match = (await getMatch(this.matchId)) ?? null;
    if (!this.match) return;

    const [game, night, players, entries] = await Promise.all([
      db.games.get(this.match.gameId),
      getGameNight(this.match.gameNightId),
      db.players.where('id').anyOf(this.match.playerIds).toArray(),
      getScoreEntriesForMatch(this.matchId),
    ]);

    this.game = game ?? null;
    this.night = night ?? null;
    this.entries = entries;
    this.players = this.match.playerIds
      .map(pid => players.find(p => p.id === pid))
      .filter((p): p is Player => p !== undefined);

    this._computeScores();
    this.currentRound = this.entries.length > 0
      ? Math.max(...this.entries.map(e => e.roundNumber))
      : 0;
    this.lastUpdated = new Date();
  }

  private _getPlayerPhase(player: Player): number {
    const sorted = this.entries
      .filter(e => e.playerId === player.id)
      .sort((a, b) => a.roundNumber - b.roundNumber);
    let phase = 1;
    for (const e of sorted) {
      if (!e.note) continue;
      try {
        const d = JSON.parse(e.note) as { phase?: number; completed?: boolean };
        if (d.completed && d.phase === phase) phase = Math.min(phase + 1, this._totalPhases() + 1);
      } catch { /* ignore */ }
    }
    return phase;
  }

  private _computeScores(): void {
    const mode = this.game?.scoringMode;
    this.playerScores = this.players.map(player => {
      const total = this.entries
        .filter(e => e.playerId === player.id)
        .reduce((sum, e) => sum + e.value, 0);
      const phase = mode === 'phase10' ? this._getPlayerPhase(player) : undefined;
      return { player, total, phase };
    });

    if (mode === 'phase10') {
      this.playerScores.sort((a, b) => {
        const pa = a.phase ?? 1, pb = b.phase ?? 1;
        return pb !== pa ? pb - pa : a.total - b.total;
      });
    } else if (mode === 'low') {
      this.playerScores.sort((a, b) => a.total - b.total);
    } else {
      this.playerScores.sort((a, b) => b.total - a.total);
    }
  }

  private _roundLabel(roundNumber: number): string {
    const labels = this.game?.roundLabels;
    if (labels && labels.length >= roundNumber) return labels[roundNumber - 1];
    return `Round ${roundNumber}`;
  }

  private _phaseLabel(n: number): string {
    const labels = this.game?.roundLabels;
    if (labels && labels.length >= n) return labels[n - 1];
    return `Phase ${n}`;
  }

  private _totalPhases(): number {
    return this.game?.roundLabels?.length ?? 10;
  }

  private _getPhaseAttemptCount(player: Player, phase: number): number {
    return this.entries.filter(e => {
      if (e.playerId !== player.id) return false;
      try {
        return (JSON.parse(e.note ?? '{}') as { phase?: number }).phase === phase;
      } catch { return false; }
    }).length;
  }

  private _isTied(a: PlayerScore, b: PlayerScore): boolean {
    if (this.game?.scoringMode === 'phase10') {
      return (a.phase ?? 1) === (b.phase ?? 1) && a.total === b.total;
    }
    return a.total === b.total;
  }

  private _effectiveRanks(): number[] {
    const ranks: number[] = [];
    for (let i = 0; i < this.playerScores.length; i++) {
      if (i === 0) { ranks.push(0); continue; }
      ranks.push(this._isTied(this.playerScores[i], this.playerScores[i - 1]) ? ranks[i - 1] : i);
    }
    return ranks;
  }

  private _currentDealerId(): number | null {
    if (this.match?.firstDealerIndex == null || this.players.length === 0) return null;
    // Active round = last scored + 1 (matches what the round banner shows)
    const idx = (this.match.firstDealerIndex + this.currentRound) % this.players.length;
    return this.match.playerIds[idx] ?? null;
  }

  private _currentRoundBannerText(): string {
    const isPhase10 = this.game?.scoringMode === 'phase10';
    const isCompleted = this.match?.status === 'completed';

    if (isPhase10) {
      // completed: show total hands played; active: show hand currently being played
      return isCompleted
        ? `${this.currentRound} Hand${this.currentRound !== 1 ? 's' : ''} Played`
        : `Hand ${this.currentRound + 1}`;
    }

    // For regular games: show the round currently being played (last scored + 1),
    // or last scored when match is complete.
    const activeRound = isCompleted ? this.currentRound : this.currentRound + 1;
    return this._roundLabel(activeRound);
  }

  private _renderCards(): string {
    const isPhase10 = this.game?.scoringMode === 'phase10';
    const isLow = this.game?.scoringMode === 'low';
    const dealerId = this._currentDealerId();
    const effRanks = this._effectiveRanks();

    // Compute per-player gap trend (only for round-based, non-phase10 games with ≥2 rounds)
    const trendMap = new Map<number, number>(); // playerId → positive=improved, negative=worsened
    if (!isPhase10 && this.currentRound >= 2) {
      const prevRound = this.currentRound - 1;
      const prevTotals = new Map<number, number>();
      for (const p of this.players) {
        prevTotals.set(
          p.id!,
          this.entries
            .filter(e => e.playerId === p.id && e.roundNumber <= prevRound)
            .reduce((s, e) => s + e.value, 0)
        );
      }

      const prevTotalValues = [...prevTotals.values()];
      const prevLeader = isLow ? Math.min(...prevTotalValues) : Math.max(...prevTotalValues);
      const currentLeader = this.playerScores[0].total;

      for (const ps of this.playerScores) {
        const pid = ps.player.id!;
        const prevGap = isLow
          ? (prevTotals.get(pid) ?? 0) - prevLeader
          : prevLeader - (prevTotals.get(pid) ?? 0);
        const currentGap = isLow
          ? ps.total - currentLeader
          : currentLeader - ps.total;
        const delta = prevGap - currentGap; // positive = gap shrank = improved
        if (delta !== 0) trendMap.set(pid, delta);
      }
    }

    return this.playerScores.map((ps, i) => {
      const er = effRanks[i];
      const rankClass = er === 0 ? 'sb-rank-1' : er === 1 ? 'sb-rank-2' : er === 2 ? 'sb-rank-3' : '';
      const isDealer = ps.player.id === dealerId;
      const medal = er === 0 ? '🥇' : er === 1 ? '🥈' : er === 2 ? '🥉' : String(er + 1);
      const medalHtml = er < 3
        ? `<span class="sb-medal">${medal}</span>`
        : `<span class="sb-rank-num">${medal}</span>`;

      const leaderBadge = er === 0 && this.currentRound > 0
        ? `<div class="sb-leader-badge">${this.match?.status === 'completed' ? 'WINNER' : 'LEADER'}</div>`
        : `<div class="sb-leader-badge sb-leader-badge--ghost"></div>`;

      let scoreHtml: string;
      if (isPhase10) {
        const phase = ps.phase ?? 1;
        const done = phase > this._totalPhases();
        const attempts = done ? 0 : this._getPhaseAttemptCount(ps.player, phase);
        const attemptBadge = attempts >= 2 ? `<span class="phase-attempt-badge">${attempts}x</span>` : '';
        scoreHtml = `
          <div class="sb-phase">${done ? '🏆 Done' : this._phaseLabel(phase)}${attemptBadge}</div>
          <div class="sb-penalty">${ps.total} pts</div>
          ${leaderBadge}`;
      } else {
        let gapHtml = '';
        if (er > 0 && this.playerScores.length > 1) {
          const gap = isLow
            ? ps.total - this.playerScores[0].total
            : this.playerScores[0].total - ps.total;
          const trend = trendMap.get(ps.player.id!);
          const trendHtml = trend !== undefined
            ? ` <span class="sb-trend ${trend > 0 ? 'sb-trend--up' : 'sb-trend--down'}">${trend > 0 ? '▲' : '▼'} ${Math.abs(trend)}</span>`
            : '';
          if (gap > 0) gapHtml = `<div class="sb-gap">${isLow ? '+' : '−'}${gap} behind${trendHtml}</div>`;
          else if (gap === 0) gapHtml = `<div class="sb-gap sb-gap--tie">TIE</div>`;
        }
        scoreHtml = `
          <div class="sb-score-area">
            <div class="sb-score">${ps.total}</div>
            ${gapHtml}${leaderBadge}
          </div>`;
      }

      return `
        <div class="sb-player ${rankClass}" style="--pc:${ps.player.color}">
          <div class="sb-rank-area">${medalHtml}</div>
          <div class="sb-player-body">
            <div class="sb-name">
              ${escHtml(ps.player.displayName)}
              ${isDealer && this.match?.status !== 'completed' ? '<span class="sb-dealer-badge">🃏</span>' : ''}
            </div>
            ${scoreHtml}
          </div>
        </div>`;
    }).join('');
  }

  private _totalDuration(): number {
    const start = this.match?.createdAt ?? Date.now();
    if (this.match?.status === 'completed' && this.entries.length > 0) {
      return Math.max(...this.entries.map(e => e.createdAt)) - start;
    }
    return Date.now() - start;
  }

  private _renderTableView(): string {
    if (this.players.length === 0) return '<p class="sb-error">No players</p>';

    const rounds = this.currentRound > 0
      ? Array.from({ length: this.currentRound }, (_, i) => i + 1)
      : [];

    const header = `<tr>
      <th class="sbt-corner"></th>
      ${this.players.map(p => `<th class="sbt-player-head" style="--pc:${p.color}">
        <span class="sbt-dot" style="background:${p.color}"></span>
        ${escHtml(p.displayName)}
      </th>`).join('')}
    </tr>`;

    const roundDurations = computeRoundDurations(this.entries, this.match?.createdAt ?? 0);
    const bodyRows = rounds.map(r => {
      const dur = roundDurations.get(r);
      const durHtml = dur !== undefined ? ` <span class="sbt-dur">${formatDuration(dur)}</span>` : '';
      const cells = this.players.map(p => {
        const entry = this.entries.find(e => e.playerId === p.id && e.roundNumber === r);
        if (entry == null) return `<td class="sbt-cell">—</td>`;
        let fo = false;
        if (entry.note === 'first_out') {
          fo = true;
        } else if (entry.note) {
          try { fo = !!(JSON.parse(entry.note) as { firstOut?: boolean }).firstOut; } catch { /* ignore */ }
        }
        return `<td class="sbt-cell">${fo ? '⚡ ' : ''}${entry.value}</td>`;
      }).join('');
      return `<tr><td class="sbt-label">${escHtml(this._roundLabel(r))}${durHtml}</td>${cells}</tr>`;
    }).join('');

    const totals = this.players.map(p => {
      const t = this.entries.filter(e => e.playerId === p.id).reduce((s, e) => s + e.value, 0);
      return `<td class="sbt-total">${t}</td>`;
    }).join('');
    const totalRow = `<tr class="sbt-total-row"><td class="sbt-label sbt-label--total">Total</td>${totals}</tr>`;

    return `<div class="sbt-wrap"><table class="sbt">
      <thead>${header}</thead>
      <tbody>${bodyRows}${totalRow}</tbody>
    </table></div>`;
  }

  render(): string {
    if (!this.match || !this.game || !this.night) {
      return `<div class="scoreboard"><p class="sb-error">Match not found</p></div>`;
    }

    const isCompleted = this.match.status === 'completed';
    const roundText = this.currentRound > 0
      ? `Round ${this.currentRound}${isCompleted ? ' · Final' : ''}`
      : isCompleted ? 'Final' : 'No scores yet';

    const statusBadge = isCompleted
      ? `<span class="sb-badge-final">Final</span>`
      : `<div class="sb-live"><div class="sb-live-dot"></div><span>Live</span></div>`;

    const roundBannerText = this._currentRoundBannerText();

    const cardsActive = this._view === 'cards';
    const viewToggle = `
      <button class="sb-view-btn ${cardsActive ? 'sb-view-btn--active' : ''}" id="sb-view-cards" aria-label="Card view" title="Card view">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
          <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
        </svg>
      </button>
      <button class="sb-view-btn ${!cardsActive ? 'sb-view-btn--active' : ''}" id="sb-view-table" aria-label="Table view" title="Table view">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/>
          <line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="9" x2="9" y2="21"/>
        </svg>
      </button>`;

    return `
      <div class="scoreboard">
        <div class="sb-header">
          <div class="sb-header-left">
            <div class="sb-game-name">${escHtml(this.game.name)}</div>
            <div class="sb-night-name" id="sb-night-name">${escHtml(this.night.title)} · ${roundText}</div>
          </div>
          ${roundBannerText ? `<div class="sb-header-center"><div class="sb-round-inline" id="sb-round-banner">${escHtml(roundBannerText)}</div></div>` : ''}
          <div class="sb-header-right">
            ${viewToggle}
            ${statusBadge}
            <button class="sb-close" id="sb-close" aria-label="Close scoreboard">✕</button>
          </div>
        </div>

        <div class="sb-players" id="sb-players">
          ${cardsActive ? this._renderCards() : this._renderTableView()}
        </div>

        <div class="sb-footer" id="sb-footer">
          Updated ${this.lastUpdated.toLocaleTimeString()} · ${formatDuration(this._totalDuration())} total
        </div>
      </div>`;
  }

  afterRender(): void {
    document.getElementById('sb-close')?.addEventListener('click', () => {
      if (window.history.length > 1) window.history.back();
      else navigate('dashboard');
    });

    document.getElementById('sb-view-cards')?.addEventListener('click', () => {
      if (this._view !== 'cards') { this._view = 'cards'; this._patch(); }
    });
    document.getElementById('sb-view-table')?.addEventListener('click', () => {
      if (this._view !== 'table') { this._view = 'table'; this._patch(); }
    });

    this._pollInterval = setInterval(() => {
      this._fetchData()
        .then(() => this._patch())
        .catch(() => {/* non-fatal */});
    }, 5000);

    this._dataChangedHandler = () => {
      this._fetchData().then(() => this._patch()).catch(() => {/* non-fatal */});
    };
    window.addEventListener('scorekeeper:datachanged', this._dataChangedHandler);

    const roomConfig = getRoomConfig();
    if (roomConfig) {
      initFirebaseSync(roomConfig, () => {
        this._fetchData().then(() => this._patch()).catch(() => {/* non-fatal */});
      }).catch(() => {/* non-fatal */});
    }
  }

  private _patch(): void {
    const playersEl = document.getElementById('sb-players');
    if (playersEl) {
      const scroller = document.querySelector('.main-content') as HTMLElement | null;
      const savedScrollTop = scroller?.scrollTop ?? 0;
      const savedScrollLeft = (playersEl.querySelector('.sbt-wrap') as HTMLElement | null)?.scrollLeft ?? 0;

      playersEl.innerHTML = this._view === 'cards' ? this._renderCards() : this._renderTableView();

      if (scroller) scroller.scrollTop = savedScrollTop;
      const newWrap = playersEl.querySelector('.sbt-wrap') as HTMLElement | null;
      if (newWrap) newWrap.scrollLeft = savedScrollLeft;
    }

    // Sync view toggle button active states
    document.getElementById('sb-view-cards')?.classList.toggle('sb-view-btn--active', this._view === 'cards');
    document.getElementById('sb-view-table')?.classList.toggle('sb-view-btn--active', this._view === 'table');

    if (this.game && this.night) {
      const isCompleted = this.match?.status === 'completed';
      const roundText = this.currentRound > 0
        ? `Round ${this.currentRound}${isCompleted ? ' · Final' : ''}`
        : isCompleted ? 'Final' : 'No scores yet';
      const nightEl = document.getElementById('sb-night-name');
      if (nightEl) nightEl.textContent = `${this.night.title} · ${roundText}`;
    }

    const roundBanner = document.getElementById('sb-round-banner');
    if (roundBanner) roundBanner.textContent = this._currentRoundBannerText();

    const footer = document.getElementById('sb-footer');
    if (footer) footer.textContent = `Updated ${this.lastUpdated.toLocaleTimeString()} · ${formatDuration(this._totalDuration())} total`;
  }

  teardown(): void {
    if (this._pollInterval) { clearInterval(this._pollInterval); this._pollInterval = null; }
    if (this._dataChangedHandler) {
      window.removeEventListener('scorekeeper:datachanged', this._dataChangedHandler);
      this._dataChangedHandler = null;
    }
  }
}
