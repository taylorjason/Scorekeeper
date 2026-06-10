import { db } from '../db';
import { computePlayerStats, computeLeaderboard, computeGameStats } from '../stats';
import { escHtml, formatDuration } from '../utils';
import {
  buildFactTable, runQuery, dateFromPreset, fieldLabel,
  loadFieldConfig, getActiveFields, newConditionId,
  OPERATOR_LABELS,
} from '../query-engine';
import type {
  StatRow, StatQuery, StatResult, FieldKey, GroupKey, MetricFn,
  ActiveCondition, CompiledField, FieldConfig,
} from '../query-engine';
import {
  loadCustomStats, saveCustomStats, loadApiKey, saveApiKey,
  generateStatCode, evalCustomStat,
} from '../custom-stats';
import type { CustomStat, CustomStatResult } from '../custom-stats';
import { showToast } from '../toast';
import type { Chart as ChartType } from 'chart.js';
import type { Player, Game } from '../types';

const QUICK_INSIGHTS: Array<{ id: string; label: string; query: StatQuery }> = [
  { id: 'first-out', label: '⚡ First-Out Leaders',
    query: { metric: 'count', field: 'isFirstOut', groupBy: 'player', conditions: [] } },
  { id: 'fastest',   label: '⏱ Fastest Rounds',
    query: { metric: 'min', field: 'roundDuration', groupBy: 'game', conditions: [] } },
  { id: 'avg-score', label: '📊 Avg Round Score',
    query: { metric: 'avg', field: 'value', groupBy: 'player', conditions: [] } },
  { id: 'wins',      label: '🏆 Win Leaders',
    query: { metric: 'count', field: 'isWin', groupBy: 'player', conditions: [] } },
  { id: 'monthly',   label: '📅 Last 3 Months',
    query: { metric: 'count', field: 'isWin', groupBy: 'month',
      conditions: [{ id: 'qi-date', fieldKey: 'nightDate', operator: 'gte', value: dateFromPreset('3mo') }] } },
];

export class Stats {
  private players: Player[] = [];
  private games: Game[] = [];
  private selectedPlayerId: number | null = null;
  private leaderboard: Awaited<ReturnType<typeof computeLeaderboard>> = [];
  private playerStats: Awaited<ReturnType<typeof computePlayerStats>> | null = null;

  private activeMainTab: 'overview' | 'explorer' | 'custom' = 'overview';
  private factTable: StatRow[] = [];
  private currentQuery: StatQuery = { ...QUICK_INSIGHTS[0].query, conditions: [] };
  private queryResults: StatResult[] | null = null;
  private fieldConfig: FieldConfig = loadFieldConfig();
  private activeFieldDefs: CompiledField[] = [];

  private _winsChart: ChartType | null = null;
  private _trendChart: ChartType | null = null;
  private _explorerChart: ChartType | null = null;

  private customStats: CustomStat[] = [];
  private customApiKey: string = '';
  private _evaluatedStats: Map<string, CustomStatResult> = new Map();
  private _customGenerating: boolean = false;

  async load(): Promise<void> {
    const [players, games, lb, factTable] = await Promise.all([
      db.players.toArray(),
      db.games.toArray(),
      computeLeaderboard(),
      buildFactTable(),
    ]);
    this.players = players.filter(p => p.active);
    this.games = games;
    this.leaderboard = lb;
    this.factTable = factTable;
    this.fieldConfig = loadFieldConfig();
    this.activeFieldDefs = getActiveFields(this.fieldConfig);

    if (this.selectedPlayerId === null && this.players.length > 0) {
      this.selectedPlayerId = this.players[0].id!;
    }
    if (this.selectedPlayerId !== null) {
      this.playerStats = await computePlayerStats(this.selectedPlayerId);
    }

    this.customStats = loadCustomStats();
    this.customApiKey = loadApiKey();
    this._evaluatedStats.clear();
    for (const stat of this.customStats) {
      this._evaluatedStats.set(stat.id, evalCustomStat(stat.code, this.factTable));
    }
  }

  render(): string {
    const overviewContent = this._renderOverview();

    return `
      <main class="view" aria-label="Statistics">
        <header class="page-header">
          <h1 class="page-title">Statistics</h1>
        </header>

        <div class="stats-main-tabs" role="tablist" aria-label="Stats sections">
          <button class="stats-main-tab-btn ${this.activeMainTab === 'overview' ? 'active' : ''}"
            id="stats-tab-overview" role="tab" aria-selected="${this.activeMainTab === 'overview'}"
            aria-controls="stats-panel-overview">Overview</button>
          <button class="stats-main-tab-btn ${this.activeMainTab === 'explorer' ? 'active' : ''}"
            id="stats-tab-explorer" role="tab" aria-selected="${this.activeMainTab === 'explorer'}"
            aria-controls="stats-panel-explorer">Explorer</button>
          <button class="stats-main-tab-btn ${this.activeMainTab === 'custom' ? 'active' : ''}"
            id="stats-tab-custom" role="tab" aria-selected="${this.activeMainTab === 'custom'}"
            aria-controls="stats-panel-custom">✨ Custom</button>
        </div>

        <div id="stats-panel-overview" role="tabpanel" aria-labelledby="stats-tab-overview"
          ${this.activeMainTab !== 'overview' ? 'hidden' : ''}>
          ${overviewContent}
        </div>

        <div id="stats-panel-explorer" role="tabpanel" aria-labelledby="stats-tab-explorer"
          ${this.activeMainTab !== 'explorer' ? 'hidden' : ''}>
          ${this.activeMainTab === 'explorer' ? this._renderExplorerTab() : ''}
        </div>

        <div id="stats-panel-custom" role="tabpanel" aria-labelledby="stats-tab-custom"
          ${this.activeMainTab !== 'custom' ? 'hidden' : ''}>
          ${this.activeMainTab === 'custom' ? this._renderCustomTab() : ''}
        </div>
      </main>
    `;
  }

  private _renderOverview(): string {
    const tabsHtml = this.players.map(p => `
      <button class="tab-btn ${this.selectedPlayerId === p.id ? 'active' : ''}"
        data-player-id="${p.id}" aria-selected="${this.selectedPlayerId === p.id}"
        aria-label="${escHtml(p.displayName)}">
        <span class="player-dot" style="background:${p.color}"></span>
        ${escHtml(p.displayName)}
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
              ${selectedPlayer ? escHtml(selectedPlayer.displayName) : 'Player'} Stats
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
                <tr><th>Game</th><th>Played</th><th>Wins</th><th>Avg Score</th></tr>
              </thead>
              <tbody>
                ${stats.gameBreakdown.map(gb => `
                  <tr>
                    <td>${escHtml(gb.gameName)}</td>
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

    const leaderboardHtml = this.leaderboard.length === 0
      ? `<div class="text-sm text-muted" style="padding:1rem 0">No games played yet</div>`
      : `
        <table class="leaderboard" aria-label="Overall leaderboard">
          <thead>
            <tr><th>#</th><th>Player</th><th>Wins</th><th>Played</th><th>Win %</th></tr>
          </thead>
          <tbody>
            ${this.leaderboard.map((entry, i) => `
              <tr class="${this.selectedPlayerId === entry.player.id ? 'highlighted-row' : ''}">
                <td>${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</td>
                <td>
                  <div class="flex items-center gap-2">
                    <span class="player-dot" style="background:${entry.player.color}"></span>
                    <button class="btn btn-ghost btn-sm" style="padding:0; min-height:auto; font-size:0.9rem"
                      data-player-id="${entry.player.id}">${escHtml(entry.player.displayName)}</button>
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

    const gameStatsHtml = this.games.length > 0 ? `
      <section class="card mb-4" aria-labelledby="game-stats-heading">
        <h2 class="card-title mb-3" id="game-stats-heading">Game Overview</h2>
        <div id="game-stats-list">
          ${this.games.map(g => `
            <div class="flex items-center gap-3 mb-2" style="padding: 0.5rem 0; border-bottom: 1px solid var(--border)">
              <div class="flex-1">
                <div class="font-semibold text-sm">${escHtml(g.name)}</div>
                <div class="text-xs text-muted">${g.scoringMode} scoring</div>
              </div>
              <span id="game-match-count-${g.id}" class="badge badge-muted text-xs">Loading...</span>
            </div>
          `).join('')}
        </div>
      </section>
    ` : '';

    return `
      <section class="mb-4" aria-label="Player tabs">
        <div class="section-title mb-2">Select Player</div>
        <div class="tabs" role="tablist" aria-label="Player selection">
          ${tabsHtml}
        </div>
      </section>

      <div id="player-stats-section">${playerStatsHtml}</div>

      <section class="card mb-4" aria-labelledby="leaderboard-heading">
        <h2 class="card-title mb-3" id="leaderboard-heading">Overall Leaderboard</h2>
        ${leaderboardHtml}
      </section>

      ${gameStatsHtml}
    `;
  }

  private _renderExplorerTab(): string {
    const q = this.currentQuery;

    const insightsHtml = QUICK_INSIGHTS.map(ins =>
      `<button class="quick-insight-btn" data-insight="${ins.id}">${ins.label}</button>`
    ).join('');

    const conditionsHtml = q.conditions.map(c => this._renderConditionRow(c)).join('');

    const fieldOpts = [
      { value: 'value',         label: 'Round Score' },
      { value: 'roundDuration', label: 'Round Duration' },
      { value: 'isFirstOut',    label: 'First-Out Events' },
      { value: 'isWin',         label: 'Wins' },
    ].map(o => `<option value="${o.value}" ${q.field === o.value ? 'selected' : ''}>${o.label}</option>`).join('');

    const metricOpts = [
      { value: 'count', label: 'Count' },
      { value: 'avg',   label: 'Average' },
      { value: 'sum',   label: 'Total' },
      { value: 'min',   label: 'Minimum' },
      { value: 'max',   label: 'Maximum' },
    ].map(o => `<option value="${o.value}" ${q.metric === o.value ? 'selected' : ''}>${o.label}</option>`).join('');

    const groupOpts = [
      { value: 'none',      label: 'None (single value)' },
      { value: 'player',    label: 'By Player' },
      { value: 'game',      label: 'By Game' },
      { value: 'month',     label: 'By Month' },
      { value: 'dayOfWeek', label: 'By Day of Week' },
    ].map(o => `<option value="${o.value}" ${q.groupBy === o.value ? 'selected' : ''}>${o.label}</option>`).join('');

    const noFields = this.activeFieldDefs.length === 0;

    return `
      <div class="explorer-wrap">
        <section class="mb-4" aria-label="Quick insights">
          <div class="section-title mb-2">Quick Insights</div>
          <div class="quick-insights-row" role="group" aria-label="Quick insight shortcuts">
            ${insightsHtml}
          </div>
        </section>

        <section class="query-builder card mb-4" aria-label="Query builder">
          <div class="card-header">
            <h2 class="card-title">Build a Query</h2>
          </div>

          <div class="qb-section-label">Filters</div>
          <div id="conditions-list">
            ${conditionsHtml}
          </div>
          <button class="btn btn-secondary btn-sm mt-2" id="add-condition-btn" ${noFields ? 'disabled' : ''}>
            + Add Condition
          </button>
          ${noFields ? `<p class="text-sm text-muted mt-1">Enable filter fields in Settings → Stats Fields.</p>` : ''}

          <div class="qb-divider"></div>

          <div class="qb-section-label">Measure</div>
          <div class="qb-row">
            <select class="form-select qb-select" id="qb-metric">${metricOpts}</select>
            <span class="qb-of">of</span>
            <select class="form-select qb-select" id="qb-field">${fieldOpts}</select>
          </div>

          <div class="qb-section-label" style="margin-top:0.75rem">Group by</div>
          <div class="qb-row">
            <select class="form-select qb-select" id="qb-groupby" style="max-width:220px">${groupOpts}</select>
          </div>

          <button class="btn btn-primary mt-3 btn-full" id="qb-run-btn">▶ Run Query</button>
        </section>

        <div id="explorer-results">${this._renderQueryResults()}</div>
      </div>
    `;
  }

  private _renderConditionRow(cond: ActiveCondition): string {
    const fields = this.activeFieldDefs;
    const def = fields.find(f => f.key === cond.fieldKey) ?? fields[0];
    if (!def) return '';

    const fieldSel = `<select class="cond-field form-select" data-cid="${cond.id}" aria-label="Filter field">
      ${fields.map(f => `<option value="${escHtml(f.key)}" ${f.key === cond.fieldKey ? 'selected' : ''}>${escHtml(f.label)}</option>`).join('')}
    </select>`;

    const opSel = `<select class="cond-op form-select" data-cid="${cond.id}" aria-label="Operator">
      ${def.operators.map(op => `<option value="${op}" ${op === cond.operator ? 'selected' : ''}>${OPERATOR_LABELS[op]}</option>`).join('')}
    </select>`;

    const valHtml = this._renderValuePicker(cond, def);

    return `<div class="condition-row" data-cid="${cond.id}">
      ${fieldSel}${opSel}${valHtml}
      <button class="cond-remove btn btn-icon btn-sm" data-cid="${cond.id}" aria-label="Remove condition" title="Remove">×</button>
    </div>`;
  }

  private _renderValuePicker(cond: ActiveCondition, def: CompiledField): string {
    const val = String(cond.value ?? '');
    const cid = `data-cid="${cond.id}"`;

    if (def.type === 'boolean') {
      return `<select class="cond-val form-select" ${cid} aria-label="Value">
        <option value="true"  ${val === 'true'  ? 'selected' : ''}>Yes</option>
        <option value="false" ${val === 'false' ? 'selected' : ''}>No</option>
      </select>`;
    }

    if (def.type === 'player-set') {
      return `<select class="cond-val form-select" ${cid} aria-label="Player">
        ${this.players.map(p =>
          `<option value="${p.id}" ${val === String(p.id) ? 'selected' : ''}>${escHtml(p.displayName)}</option>`
        ).join('')}
      </select>`;
    }

    if (def.key === 'gameId' || (def.type === 'enum' && !def.options)) {
      return `<select class="cond-val form-select" ${cid} aria-label="Game">
        ${this.games.map(g =>
          `<option value="${g.id}" ${val === String(g.id) ? 'selected' : ''}>${escHtml(g.name)}</option>`
        ).join('')}
      </select>`;
    }

    if (def.key === 'playerId') {
      return `<select class="cond-val form-select" ${cid} aria-label="Player">
        ${this.players.map(p =>
          `<option value="${p.id}" ${val === String(p.id) ? 'selected' : ''}>${escHtml(p.displayName)}</option>`
        ).join('')}
      </select>`;
    }

    if (def.type === 'enum' && def.options) {
      return `<select class="cond-val form-select" ${cid} aria-label="Value">
        ${def.options.map(o =>
          `<option value="${o.value}" ${val === String(o.value) ? 'selected' : ''}>${escHtml(o.label)}</option>`
        ).join('')}
      </select>`;
    }

    if (def.type === 'date') {
      return `<input type="date" class="cond-val form-input cond-val-date" ${cid} value="${escHtml(val)}" aria-label="Date">`;
    }

    // number (default)
    return `<input type="number" class="cond-val form-input cond-val-num" ${cid} value="${escHtml(val)}" aria-label="Value">`;
  }

  private _renderQueryResults(): string {
    if (this.queryResults === null) {
      return `<div class="explorer-empty">Pick an insight above or configure a query and click Run.</div>`;
    }
    if (this.queryResults.length === 0) {
      return `<div class="explorer-empty">No data for these filters — try broadening the date range or removing filters.</div>`;
    }

    const q = this.currentQuery;
    const isDuration = q.field === 'roundDuration';
    const title = fieldLabel(q.field, q.metric);
    const fmt = (v: number) => isDuration ? formatDuration(v) : String(v);

    if (q.groupBy === 'none') {
      const r = this.queryResults[0];
      return `
        <section class="card" aria-label="Query result">
          <div class="card-header"><h2 class="card-title">${escHtml(title)}</h2></div>
          <div class="stat-big-number">${fmt(r.value)}</div>
          <div class="text-sm text-muted" style="text-align:center">${r.sampleSize} data point${r.sampleSize !== 1 ? 's' : ''}</div>
        </section>
      `;
    }

    const rowsHtml = this.queryResults.map((r, i) => `
      <tr>
        <td class="result-table-rank">${i + 1}</td>
        <td>
          ${r.color ? `<span class="player-dot" style="background:${r.color}"></span> ` : ''}
          ${escHtml(r.label)}
        </td>
        <td class="result-table-val"><strong>${fmt(r.value)}</strong></td>
        <td class="result-table-n text-muted">${r.sampleSize}</td>
      </tr>
    `).join('');

    const chartHeight = Math.max(180, this.queryResults.length * 36 + 48);
    const groupLabel = q.groupBy === 'player' ? 'Player' : q.groupBy === 'game' ? 'Game' : 'Month';

    return `
      <section class="card" aria-label="Query results">
        <div class="card-header"><h2 class="card-title">${escHtml(title)}</h2></div>
        <div class="chart-container" style="height:${chartHeight}px">
          <canvas id="explorer-chart" aria-label="${escHtml(title)} chart" role="img"></canvas>
        </div>
        <table class="result-table" aria-label="${escHtml(title)} data table">
          <thead>
            <tr><th>#</th><th>${groupLabel}</th><th>Value</th><th title="Sample size">n</th></tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </section>
    `;
  }

  async afterRender(): Promise<void> {
    document.getElementById('stats-tab-overview')?.addEventListener('click', () => {
      if (this.activeMainTab !== 'overview') { this.activeMainTab = 'overview'; this.reRender(); }
    });
    document.getElementById('stats-tab-explorer')?.addEventListener('click', () => {
      if (this.activeMainTab !== 'explorer') { this.activeMainTab = 'explorer'; this.reRender(); }
    });
    document.getElementById('stats-tab-custom')?.addEventListener('click', () => {
      if (this.activeMainTab !== 'custom') { this.activeMainTab = 'custom'; this.reRender(); }
    });

    if (this.activeMainTab === 'overview') {
      if (this.playerStats?.gameBreakdown.length) await this.renderWinsChart();
      if (this.playerStats && this.playerStats.scoreTrend.length > 1) await this.renderTrendChart();
      for (const game of this.games) this.loadGameStats(game);

      document.querySelectorAll<HTMLButtonElement>('[data-player-id]').forEach(btn => {
        btn.addEventListener('click', async () => {
          const pid = parseInt(btn.dataset['playerId'] ?? '', 10);
          if (isNaN(pid)) return;
          this.selectedPlayerId = pid;
          this.playerStats = await computePlayerStats(pid);
          this.reRender();
        });
      });
    } else if (this.activeMainTab === 'explorer') {
      this.activeFieldDefs = getActiveFields(this.fieldConfig);
      this._bindExplorer();
      if (this.queryResults?.length && this.currentQuery.groupBy !== 'none') {
        await this.renderExplorerChart();
      }
    } else if (this.activeMainTab === 'custom') {
      this._bindCustomTab();
    }
  }

  private _bindExplorer(): void {
    // Quick insights
    document.querySelectorAll<HTMLButtonElement>('.quick-insight-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const ins = QUICK_INSIGHTS.find(i => i.id === btn.dataset['insight']);
        if (!ins) return;
        // Deep-clone so quick insights don't share condition arrays
        this.currentQuery = { ...ins.query, conditions: ins.query.conditions.map(c => ({ ...c })) };
        this.queryResults = runQuery(this.factTable, this.currentQuery, this.activeFieldDefs);
        this.reRender();
      });
    });

    // Add condition
    document.getElementById('add-condition-btn')?.addEventListener('click', () => {
      const first = this.activeFieldDefs[0];
      if (!first) return;
      this.currentQuery.conditions.push({
        id: newConditionId(),
        fieldKey: first.key,
        operator: first.operators[0],
        value: first.type === 'boolean' ? 'true'
             : first.options ? String(first.options[0]?.value ?? '')
             : first.type === 'player-set' ? String(this.players[0]?.id ?? '')
             : '',
      });
      this._reRenderExplorer();
    });

    // Field selector changed → reset operator + value, re-render condition list
    document.querySelectorAll<HTMLSelectElement>('.cond-field').forEach(sel => {
      sel.addEventListener('change', () => {
        const cid = sel.dataset['cid']!;
        const cond = this.currentQuery.conditions.find(c => c.id === cid);
        if (!cond) return;
        const newDef = this.activeFieldDefs.find(f => f.key === sel.value);
        if (!newDef) return;
        cond.fieldKey = sel.value;
        cond.operator = newDef.operators[0];
        cond.value = newDef.type === 'boolean' ? 'true'
                   : newDef.options ? String(newDef.options[0]?.value ?? '')
                   : newDef.type === 'player-set' ? String(this.players[0]?.id ?? '')
                   : '';
        this._reRenderExplorer();
      });
    });

    // Operator changed → may change value picker shape
    document.querySelectorAll<HTMLSelectElement>('.cond-op').forEach(sel => {
      sel.addEventListener('change', () => {
        const cid = sel.dataset['cid']!;
        const cond = this.currentQuery.conditions.find(c => c.id === cid);
        if (!cond) return;
        cond.operator = sel.value as import('../query-engine').OperatorKey;
        this._reRenderExplorer();
      });
    });

    // Value changed → update state (no re-render)
    document.querySelectorAll<HTMLElement>('.cond-val').forEach(el => {
      el.addEventListener('change', () => {
        const cid = (el as HTMLElement & { dataset: DOMStringMap }).dataset['cid']!;
        const cond = this.currentQuery.conditions.find(c => c.id === cid);
        if (!cond) return;
        cond.value = (el as HTMLInputElement | HTMLSelectElement).value;
      });
    });

    // Remove condition
    document.querySelectorAll<HTMLButtonElement>('.cond-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        const cid = btn.dataset['cid']!;
        this.currentQuery.conditions = this.currentQuery.conditions.filter(c => c.id !== cid);
        this._reRenderExplorer();
      });
    });

    // Run
    document.getElementById('qb-run-btn')?.addEventListener('click', () => {
      this._readFormAndRun();
    });
  }

  private _readFormAndRun(): void {
    // Flush any pending value inputs
    document.querySelectorAll<HTMLElement>('.cond-val').forEach(el => {
      const cid = (el as HTMLElement & { dataset: DOMStringMap }).dataset['cid']!;
      const cond = this.currentQuery.conditions.find(c => c.id === cid);
      if (cond) cond.value = (el as HTMLInputElement | HTMLSelectElement).value;
    });

    this.currentQuery.metric  = ((document.getElementById('qb-metric')  as HTMLSelectElement)?.value ?? 'count') as MetricFn;
    this.currentQuery.field   = ((document.getElementById('qb-field')   as HTMLSelectElement)?.value ?? 'value') as FieldKey;
    this.currentQuery.groupBy = ((document.getElementById('qb-groupby') as HTMLSelectElement)?.value ?? 'none') as GroupKey;

    this.queryResults = runQuery(this.factTable, this.currentQuery, this.activeFieldDefs);
    this.reRender();
  }

  private async _reRenderExplorer(): Promise<void> {
    const panel = document.getElementById('stats-panel-explorer');
    if (!panel) return;
    panel.innerHTML = this._renderExplorerTab();
    this._bindExplorer();
    if (this.queryResults?.length && this.currentQuery.groupBy !== 'none') {
      await this.renderExplorerChart();
    }
  }

  private async renderExplorerChart(): Promise<void> {
    const canvas = document.getElementById('explorer-chart') as HTMLCanvasElement | null;
    if (!canvas || !this.queryResults?.length) return;

    this._explorerChart?.destroy();
    this._explorerChart = null;

    try {
      const { Chart, registerables } = await import('chart.js');
      Chart.register(...registerables);

      const q = this.currentQuery;
      const isDuration = q.field === 'roundDuration';
      const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
      const textColor = isDark ? '#94a3b8' : '#64748b';
      const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';

      const labels = this.queryResults.map(r => r.label);
      const values = this.queryResults.map(r => r.value);
      const colors = this.queryResults.map(r => r.color ?? '#6366f1');
      const durationTick = isDuration
        ? { callback: (v: unknown) => formatDuration(Number(v)) }
        : {};

      if (q.groupBy === 'month') {
        this._explorerChart = new Chart(canvas, {
          type: 'line',
          data: {
            labels,
            datasets: [{
              label: fieldLabel(q.field, q.metric),
              data: values,
              borderColor: '#6366f1',
              backgroundColor: 'rgba(99,102,241,0.15)',
              borderWidth: 2, pointRadius: 4, fill: true, tension: 0.3,
            }],
          },
          options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: { ticks: { color: textColor }, grid: { color: gridColor } },
              y: { ticks: { color: textColor, ...durationTick }, grid: { color: gridColor } },
            },
          },
        }) as ChartType;
      } else {
        this._explorerChart = new Chart(canvas, {
          type: 'bar',
          data: {
            labels,
            datasets: [{
              label: fieldLabel(q.field, q.metric),
              data: values,
              backgroundColor: colors.map(c => c + 'cc'),
              borderColor: colors,
              borderWidth: 1,
              borderRadius: 4,
            }],
          },
          options: {
            indexAxis: 'y' as const,
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: { ticks: { color: textColor, ...durationTick }, grid: { color: gridColor } },
              y: { ticks: { color: textColor }, grid: { color: gridColor } },
            },
          },
        }) as ChartType;
      }
    } catch (err) {
      console.warn('Chart.js failed to load:', err);
    }
  }

  teardown(): void {
    this._winsChart?.destroy();    this._winsChart = null;
    this._trendChart?.destroy();   this._trendChart = null;
    this._explorerChart?.destroy(); this._explorerChart = null;
  }

  private async loadGameStats(game: Game): Promise<void> {
    try {
      const stats = await computeGameStats(game.id!);
      const el = document.getElementById(`game-match-count-${game.id}`);
      if (el) el.textContent = `${stats.totalMatches} match${stats.totalMatches !== 1 ? 'es' : ''}`;
    } catch { /* ignore */ }
  }

  private async renderWinsChart(): Promise<void> {
    const canvas = document.getElementById('wins-bar-chart') as HTMLCanvasElement | null;
    if (!canvas || !this.playerStats) return;
    this._winsChart?.destroy(); this._winsChart = null;

    try {
      const { Chart, registerables } = await import('chart.js');
      Chart.register(...registerables);

      const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
      const textColor = isDark ? '#94a3b8' : '#64748b';
      const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';

      this._winsChart = new Chart(canvas, {
        type: 'bar',
        data: {
          labels: this.playerStats.gameBreakdown.map(gb => gb.gameName),
          datasets: [
            { label: 'Wins',   data: this.playerStats.gameBreakdown.map(gb => gb.wins),
              backgroundColor: 'rgba(16,185,129,0.8)', borderColor: '#10b981', borderWidth: 1, borderRadius: 4 },
            { label: 'Losses', data: this.playerStats.gameBreakdown.map(gb => gb.losses),
              backgroundColor: 'rgba(239,68,68,0.8)', borderColor: '#ef4444', borderWidth: 1, borderRadius: 4 },
          ],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { labels: { color: textColor, font: { size: 12 } } } },
          scales: {
            x: { ticks: { color: textColor }, grid: { color: gridColor } },
            y: { ticks: { color: textColor, stepSize: 1 }, grid: { color: gridColor }, beginAtZero: true },
          },
        },
      }) as ChartType;
    } catch (err) { console.warn('Chart.js failed to load:', err); }
  }

  private async renderTrendChart(): Promise<void> {
    const canvas = document.getElementById('score-line-chart') as HTMLCanvasElement | null;
    if (!canvas || !this.playerStats) return;
    this._trendChart?.destroy(); this._trendChart = null;

    try {
      const { Chart, registerables } = await import('chart.js');
      Chart.register(...registerables);

      const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
      const textColor = isDark ? '#94a3b8' : '#64748b';
      const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';

      this._trendChart = new Chart(canvas, {
        type: 'line',
        data: {
          labels: this.playerStats.scoreTrend.map((_, i) => `Match ${i + 1}`),
          datasets: [{
            label: 'Score',
            data: this.playerStats.scoreTrend.map(t => t.total),
            borderColor: '#6366f1',
            backgroundColor: 'rgba(99, 102, 241, 0.15)',
            borderWidth: 2, pointBackgroundColor: '#6366f1', pointRadius: 4, fill: true, tension: 0.3,
          }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { ticks: { color: textColor }, grid: { color: gridColor } },
            y: { ticks: { color: textColor }, grid: { color: gridColor } },
          },
        },
      }) as ChartType;
    } catch (err) { console.warn('Chart.js failed to load:', err); }
  }

  private _renderCustomTab(): string {
    const hasKey = !!this.customApiKey;

    const apiSection = `
      <section class="card mb-4" aria-label="Claude API Key">
        <div class="card-header">
          <h2 class="card-title">Claude API Key</h2>
          ${hasKey ? `<span class="badge badge-success" style="margin-left:auto">Configured</span>` : ''}
        </div>
        <p class="text-sm text-muted mb-3">
          Custom stats are generated by Claude AI and run locally against your data.
          Your key is stored only on this device.
        </p>
        <div class="flex gap-2">
          <input type="password" id="custom-stat-api-key" class="form-input flex-1"
            placeholder="${hasKey ? '●●●●●●●●●●●●●●●●' : 'sk-ant-...'}"
            value="" autocomplete="off" />
          <button class="btn btn-secondary" id="custom-stat-save-key">Save</button>
          ${hasKey ? `<button class="btn btn-ghost btn-sm" id="custom-stat-clear-key" style="color:var(--danger)">Clear</button>` : ''}
        </div>
      </section>
    `;

    const generateSection = `
      <section class="card mb-4" aria-label="Add custom stat">
        <div class="card-header">
          <h2 class="card-title">Describe a stat</h2>
        </div>
        <textarea id="custom-stat-desc" class="form-input custom-stat-textarea"
          placeholder="e.g. who has the most come-from-behind wins in Phase 10"
          rows="3" ${!hasKey ? 'disabled' : ''}></textarea>
        <button class="btn btn-primary mt-3 btn-full" id="custom-stat-generate"
          ${!hasKey || this._customGenerating ? 'disabled' : ''}>
          ${this._customGenerating ? '⏳ Generating…' : '✨ Generate Stat'}
        </button>
        ${!hasKey ? `<p class="text-sm text-muted mt-2" style="text-align:center">Add your Claude API key above to generate stats.</p>` : ''}
      </section>
    `;

    const savedHtml = this.customStats.length === 0
      ? `<div class="explorer-empty">No custom stats yet. Describe one above and click Generate.</div>`
      : this.customStats.map(s => this._renderCustomStatCard(s, this._evaluatedStats.get(s.id))).join('');

    return `${apiSection}${generateSection}${savedHtml}`;
  }

  private _renderCustomStatCard(stat: CustomStat, result?: CustomStatResult): string {
    let resultHtml = '';
    if (!result) {
      resultHtml = `<div class="text-sm text-muted">No data yet.</div>`;
    } else if (result.type === 'error') {
      resultHtml = `<div class="custom-stat-error">⚠ ${escHtml(result.message)}</div>`;
    } else if (result.type === 'number') {
      resultHtml = `<div class="stat-big-number">${result.value}</div>`;
    } else if (result.type === 'text') {
      resultHtml = `<div class="custom-stat-text-result">${escHtml(result.value)}</div>`;
    } else if (result.type === 'table') {
      const rows = result.rows.slice(0, 10).map((r, i) => `
        <tr>
          <td class="result-table-rank">${i + 1}</td>
          <td>
            ${r.color ? `<span class="player-dot" style="background:${r.color}"></span> ` : ''}
            ${escHtml(r.label)}
          </td>
          <td class="result-table-val"><strong>${r.value}</strong></td>
        </tr>
      `).join('');
      resultHtml = `
        <table class="result-table" style="margin-top:0.75rem">
          <tbody>${rows}</tbody>
        </table>
      `;
    }

    return `
      <section class="card mb-3" aria-label="${escHtml(stat.name)}">
        <div class="card-header">
          <div style="flex:1;min-width:0">
            <h3 class="card-title" style="font-size:0.95rem;margin-bottom:0.15rem">${escHtml(stat.name)}</h3>
          </div>
          <button class="btn btn-ghost btn-sm custom-stat-delete" data-stat-id="${escHtml(stat.id)}"
            aria-label="Delete stat" style="color:var(--danger);flex-shrink:0">🗑</button>
        </div>
        <div class="custom-stat-result">${resultHtml}</div>
      </section>
    `;
  }

  private _bindCustomTab(): void {
    document.getElementById('custom-stat-save-key')?.addEventListener('click', () => {
      const input = document.getElementById('custom-stat-api-key') as HTMLInputElement | null;
      const key = input?.value.trim() ?? '';
      if (!key) return;
      saveApiKey(key);
      this.customApiKey = key;
      this.reRender();
    });

    document.getElementById('custom-stat-clear-key')?.addEventListener('click', () => {
      saveApiKey('');
      this.customApiKey = '';
      this.reRender();
    });

    document.getElementById('custom-stat-generate')?.addEventListener('click', async () => {
      const ta = document.getElementById('custom-stat-desc') as HTMLTextAreaElement | null;
      const desc = ta?.value.trim() ?? '';
      if (!desc) { showToast('Describe a stat first', 'error'); return; }
      if (!this.customApiKey) { showToast('Add your Claude API key first', 'error'); return; }

      this._customGenerating = true;
      this.reRender();

      try {
        const code = await generateStatCode(desc, this.customApiKey, this.factTable);
        const stat: CustomStat = {
          id: Date.now().toString(),
          name: desc.length > 60 ? desc.slice(0, 57) + '…' : desc,
          description: desc,
          code,
          createdAt: Date.now(),
        };
        this._evaluatedStats.set(stat.id, evalCustomStat(code, this.factTable));
        this.customStats = [stat, ...this.customStats];
        saveCustomStats(this.customStats);
        showToast('Stat added!', 'success');
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Failed to generate stat', 'error');
      } finally {
        this._customGenerating = false;
        this.reRender();
      }
    });

    document.querySelectorAll<HTMLButtonElement>('.custom-stat-delete').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset['statId'];
        if (!id) return;
        this.customStats = this.customStats.filter(s => s.id !== id);
        this._evaluatedStats.delete(id);
        saveCustomStats(this.customStats);
        this.reRender();
      });
    });
  }

  private reRender(): void {
    this.teardown();
    const container = document.getElementById('view-container');
    if (!container) return;
    container.innerHTML = this.render();
    void this.afterRender();
  }
}
