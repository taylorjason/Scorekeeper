import {
  getGameNights, getMatchesForNight, getScoreEntriesForMatch,
  deleteGameNight, db
} from '../db';
import { navigate } from '../router';
import { showToast } from '../toast';
import type { GameNight, Match, Player, Game } from '../types';

interface NightWithMatches {
  night: GameNight;
  matches: MatchDetails[];
}

interface MatchDetails {
  match: Match;
  game: Game | undefined;
  players: Player[];
  winner: Player | undefined;
  playerTotals: { player: Player; total: number }[];
}

export class History {
  private nights: NightWithMatches[] = [];
  private allPlayers: Player[] = [];
  private allGames: Game[] = [];
  private filterPlayerId: number | null = null;
  private filterGameId: number | null = null;

  async load(): Promise<void> {
    const [nights, players, games] = await Promise.all([
      getGameNights(),
      db.players.toArray(),
      db.games.toArray(),
    ]);
    this.allPlayers = players;
    this.allGames = games;

    this.nights = await Promise.all(
      nights.map(async (night) => {
        const matches = await getMatchesForNight(night.id!);
        const matchDetails = await Promise.all(
          matches.map(async (match) => {
            const game = games.find(g => g.id === match.gameId);
            const matchPlayers = match.playerIds
              .map(pid => players.find(p => p.id === pid))
              .filter((p): p is Player => p !== undefined);
            const winner = match.winnerId !== undefined
              ? players.find(p => p.id === match.winnerId)
              : undefined;

            const entries = await getScoreEntriesForMatch(match.id!);
            const playerTotals = matchPlayers.map(p => {
              const pEntries = entries.filter(e => e.playerId === p.id);
              const total = pEntries.reduce((s, e) => s + e.value, 0);
              return { player: p, total };
            });

            if (game?.scoringMode === 'low') {
              playerTotals.sort((a, b) => a.total - b.total);
            } else {
              playerTotals.sort((a, b) => b.total - a.total);
            }

            return { match, game, players: matchPlayers, winner, playerTotals };
          })
        );
        return { night, matches: matchDetails };
      })
    );
  }

  private escHtml(str: string): string {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  private formatDate(dateStr: string): string {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  }

  private getFilteredNights(): NightWithMatches[] {
    let result = this.nights;
    if (this.filterPlayerId !== null) {
      const pid = this.filterPlayerId;
      result = result.filter(n =>
        n.matches.some(m => m.match.playerIds.includes(pid))
      );
    }
    if (this.filterGameId !== null) {
      const gid = this.filterGameId;
      result = result.filter(n =>
        n.matches.some(m => m.match.gameId === gid)
      );
    }
    return result;
  }

  render(): string {
    const filtered = this.getFilteredNights();

    const playerFilterBtns = [
      `<button class="tab-btn ${this.filterPlayerId === null ? 'active' : ''}" data-player-filter="null">All Players</button>`,
      ...this.allPlayers.map(p =>
        `<button class="tab-btn ${this.filterPlayerId === p.id ? 'active' : ''}" data-player-filter="${p.id}">
          <span class="player-dot" style="background:${p.color}"></span>
          ${this.escHtml(p.displayName)}
        </button>`
      )
    ].join('');

    const gameFilterBtns = [
      `<button class="tab-btn ${this.filterGameId === null ? 'active' : ''}" data-game-filter="null">All Games</button>`,
      ...this.allGames.map(g =>
        `<button class="tab-btn ${this.filterGameId === g.id ? 'active' : ''}" data-game-filter="${g.id}">${this.escHtml(g.name)}</button>`
      )
    ].join('');

    let nightsHtml = '';
    if (filtered.length === 0) {
      nightsHtml = `
        <div class="empty-state">
          <div class="empty-state-icon">📅</div>
          <div class="empty-state-title">No game nights found</div>
          <p>${this.nights.length === 0 ? 'Start your first game night!' : 'No results for current filter.'}</p>
          ${this.nights.length === 0 ? `<button class="btn btn-primary mt-4" id="go-new-night">Start a Night</button>` : ''}
        </div>
      `;
    } else {
      nightsHtml = filtered.map(item => this.renderNightItem(item)).join('');
    }

    return `
      <main class="view" aria-label="History">
        <header class="page-header">
          <h1 class="page-title">History</h1>
          <p class="page-subtitle">${this.nights.length} game night${this.nights.length !== 1 ? 's' : ''} recorded</p>
        </header>

        <section class="mb-4" aria-label="Filters">
          <div class="section-title mb-2">Filter by Player</div>
          <div class="filter-bar" role="group" aria-label="Player filter">${playerFilterBtns}</div>
          <div class="section-title mb-2 mt-4">Filter by Game</div>
          <div class="filter-bar" role="group" aria-label="Game filter">${gameFilterBtns}</div>
        </section>

        <section aria-label="Game nights list" id="nights-list">
          ${nightsHtml}
        </section>
      </main>
    `;
  }

  private renderNightItem(item: NightWithMatches): string {
    const { night, matches } = item;
    const highlightId = sessionStorage.getItem('highlight-night');
    const isHighlighted = String(night.id) === highlightId;
    if (isHighlighted) sessionStorage.removeItem('highlight-night');

    const completedMatches = matches.filter(m => m.match.status === 'completed');
    const activeMatches = matches.filter(m => m.match.status === 'active');

    const meta = [
      `${matches.length} match${matches.length !== 1 ? 'es' : ''}`,
      completedMatches.length > 0 ? `${completedMatches.length} completed` : '',
      activeMatches.length > 0 ? `${activeMatches.length} active` : '',
    ].filter(Boolean).join(' · ');

    const matchesHtml = matches.map(md => this.renderMatchDetail(md)).join('');

    return `
      <div class="history-item ${isHighlighted ? 'highlighted' : ''}" id="night-${night.id}" data-night-id="${night.id}">
        <div class="history-header" role="button" aria-expanded="false" aria-controls="night-body-${night.id}" tabindex="0" aria-label="Toggle ${this.escHtml(night.title)}">
          <div>
            <div class="history-date">${this.formatDate(night.date)}</div>
            <div class="history-title">${this.escHtml(night.title)}</div>
            <div class="history-meta">${meta}</div>
          </div>
          <svg class="expand-icon" width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"
            style="flex-shrink:0; transition: transform 0.2s; color:var(--text-muted)">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
        <div class="history-body ${isHighlighted ? 'open' : ''}" id="night-body-${night.id}">
          ${night.notes ? `<p class="text-sm text-muted" style="padding: 0.5rem 0; font-style:italic">${this.escHtml(night.notes)}</p>` : ''}
          ${matchesHtml}
          <div style="padding-top:0.75rem; display:flex; justify-content:flex-end; gap:0.5rem; border-top: 1px solid var(--border); margin-top: 0.5rem">
            ${activeMatches.length > 0 ? `<button class="btn btn-primary btn-sm resume-btn" data-match-id="${activeMatches[0].match.id}">Resume Match</button>` : ''}
            <button class="btn btn-danger btn-sm delete-night-btn" data-night-id="${night.id}" aria-label="Delete ${this.escHtml(night.title)}">
              Delete Night
            </button>
          </div>
        </div>
      </div>
    `;
  }

  private renderMatchDetail(md: MatchDetails): string {
    const statusBadge = md.match.status === 'completed'
      ? '<span class="badge badge-success" style="font-size:0.7rem">Done</span>'
      : '<span class="badge badge-primary" style="font-size:0.7rem">Active</span>';

    const scoresHtml = md.playerTotals.map((pt, i) => `
      <div class="flex items-center gap-2" style="padding: 3px 0">
        ${i === 0 && md.match.status === 'completed' ? '🏆' : ''}
        <span class="player-dot" style="background:${pt.player.color}"></span>
        <span class="text-sm">${this.escHtml(pt.player.displayName)}</span>
        <span class="text-sm font-semibold" style="margin-left:auto">${pt.total}</span>
      </div>
    `).join('');

    return `
      <div class="match-result">
        <div class="match-result-title">
          ${md.game ? this.escHtml(md.game.name) : 'Unknown Game'}
          ${statusBadge}
          ${md.winner ? `<span class="winner-label">🏆 ${this.escHtml(md.winner.displayName)}</span>` : ''}
        </div>
        <div style="padding-left: 0.25rem">
          ${scoresHtml}
        </div>
      </div>
    `;
  }

  afterRender(): void {
    document.getElementById('go-new-night')?.addEventListener('click', () => {
      navigate('new-night');
    });

    // Player filter buttons
    document.querySelectorAll<HTMLButtonElement>('[data-player-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        const val = btn.dataset['playerFilter'];
        this.filterPlayerId = val === 'null' ? null : parseInt(val ?? '', 10);
        this.refreshList();
      });
    });

    // Game filter buttons
    document.querySelectorAll<HTMLButtonElement>('[data-game-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        const val = btn.dataset['gameFilter'];
        this.filterGameId = val === 'null' ? null : parseInt(val ?? '', 10);
        this.refreshList();
      });
    });

    // Toggle expand
    document.querySelectorAll('.history-header').forEach(header => {
      const toggle = () => {
        const nightId = (header.closest('.history-item') as HTMLElement)?.dataset['nightId'];
        const body = document.getElementById(`night-body-${nightId}`);
        const icon = header.querySelector('.expand-icon') as SVGElement;
        if (!body) return;
        const isOpen = body.classList.contains('open');
        body.classList.toggle('open', !isOpen);
        if (icon) icon.style.transform = !isOpen ? 'rotate(180deg)' : '';
        header.setAttribute('aria-expanded', String(!isOpen));
      };
      header.addEventListener('click', toggle);
      header.addEventListener('keydown', (e) => {
        if ((e as KeyboardEvent).key === 'Enter' || (e as KeyboardEvent).key === ' ') {
          e.preventDefault();
          toggle();
        }
      });
    });

    // Delete night buttons
    document.querySelectorAll('.delete-night-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const nightId = parseInt((e.currentTarget as HTMLElement).dataset['nightId'] ?? '', 10);
        const night = this.nights.find(n => n.night.id === nightId);
        if (!night) return;

        if (!confirm(`Delete "${night.night.title}" and all its matches? This cannot be undone.`)) return;

        try {
          await deleteGameNight(nightId);
          this.nights = this.nights.filter(n => n.night.id !== nightId);
          this.refreshList();
          showToast('Game night deleted', 'info');
        } catch (err) {
          console.error(err);
          showToast('Failed to delete game night', 'error');
        }
      });
    });

    // Resume match buttons
    document.querySelectorAll('.resume-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const matchId = (e.currentTarget as HTMLElement).dataset['matchId'];
        if (matchId) navigate('match', { id: matchId });
      });
    });
  }

  private refreshList(): void {
    const list = document.getElementById('nights-list');
    if (!list) return;
    const filtered = this.getFilteredNights();
    if (filtered.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📅</div>
          <div class="empty-state-title">No results</div>
          <p>Try removing a filter.</p>
        </div>
      `;
    } else {
      list.innerHTML = filtered.map(item => this.renderNightItem(item)).join('');
      this.afterRender();
    }

    // Update filter button active states
    document.querySelectorAll<HTMLButtonElement>('[data-player-filter]').forEach(btn => {
      const val = btn.dataset['playerFilter'];
      btn.classList.toggle('active', val === 'null' ? this.filterPlayerId === null : parseInt(val ?? '', 10) === this.filterPlayerId);
    });
    document.querySelectorAll<HTMLButtonElement>('[data-game-filter]').forEach(btn => {
      const val = btn.dataset['gameFilter'];
      btn.classList.toggle('active', val === 'null' ? this.filterGameId === null : parseInt(val ?? '', 10) === this.filterGameId);
    });
  }
}
