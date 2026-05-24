import { getMatch, getScoreEntriesForMatch, db } from '../db';
import { navigate } from '../router';
import { getRoomConfig, initFirebaseSync } from '../firebase-sync';
import type { Match, Game } from '../types';

export class RoundDisplay {
  private matchId = 0;
  private match: Match | null = null;
  private game: Game | null = null;
  private maxRound = 0;
  private lastUpdated = new Date();

  private _pollInterval: ReturnType<typeof setInterval> | null = null;

  async load(matchId: number): Promise<void> {
    this.matchId = matchId;
    await this._fetchData();
  }

  private async _fetchData(): Promise<void> {
    this.match = (await getMatch(this.matchId)) ?? null;
    if (!this.match) return;
    const [game, entries] = await Promise.all([
      db.games.get(this.match.gameId),
      getScoreEntriesForMatch(this.matchId),
    ]);
    this.game = game ?? null;
    this.maxRound = entries.length > 0 ? Math.max(...entries.map(e => e.roundNumber)) : 0;
    this.lastUpdated = new Date();
  }

  private _roundLabel(roundNumber: number): string {
    const labels = this.game?.roundLabels;
    if (labels && labels.length >= roundNumber) return labels[roundNumber - 1];
    return `Round ${roundNumber}`;
  }

  private _getDisplay(): { headline: string; subline: string } {
    const isPhase10 = this.game?.scoringMode === 'phase10';
    const currentRound = this.maxRound + 1;

    if (isPhase10) {
      if (this.maxRound === 0) return { headline: 'Hand 1', subline: 'Game starting' };
      return {
        headline: `${this.maxRound} Hand${this.maxRound !== 1 ? 's' : ''} Played`,
        subline: `Hand ${currentRound} up next`,
      };
    }

    return {
      headline: this._roundLabel(currentRound),
      subline: this.game?.name ?? '',
    };
  }

  private _esc(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  render(): string {
    if (!this.match || !this.game) {
      return `<div class="rd-screen"><p class="rd-error">Match not found</p></div>`;
    }

    const isCompleted = this.match.status === 'completed';
    const { headline, subline } = this._getDisplay();

    return `
      <div class="rd-screen">
        <button class="rd-close" id="rd-close" aria-label="Close">✕</button>
        <div class="rd-inner">
          <div class="rd-game-name">${this._esc(this.game.name)}</div>
          <div class="rd-headline" id="rd-headline">
            ${isCompleted ? 'Game Over' : this._esc(headline)}
          </div>
          ${subline && !isCompleted ? `<div class="rd-subline" id="rd-subline">${this._esc(subline)}</div>` : ''}
          <div class="rd-updated" id="rd-updated">Updated ${this.lastUpdated.toLocaleTimeString()}</div>
        </div>
      </div>`;
  }

  afterRender(): void {
    document.getElementById('rd-close')?.addEventListener('click', () => {
      if (window.history.length > 1) window.history.back();
      else navigate('dashboard');
    });

    this._pollInterval = setInterval(() => {
      this._fetchData().then(() => this._patch()).catch(() => {});
    }, 5000);

    const roomConfig = getRoomConfig();
    if (roomConfig) {
      initFirebaseSync(roomConfig, () => {
        this._fetchData().then(() => this._patch()).catch(() => {});
      }).catch(() => {});
    }
  }

  private _patch(): void {
    const { headline, subline } = this._getDisplay();
    const headlineEl = document.getElementById('rd-headline');
    if (headlineEl) headlineEl.textContent = headline;
    const sublineEl = document.getElementById('rd-subline');
    if (sublineEl) sublineEl.textContent = subline;
    const updEl = document.getElementById('rd-updated');
    if (updEl) updEl.textContent = `Updated ${this.lastUpdated.toLocaleTimeString()}`;
  }

  teardown(): void {
    if (this._pollInterval) { clearInterval(this._pollInterval); this._pollInterval = null; }
  }
}
