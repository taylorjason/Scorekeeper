import { db } from '../db';
import { computePlayerStats, computeLeaderboard, computeGameStats } from '../stats';
import type { Player, Game } from '../types';

export class Stats {
  private players: Player[] = [];
  private games: Game[] = [];
  private selectedPlayerId: number | null = null;
  private leaderboard: Awaited<ReturnType<typeof computeLeaderboard>> = [];
  private playerStats: Awaited<ReturnType<typeof computePlayerStats>> | null = null;

  async load(): Promise<void> {
    const [players, games, lb] = await Promise.all([
      db.players.toArray(),
      db.games.toArray(),
      computeLeaderboard(),
    ]);
    this.players = players.filter(p => p.active);
    this.games = games;
    this.leaderboard = lb;

    if (this.selectedPlayerId === null && this.players.length > 0) {
      this.selectedPlayerId = this.players[0].id!;
    }

    if (this.selectedPlayerId !== null) {
      this.playerStats = await computePlayerStats(this.selectedPlayerId);
    }
  }

  private escHtml(str: string): string {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  render(): string {
    const tabsHtml = this.players.map(p => `
      <button class="tab-btn ${this.selectedPlayerId === p.id ? 'active' : ''}"
        data-player-id="${p.id}" aria-selected="${this.selectedPlayerId === p.id}"
        aria-label="${this.escHtml(p.displayName)}">
        <span class="player-dot" style="background:${p.color}"></span>
        ${this.escHtml(p.displayName)}
      </button>
    `).join('');

    const stats = this.playerStats;
    let playerStatsHtml = '';

    if (stats && this.selectedPlayerId !== null) {
      const selectedPlayer = this.players.find(p => p.id === this.selectedPlayerId);

      playerStatsHtml = `
        <section class="card mb-4" aria-labelledby="player-stats-heading">
          <div class="card-header">
            <h2 class="card-title" id="player-stats-heading">
              ${selectedPlayer ? `<span class="player-dot" style="background:${selectedPlayer.color}; margin-right:6px"></span>` : ''}
              ${selectedPlayer ? this.escHtml(selectedPlayer.displayName) : 'Player'} Stats
            </h2>
          </div>
          <div class="stat-grid">
            <div class="stat-card">
              <div class="stat-value" style="color:var(--success)">${stats.wins}</div>
              <div class="stat-label">Wins</div>
            </div>
            <div class="stat-card">
              <div class="stat-value" style="color:var(--danger)">${stats.losses}</div>
              <div class="stat-label">Losses</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${stats.winRate}%</div>
              <div class="stat-label">Win Rate</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${stats.avgScore}</div>
              <div class="stat-label">Avg Score</div>
            </div>
          </div>
          <div class="text-sm text-muted" style="margin-top:0.25rem">${stats.gamesPlayed} matches played</div>
        </section>

        ${stats.gameBreakdown.length > 0 ? `
          <section class="card mb-4" aria-labelledby="wins-chart-heading">
            <h2 class="card-title mb-3" id="wins-chart-heading">Wins by Game</h2>
            <div class="chart-container">
              <canvas id="wins-bar-chart" aria-label="Bar chart of wins by game" role="img"></canvas>
            </div>
          </section>
        ` : ''}

        ${stats.scoreTrend.length > 1 ? `
          <section class="card mb-4" aria-labelledby="trend-chart-heading">
            <h2 class="card-title mb-3" id="trend-chart-heading">Score Trend (Last 10)</h2>
            <div class="chart-container">
              <canvas id="score-line-chart" aria-label="Line chart of score trend" role="img"></canvas>
            </div>
          </section>
        ` : ''}

        ${stats.gameBreakdown.length > 0 ? `
          <section class="card mb-4" aria-labelledby="breakdown-heading">
            <h2 class="card-title mb-3" id="breakdown-heading">Game Breakdown</h2>
            <table class="leaderboard" aria-label="Game breakdown for selected player">
              <thead>
                <tr>
                  <th>Game</th>
                  <th>Played</th>
                  <th>Wins</th>
                  <th>Avg Score</th>
                </tr>
              </thead>
              <tbody>
                ${stats.gameBreakdown.map(gb => `
                  <tr>
                    <td>${this.escHtml(gb.gameName)}</td>
                    <td>${gb.gamesPlayed}</td>
                    <td>${gb.wins}</td>
                    <td>${gb.avgScore}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </section>
        ` : `
          <div class="empty-state" style="padding:1.5rem 0">
            <div class="empty-state-icon">📊</div>
            <div class="empty-state-title">No stats yet</div>
            <p>Play some matches to see stats!</p>
          </div>
        `}
      `;
    }

    // Leaderboard
    const leaderboardHtml = this.leaderboard.length === 0
      ? `<div class="text-sm text-muted" style="padding:1rem 0">No games played yet</div>`
      : `
        <table class="leaderboard" aria-label="Overall leaderboard">
          <thead>
            <tr>
              <th>#</th>
              <th>Player</th>
              <th>Wins</th>
              <th>Played</th>
              <th>Win %</th>
            </tr>
          </thead>
          <tbody>
            ${this.leaderboard.map((entry, i) => `
              <tr class="${this.selectedPlayerId === entry.player.id ? 'highlighted-row' : ''}">
                <td>
                  ${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                </td>
                <td>
                  <div class="flex items-center gap-2">
                    <span class="player-dot" style="background:${entry.player.color}"></span>
                    <button class="btn btn-ghost btn-sm" style="padding:0; min-height:auto; font-size:0.9rem"
                      data-player-id="${entry.player.id}">${this.escHtml(entry.player.displayName)}</button>
                  </div>
                </td>
                <td><strong>${entry.wins}</strong></td>
                <td>${entry.gamesPlayed}</td>
                <td>${entry.winRate}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;

    // Game stats section
    const gameStatsHtml = this.games.length > 0 ? `
      <section class="card mb-4" aria-labelledby="game-stats-heading">
        <h2 class="card-title mb-3" id="game-stats-heading">Game Overview</h2>
        <div id="game-stats-list">
          ${this.games.map(g => `
            <div class="flex items-center gap-3 mb-2" style="padding: 0.5rem 0; border-bottom: 1px solid var(--border)">
              <div class="flex-1">
                <div class="font-semibold text-sm">${this.escHtml(g.name)}</div>
                <div class="text-xs text-muted">${g.scoringMode} scoring</div>
              </div>
              <span id="game-match-count-${g.id}" class="badge badge-muted text-xs">Loading...</span>
            </div>
          `).join('')}
        </div>
      </section>
    ` : '';

    return `
      <main class="view" aria-label="Statistics">
        <header class="page-header">
          <h1 class="page-title">Statistics</h1>
        </header>

        <section class="mb-4" aria-label="Player tabs">
          <div class="section-title mb-2">Select Player</div>
          <div class="tabs" role="tablist" aria-label="Player selection">
            ${tabsHtml}
          </div>
        </section>

        <div id="player-stats-section">
          ${playerStatsHtml}
        </div>

        <section class="card mb-4" aria-labelledby="leaderboard-heading">
          <h2 class="card-title mb-3" id="leaderboard-heading">Overall Leaderboard</h2>
          ${leaderboardHtml}
        </section>

        ${gameStatsHtml}
      </main>
    `;
  }

  async afterRender(): Promise<void> {
    // Render charts
    if (this.playerStats && this.playerStats.gameBreakdown.length > 0) {
      await this.renderWinsChart();
    }
    if (this.playerStats && this.playerStats.scoreTrend.length > 1) {
      await this.renderTrendChart();
    }

    // Load game stats
    for (const game of this.games) {
      this.loadGameStats(game);
    }

    // Player tab clicks
    document.querySelectorAll<HTMLButtonElement>('[data-player-id]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const pid = parseInt(btn.dataset['playerId'] ?? '', 10);
        if (isNaN(pid)) return;
        this.selectedPlayerId = pid;
        this.playerStats = await computePlayerStats(pid);
        this.reRender();
      });
    });
  }

  private async loadGameStats(game: Game): Promise<void> {
    try {
      const stats = await computeGameStats(game.id!);
      const el = document.getElementById(`game-match-count-${game.id}`);
      if (el) {
        el.textContent = `${stats.totalMatches} match${stats.totalMatches !== 1 ? 'es' : ''}`;
      }
    } catch {
      // ignore
    }
  }

  private async renderWinsChart(): Promise<void> {
    const canvas = document.getElementById('wins-bar-chart') as HTMLCanvasElement | null;
    if (!canvas || !this.playerStats) return;

    try {
      const { Chart, registerables } = await import('chart.js');
      Chart.register(...registerables);

      const labels = this.playerStats.gameBreakdown.map(gb => gb.gameName);
      const wins = this.playerStats.gameBreakdown.map(gb => gb.wins);
      const losses = this.playerStats.gameBreakdown.map(gb => gb.losses);

      const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
      const textColor = isDark ? '#94a3b8' : '#64748b';
      const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';

      new Chart(canvas, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: 'Wins',
              data: wins,
              backgroundColor: 'rgba(16, 185, 129, 0.7)',
              borderColor: '#10b981',
              borderWidth: 1,
              borderRadius: 6,
            },
            {
              label: 'Losses',
              data: losses,
              backgroundColor: 'rgba(239, 68, 68, 0.5)',
              borderColor: '#ef4444',
              borderWidth: 1,
              borderRadius: 6,
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              labels: { color: textColor, font: { size: 12 } }
            },
          },
          scales: {
            x: {
              ticks: { color: textColor },
              grid: { color: gridColor },
            },
            y: {
              beginAtZero: true,
              ticks: { color: textColor, stepSize: 1 },
              grid: { color: gridColor },
            }
          }
        }
      });
    } catch (err) {
      console.warn('Chart.js failed to load:', err);
    }
  }

  private async renderTrendChart(): Promise<void> {
    const canvas = document.getElementById('score-line-chart') as HTMLCanvasElement | null;
    if (!canvas || !this.playerStats) return;

    try {
      const { Chart, registerables } = await import('chart.js');
      Chart.register(...registerables);

      const trend = this.playerStats.scoreTrend;
      const labels = trend.map((_, i) => `Match ${i + 1}`);
      const scores = trend.map(t => t.total);

      const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
      const textColor = isDark ? '#94a3b8' : '#64748b';
      const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';

      new Chart(canvas, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: 'Score',
            data: scores,
            borderColor: '#6366f1',
            backgroundColor: 'rgba(99, 102, 241, 0.15)',
            borderWidth: 2,
            pointBackgroundColor: '#6366f1',
            pointRadius: 4,
            fill: true,
            tension: 0.3,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
          },
          scales: {
            x: {
              ticks: { color: textColor },
              grid: { color: gridColor },
            },
            y: {
              ticks: { color: textColor },
              grid: { color: gridColor },
            }
          }
        }
      });
    } catch (err) {
      console.warn('Chart.js failed to load:', err);
    }
  }

  private reRender(): void {
    const container = document.getElementById('view-container');
    if (!container) return;
    container.innerHTML = this.render();
    this.afterRender();
  }
}
