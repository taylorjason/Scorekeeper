import { getMatch, getGameNight, getScoreEntriesForMatch, db } from '../db';
import { navigate } from '../router';
import { getRoomConfig, initFirebaseSync } from '../firebase-sync';
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
        if (d.completed && d.phase === phase) phase = Math.min(phase + 1, 11);
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

  private _esc(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  private _roundLabel(roundNumber: number): string {
    const labels = this.game?.roundLabels;
    if (labels && labels.length >= roundNumber) return labels[roundNumber - 1];
    return `Round ${roundNumber}`;
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

    return this.playerScores.map((ps, i) => {
      const er = effRanks[i];
      const rankClass = er === 0 ? 'sb-rank-1' : er === 1 ? 'sb-rank-2' : er === 2 ? 'sb-rank-3' : '';
      const isDealer = ps.player.id === dealerId;
      const medal = er === 0 ? '🥇' : er === 1 ? '🥈' : er === 2 ? '🥉' : String(er + 1);
      const medalHtml = er < 3
        ? `<span class="sb-medal">${medal}</span>`
        : `<span class="sb-rank-num">${medal}</span>`;

      let scoreHtml: string;
      if (isPhase10) {
        const phase = ps.phase ?? 1;
        const done = phase > 10;
        scoreHtml = `
          <div class="sb-phase">${done ? '🏆 Done' : `Phase ${phase}`}</div>
          <div class="sb-penalty">${ps.total} pts</div>`;
      } else {
        let gapHtml = '';
        if (er > 0 && this.playerScores.length > 1) {
          const gap = isLow
            ? ps.total - this.playerScores[0].total
            : this.playerScores[0].total - ps.total;
          if (gap > 0) gapHtml = `<div class="sb-gap">${isLow ? '+' : '−'}${gap} behind</div>`;
          else if (gap === 0) gapHtml = `<div class="sb-gap sb-gap--tie">TIE</div>`;
        }
        scoreHtml = `
          <div class="sb-score-area">
            <div class="sb-score">${ps.total}</div>
            ${gapHtml}
          </div>`;
      }

      return `
        <div class="sb-player ${rankClass}" style="--pc:${ps.player.color}">
          <div class="sb-rank-area">${medalHtml}</div>
          <div class="sb-player-body">
            <div class="sb-name">
              ${this._esc(ps.player.displayName)}
              ${isDealer && this.match?.status !== 'completed' ? '<span class="sb-dealer-badge">🃏</span>' : ''}
            </div>
            ${scoreHtml}
          </div>
        </div>`;
    }).join('');
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

    return `
      <div class="scoreboard">
        <div class="sb-header">
          <div class="sb-header-left">
            <div class="sb-game-name">${this._esc(this.game.name)}</div>
            <div class="sb-night-name" id="sb-night-name">${this._esc(this.night.title)} · ${roundText}</div>
          </div>
          <div class="sb-header-right">
            ${statusBadge}
            <button class="sb-close" id="sb-close" aria-label="Close scoreboard">✕</button>
          </div>
        </div>

        ${roundBannerText ? `<div class="sb-round-banner" id="sb-round-banner">${this._esc(roundBannerText)}</div>` : ''}

        <div class="sb-players" id="sb-players">
          ${this._renderCards()}
        </div>

        <div class="sb-footer" id="sb-footer">
          Updated ${this.lastUpdated.toLocaleTimeString()}
        </div>
      </div>`;
  }

  afterRender(): void {
    document.getElementById('sb-close')?.addEventListener('click', () => {
      if (window.history.length > 1) window.history.back();
      else navigate('dashboard');
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
    if (playersEl) playersEl.innerHTML = this._renderCards();

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
    if (footer) footer.textContent = `Updated ${this.lastUpdated.toLocaleTimeString()}`;
  }

  teardown(): void {
    if (this._pollInterval) { clearInterval(this._pollInterval); this._pollInterval = null; }
    if (this._dataChangedHandler) {
      window.removeEventListener('scorekeeper:datachanged', this._dataChangedHandler);
      this._dataChangedHandler = null;
    }
  }
}
