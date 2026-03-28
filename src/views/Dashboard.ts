import { getGameNights, getActiveMatch } from '../db';
import { computeLeaderboard } from '../stats';
import { navigate } from '../router';
import type { GameNight, Match } from '../types';

export class Dashboard {
  private gameNights: GameNight[] = [];
  private leaderboard: Awaited<ReturnType<typeof computeLeaderboard>> = [];
  private activeMatch: Match | undefined;

  async load(): Promise<void> {
    const [nights, lb, active] = await Promise.all([
      getGameNights(),
      computeLeaderboard(),
      getActiveMatch(),
    ]);
    this.gameNights = nights.slice(0, 3);
    this.leaderboard = lb.slice(0, 5);
    this.activeMatch = active;
  }

  private formatDate(dateStr: string): string {
    const d = new Date(dateStr + 'T00:00:00');
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    if (diff < 7) return `${diff} days ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: diff > 365 ? 'numeric' : undefined });
  }

  private rankIcon(rank: number): string {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `<span class="rank-number">${rank}</span>`;
  }

  render(): string {
    const today = new Date().toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric'
    });

    let activeMatchHtml = '';
    if (this.activeMatch) {
      activeMatchHtml = `
        <div class="card card-clickable mb-4" id="active-match-banner" role="button"
          aria-label="Resume active match" data-match-id="${this.activeMatch.id}">
          <div class="flex items-center gap-3">
            <span style="font-size:1.5rem">🎮</span>
            <div>
              <div class="font-semibold">Active Match in Progress</div>
              <div class="text-sm text-muted">Tap to resume scoring</div>
            </div>
            <span style="margin-left:auto; color:var(--primary)">›</span>
          </div>
        </div>
      `;
    }

    let recentNightsHtml = '';
    if (this.gameNights.length === 0) {
      recentNightsHtml = `
        <div class="empty-state" style="padding: 1.5rem 0">
          <div class="empty-state-icon">🎲</div>
          <div class="empty-state-title">No game nights yet</div>
          <p>Start your first game night!</p>
        </div>
      `;
    } else {
      recentNightsHtml = this.gameNights.map(night => `
        <div class="card card-clickable mb-3 night-card" data-night-id="${night.id}" role="button" aria-label="Open ${night.title}">
          <div class="flex items-center gap-3">
            <div>
              <div class="history-date">${this.formatDate(night.date)}</div>
              <div class="font-semibold">${this.escHtml(night.title)}</div>
            </div>
            <span style="margin-left:auto; color:var(--text-muted)">›</span>
          </div>
        </div>
      `).join('');
    }

    let leaderboardHtml = '';
    if (this.leaderboard.length === 0) {
      leaderboardHtml = `<div class="text-sm text-muted" style="padding: 0.5rem 0">No stats yet — play some games!</div>`;
    } else {
      leaderboardHtml = `
        <table class="leaderboard" aria-label="Player leaderboard">
          <thead>
            <tr>
              <th>#</th>
              <th>Player</th>
              <th>Wins</th>
              <th>Win %</th>
            </tr>
          </thead>
          <tbody>
            ${this.leaderboard.map((entry, i) => `
              <tr>
                <td>${this.rankIcon(i + 1)}</td>
                <td>
                  <div class="flex items-center gap-2">
                    <span class="player-dot" style="background:${entry.player.color}"></span>
                    ${this.escHtml(entry.player.displayName)}
                  </div>
                </td>
                <td><strong>${entry.wins}</strong></td>
                <td>${entry.winRate}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }

    return `
      <main class="view" id="dashboard-view" aria-label="Dashboard">
        <header class="page-header">
          <h1 class="page-title">🎲 Scorekeeper</h1>
          <p class="page-subtitle">${today}</p>
        </header>

        ${activeMatchHtml}

        <section aria-labelledby="recent-nights-heading">
          <div class="flex items-center justify-between mb-3">
            <h2 class="section-title" id="recent-nights-heading">Recent Nights</h2>
            <button class="btn btn-ghost btn-sm" id="view-all-history" aria-label="View all history">View all</button>
          </div>
          ${recentNightsHtml}
        </section>

        <section aria-labelledby="leaderboard-heading" class="mt-4">
          <div class="flex items-center justify-between mb-3">
            <h2 class="section-title" id="leaderboard-heading">Leaderboard</h2>
            <button class="btn btn-ghost btn-sm" id="view-stats" aria-label="View full stats">Stats</button>
          </div>
          <div class="card">
            ${leaderboardHtml}
          </div>
        </section>
      </main>

      <button class="fab" id="new-night-fab" aria-label="Start new game night" title="New Game Night">+</button>
    `;
  }

  afterRender(): void {
    document.getElementById('new-night-fab')?.addEventListener('click', () => {
      navigate('new-night');
    });

    document.getElementById('view-all-history')?.addEventListener('click', () => {
      navigate('history');
    });

    document.getElementById('view-stats')?.addEventListener('click', () => {
      navigate('stats');
    });

    document.getElementById('active-match-banner')?.addEventListener('click', (e) => {
      const el = (e.currentTarget as HTMLElement);
      const matchId = el.dataset['matchId'];
      if (matchId) navigate('match', { id: matchId });
    });

    document.querySelectorAll('.night-card').forEach(card => {
      card.addEventListener('click', (e) => {
        const el = (e.currentTarget as HTMLElement);
        const nightId = el.dataset['nightId'];
        if (!nightId) return;
        // Navigate to history with this night highlighted
        navigate('history');
        // After navigate, scroll to night - done in History view
        sessionStorage.setItem('highlight-night', nightId);
      });
    });
  }

  private escHtml(str: string): string {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
}
