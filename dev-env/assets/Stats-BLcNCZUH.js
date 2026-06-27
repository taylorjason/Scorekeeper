import{d as e,f as t,y as n}from"./index-CCzyPYzq.js";import{n as r,r as i}from"./utils-BZltm_RL.js";import{n as a,r as o,t as s}from"./stats-BjwxUVKU.js";import{a as c,c as l,i as u,l as d,n as f,o as p,r as m,s as h}from"./query-engine-Cwrg87qA.js";var g=`scorekeeper_custom_stats`,_=`scorekeeper_claude_api_key`;function v(){try{return JSON.parse(localStorage.getItem(g)??`[]`)}catch{return[]}}function y(e){localStorage.setItem(g,JSON.stringify(e))}function b(){return localStorage.getItem(_)??``}function x(e){e?localStorage.setItem(_,e):localStorage.removeItem(_)}var S=`You are a JavaScript code generator for a board game scorekeeper app.
Generate the body of a JavaScript function that receives \`rows\` (StatRow[]) and returns one of:
- A number (single aggregate value)
- An array of { label: string, value: number, color?: string } objects (ranked list, already sorted descending)
- A string (narrative answer)

StatRow schema:
interface StatRow {
  entryId: number;
  playerId: number;
  playerName: string;
  playerColor: string;      // hex like "#ef4444"
  matchId: number;
  gameId: number;
  gameName: string;
  nightId: number;
  nightDate: string;        // "YYYY-MM-DD"
  roundNumber: number;
  value: number;            // round score
  note?: string;
  entryCreatedAt: number;   // timestamp ms
  isFirstOut: boolean;      // first player to go out this round
  isWinner: boolean;        // did this player win the match?
  roundDuration?: number;   // ms; may be undefined
}

Rules:
- Output ONLY the raw JavaScript function body — no function declaration, no markdown fences, no explanation.
- The last statement must be a return statement.
- Use only standard JS (no import/require/fetch/async).
- Deduplicate rows where needed (e.g. one row per matchId+playerId for win counts).`;async function C(e,t,n){if(!t.startsWith(`sk-ant-`))throw Error(`Invalid API key format — should start with "sk-ant-"`);let r=JSON.stringify(n.slice(0,5),null,2),i;try{i=await fetch(`https://api.anthropic.com/v1/messages`,{method:`POST`,headers:{"content-type":`application/json`,"x-api-key":t,"anthropic-version":`2023-06-01`,"anthropic-dangerous-direct-browser-calls":`true`},body:JSON.stringify({model:`claude-haiku-4-5-20251001`,max_tokens:1024,system:S,messages:[{role:`user`,content:`Stat to compute: "${e}"\n\nSample data (first 5 rows):\n${r}\n\nGenerate the JavaScript function body now.`}]})})}catch(e){let t=e instanceof Error?e.message:String(e);throw console.error(`[custom-stats] Network error calling Anthropic API:`,e),Error(`Network error: ${t}. Check your internet connection or try disabling content blockers.`)}if(!i.ok){let e=await i.text();console.error(`[custom-stats] API error`,i.status,e);let t=``;try{t=JSON.parse(e).error?.message??e}catch{t=e}throw Error(`API error ${i.status}: ${t}`)}return((await i.json()).content.find(e=>e.type===`text`)?.text??``).replace(/^```[a-z]*\n?/i,``).replace(/\n?```$/i,``).trim()}function w(e,t){try{let n=Function(`rows`,e)(t);if(typeof n==`number`)return{type:`number`,value:n};if(typeof n==`string`)return{type:`text`,value:n};if(Array.isArray(n)){let e=n.map(e=>{let t=e;return{label:String(t.label??``),value:Number(t.value??0),color:typeof t.color==`string`?t.color:void 0}});return e.sort((e,t)=>t.value-e.value),{type:`table`,rows:e}}return{type:`text`,value:JSON.stringify(n)}}catch(e){return{type:`error`,message:e instanceof Error?e.message:String(e)}}}var T=[{id:`first-out`,label:`⚡ First-Out Leaders`,query:{metric:`count`,field:`isFirstOut`,groupBy:`player`,conditions:[]}},{id:`fastest`,label:`⏱ Fastest Rounds`,query:{metric:`min`,field:`roundDuration`,groupBy:`game`,conditions:[]}},{id:`avg-score`,label:`📊 Avg Round Score`,query:{metric:`avg`,field:`value`,groupBy:`player`,conditions:[]}},{id:`wins`,label:`🏆 Win Leaders`,query:{metric:`count`,field:`isWin`,groupBy:`player`,conditions:[]}},{id:`monthly`,label:`📅 Last 3 Months`,query:{metric:`count`,field:`isWin`,groupBy:`month`,conditions:[{id:`qi-date`,fieldKey:`nightDate`,operator:`gte`,value:u(`3mo`)}]}}],E=class{players=[];games=[];selectedPlayerId=null;leaderboard=[];playerStats=null;activeMainTab=`overview`;factTable=[];currentQuery={...T[0].query,conditions:[]};queryResults=null;fieldConfig=h();activeFieldDefs=[];_winsChart=null;_trendChart=null;_explorerChart=null;customStats=[];customApiKey=``;_evaluatedStats=new Map;_customGenerating=!1;async load(){let[e,t,r,i]=await Promise.all([n.players.toArray(),n.games.toArray(),a(),m()]);this.players=e.filter(e=>e.active),this.games=t,this.leaderboard=r,this.factTable=i,this.fieldConfig=h(),this.activeFieldDefs=p(this.fieldConfig),this.selectedPlayerId===null&&this.players.length>0&&(this.selectedPlayerId=this.players[0].id),this.selectedPlayerId!==null&&(this.playerStats=await o(this.selectedPlayerId)),this.customStats=v(),this.customApiKey=b(),this._evaluatedStats.clear();for(let e of this.customStats)this._evaluatedStats.set(e.id,w(e.code,this.factTable))}render(){let e=this._renderOverview();return`
      <main class="view" aria-label="Statistics">
        <header class="page-header">
          <h1 class="page-title">Statistics</h1>
        </header>

        <div class="stats-main-tabs" role="tablist" aria-label="Stats sections">
          <button class="stats-main-tab-btn ${this.activeMainTab===`overview`?`active`:``}"
            id="stats-tab-overview" role="tab" aria-selected="${this.activeMainTab===`overview`}"
            aria-controls="stats-panel-overview">Overview</button>
          <button class="stats-main-tab-btn ${this.activeMainTab===`explorer`?`active`:``}"
            id="stats-tab-explorer" role="tab" aria-selected="${this.activeMainTab===`explorer`}"
            aria-controls="stats-panel-explorer">Explorer</button>
          <button class="stats-main-tab-btn ${this.activeMainTab===`custom`?`active`:``}"
            id="stats-tab-custom" role="tab" aria-selected="${this.activeMainTab===`custom`}"
            aria-controls="stats-panel-custom">✨ Custom</button>
        </div>

        <div id="stats-panel-overview" role="tabpanel" aria-labelledby="stats-tab-overview"
          ${this.activeMainTab===`overview`?``:`hidden`}>
          ${e}
        </div>

        <div id="stats-panel-explorer" role="tabpanel" aria-labelledby="stats-tab-explorer"
          ${this.activeMainTab===`explorer`?``:`hidden`}>
          ${this.activeMainTab===`explorer`?this._renderExplorerTab():``}
        </div>

        <div id="stats-panel-custom" role="tabpanel" aria-labelledby="stats-tab-custom"
          ${this.activeMainTab===`custom`?``:`hidden`}>
          ${this.activeMainTab===`custom`?this._renderCustomTab():``}
        </div>
      </main>
    `}_renderOverview(){let e=this.players.map(e=>`
      <button class="tab-btn ${this.selectedPlayerId===e.id?`active`:``}"
        data-player-id="${e.id}" aria-selected="${this.selectedPlayerId===e.id}"
        aria-label="${r(e.displayName)}">
        <span class="player-dot" style="background:${e.color}"></span>
        ${r(e.displayName)}
      </button>
    `).join(``),t=this.playerStats,n=``;if(t&&this.selectedPlayerId!==null){let e=this.players.find(e=>e.id===this.selectedPlayerId);n=`
        <section class="card mb-4" aria-labelledby="player-stats-heading">
          <div class="card-header">
            <h2 class="card-title" id="player-stats-heading">
              ${e?`<span class="player-dot" style="background:${e.color}; margin-right:6px"></span>`:``}
              ${e?r(e.displayName):`Player`} Stats
            </h2>
          </div>
          <div class="stat-grid">
            <div class="stat-card">
              <div class="stat-value" style="color:var(--success)">${t.wins}</div>
              <div class="stat-label">Wins</div>
            </div>
            <div class="stat-card">
              <div class="stat-value" style="color:var(--danger)">${t.losses}</div>
              <div class="stat-label">Losses</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${t.winRate}%</div>
              <div class="stat-label">Win Rate</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${t.avgScore}</div>
              <div class="stat-label">Avg Score</div>
            </div>
          </div>
          <div class="text-sm text-muted" style="margin-top:0.25rem">${t.gamesPlayed} matches played</div>
        </section>

        ${t.gameBreakdown.length>0?`
          <section class="card mb-4" aria-labelledby="wins-chart-heading">
            <h2 class="card-title mb-3" id="wins-chart-heading">Wins by Game</h2>
            <div class="chart-container">
              <canvas id="wins-bar-chart" aria-label="Bar chart of wins by game" role="img"></canvas>
            </div>
          </section>
        `:``}

        ${t.scoreTrend.length>1?`
          <section class="card mb-4" aria-labelledby="trend-chart-heading">
            <h2 class="card-title mb-3" id="trend-chart-heading">Score Trend (Last 10)</h2>
            <div class="chart-container">
              <canvas id="score-line-chart" aria-label="Line chart of score trend" role="img"></canvas>
            </div>
          </section>
        `:``}

        ${t.gameBreakdown.length>0?`
          <section class="card mb-4" aria-labelledby="breakdown-heading">
            <h2 class="card-title mb-3" id="breakdown-heading">Game Breakdown</h2>
            <table class="leaderboard" aria-label="Game breakdown for selected player">
              <thead>
                <tr><th>Game</th><th>Played</th><th>Wins</th><th>Avg Score</th></tr>
              </thead>
              <tbody>
                ${t.gameBreakdown.map(e=>`
                  <tr>
                    <td>${r(e.gameName)}</td>
                    <td>${e.gamesPlayed}</td>
                    <td>${e.wins}</td>
                    <td>${e.avgScore}</td>
                  </tr>
                `).join(``)}
              </tbody>
            </table>
          </section>
        `:`
          <div class="empty-state" style="padding:1.5rem 0">
            <div class="empty-state-icon">📊</div>
            <div class="empty-state-title">No stats yet</div>
            <p>Play some matches to see stats!</p>
          </div>
        `}
      `}let i=this.leaderboard.length===0?`<div class="text-sm text-muted" style="padding:1rem 0">No games played yet</div>`:`
        <table class="leaderboard" aria-label="Overall leaderboard">
          <thead>
            <tr><th>#</th><th>Player</th><th>Wins</th><th>Played</th><th>Win %</th></tr>
          </thead>
          <tbody>
            ${this.leaderboard.map((e,t)=>`
              <tr class="${this.selectedPlayerId===e.player.id?`highlighted-row`:``}">
                <td>${t===0?`🥇`:t===1?`🥈`:t===2?`🥉`:t+1}</td>
                <td>
                  <div class="flex items-center gap-2">
                    <span class="player-dot" style="background:${e.player.color}"></span>
                    <button class="btn btn-ghost btn-sm" style="padding:0; min-height:auto; font-size:0.9rem"
                      data-player-id="${e.player.id}">${r(e.player.displayName)}</button>
                  </div>
                </td>
                <td><strong>${e.wins}</strong></td>
                <td>${e.gamesPlayed}</td>
                <td>${e.winRate}%</td>
              </tr>
            `).join(``)}
          </tbody>
        </table>
      `,a=this.games.length>0?`
      <section class="card mb-4" aria-labelledby="game-stats-heading">
        <h2 class="card-title mb-3" id="game-stats-heading">Game Overview</h2>
        <div id="game-stats-list">
          ${this.games.map(e=>`
            <div class="flex items-center gap-3 mb-2" style="padding: 0.5rem 0; border-bottom: 1px solid var(--border)">
              <div class="flex-1">
                <div class="font-semibold text-sm">${r(e.name)}</div>
                <div class="text-xs text-muted">${e.scoringMode} scoring</div>
              </div>
              <span id="game-match-count-${e.id}" class="badge badge-muted text-xs">Loading...</span>
            </div>
          `).join(``)}
        </div>
      </section>
    `:``;return`
      <section class="mb-4" aria-label="Player tabs">
        <div class="section-title mb-2">Select Player</div>
        <div class="tabs" role="tablist" aria-label="Player selection">
          ${e}
        </div>
      </section>

      <div id="player-stats-section">${n}</div>

      <section class="card mb-4" aria-labelledby="leaderboard-heading">
        <h2 class="card-title mb-3" id="leaderboard-heading">Overall Leaderboard</h2>
        ${i}
      </section>

      ${a}
    `}_renderExplorerTab(){let e=this.currentQuery,t=T.map(e=>`<button class="quick-insight-btn" data-insight="${e.id}">${e.label}</button>`).join(``),n=e.conditions.map(e=>this._renderConditionRow(e)).join(``),r=[{value:`value`,label:`Round Score`},{value:`roundDuration`,label:`Round Duration`},{value:`isFirstOut`,label:`First-Out Events`},{value:`isWin`,label:`Wins`}].map(t=>`<option value="${t.value}" ${e.field===t.value?`selected`:``}>${t.label}</option>`).join(``),i=[{value:`count`,label:`Count`},{value:`avg`,label:`Average`},{value:`sum`,label:`Total`},{value:`min`,label:`Minimum`},{value:`max`,label:`Maximum`}].map(t=>`<option value="${t.value}" ${e.metric===t.value?`selected`:``}>${t.label}</option>`).join(``),a=[{value:`none`,label:`None (single value)`},{value:`player`,label:`By Player`},{value:`game`,label:`By Game`},{value:`month`,label:`By Month`},{value:`dayOfWeek`,label:`By Day of Week`}].map(t=>`<option value="${t.value}" ${e.groupBy===t.value?`selected`:``}>${t.label}</option>`).join(``),o=this.activeFieldDefs.length===0;return`
      <div class="explorer-wrap">
        <section class="mb-4" aria-label="Quick insights">
          <div class="section-title mb-2">Quick Insights</div>
          <div class="quick-insights-row" role="group" aria-label="Quick insight shortcuts">
            ${t}
          </div>
        </section>

        <section class="query-builder card mb-4" aria-label="Query builder">
          <div class="card-header">
            <h2 class="card-title">Build a Query</h2>
          </div>

          <div class="qb-section-label">Filters</div>
          <div id="conditions-list">
            ${n}
          </div>
          <button class="btn btn-secondary btn-sm mt-2" id="add-condition-btn" ${o?`disabled`:``}>
            + Add Condition
          </button>
          ${o?`<p class="text-sm text-muted mt-1">Enable filter fields in Settings → Stats Fields.</p>`:``}

          <div class="qb-divider"></div>

          <div class="qb-section-label">Measure</div>
          <div class="qb-row">
            <select class="form-select qb-select" id="qb-metric">${i}</select>
            <span class="qb-of">of</span>
            <select class="form-select qb-select" id="qb-field">${r}</select>
          </div>

          <div class="qb-section-label" style="margin-top:0.75rem">Group by</div>
          <div class="qb-row">
            <select class="form-select qb-select" id="qb-groupby" style="max-width:220px">${a}</select>
          </div>

          <button class="btn btn-primary mt-3 btn-full" id="qb-run-btn">▶ Run Query</button>
        </section>

        <div id="explorer-results">${this._renderQueryResults()}</div>
      </div>
    `}_renderConditionRow(e){let t=this.activeFieldDefs,n=t.find(t=>t.key===e.fieldKey)??t[0];if(!n)return``;let i=`<select class="cond-field form-select" data-cid="${e.id}" aria-label="Filter field">
      ${t.map(t=>`<option value="${r(t.key)}" ${t.key===e.fieldKey?`selected`:``}>${r(t.label)}</option>`).join(``)}
    </select>`,a=`<select class="cond-op form-select" data-cid="${e.id}" aria-label="Operator">
      ${n.operators.map(t=>`<option value="${t}" ${t===e.operator?`selected`:``}>${f[t]}</option>`).join(``)}
    </select>`,o=this._renderValuePicker(e,n);return`<div class="condition-row" data-cid="${e.id}">
      ${i}${a}${o}
      <button class="cond-remove btn btn-icon btn-sm" data-cid="${e.id}" aria-label="Remove condition" title="Remove">×</button>
    </div>`}_renderValuePicker(e,t){let n=String(e.value??``),i=`data-cid="${e.id}"`;return t.type===`boolean`?`<select class="cond-val form-select" ${i} aria-label="Value">
        <option value="true"  ${n===`true`?`selected`:``}>Yes</option>
        <option value="false" ${n===`false`?`selected`:``}>No</option>
      </select>`:t.type===`player-set`?`<select class="cond-val form-select" ${i} aria-label="Player">
        ${this.players.map(e=>`<option value="${e.id}" ${n===String(e.id)?`selected`:``}>${r(e.displayName)}</option>`).join(``)}
      </select>`:t.key===`gameId`||t.type===`enum`&&!t.options?`<select class="cond-val form-select" ${i} aria-label="Game">
        ${this.games.map(e=>`<option value="${e.id}" ${n===String(e.id)?`selected`:``}>${r(e.name)}</option>`).join(``)}
      </select>`:t.key===`playerId`?`<select class="cond-val form-select" ${i} aria-label="Player">
        ${this.players.map(e=>`<option value="${e.id}" ${n===String(e.id)?`selected`:``}>${r(e.displayName)}</option>`).join(``)}
      </select>`:t.type===`enum`&&t.options?`<select class="cond-val form-select" ${i} aria-label="Value">
        ${t.options.map(e=>`<option value="${e.value}" ${n===String(e.value)?`selected`:``}>${r(e.label)}</option>`).join(``)}
      </select>`:t.type===`date`?`<input type="date" class="cond-val form-input cond-val-date" ${i} value="${r(n)}" aria-label="Date">`:`<input type="number" class="cond-val form-input cond-val-num" ${i} value="${r(n)}" aria-label="Value">`}_renderQueryResults(){if(this.queryResults===null)return`<div class="explorer-empty">Pick an insight above or configure a query and click Run.</div>`;if(this.queryResults.length===0)return`<div class="explorer-empty">No data for these filters — try broadening the date range or removing filters.</div>`;let e=this.currentQuery,t=e.field===`roundDuration`,n=c(e.field,e.metric),a=e=>t?i(e):String(e);if(e.groupBy===`none`){let e=this.queryResults[0];return`
        <section class="card" aria-label="Query result">
          <div class="card-header"><h2 class="card-title">${r(n)}</h2></div>
          <div class="stat-big-number">${a(e.value)}</div>
          <div class="text-sm text-muted" style="text-align:center">${e.sampleSize} data point${e.sampleSize===1?``:`s`}</div>
        </section>
      `}let o=this.queryResults.map((e,t)=>`
      <tr>
        <td class="result-table-rank">${t+1}</td>
        <td>
          ${e.color?`<span class="player-dot" style="background:${e.color}"></span> `:``}
          ${r(e.label)}
        </td>
        <td class="result-table-val"><strong>${a(e.value)}</strong></td>
        <td class="result-table-n text-muted">${e.sampleSize}</td>
      </tr>
    `).join(``),s=Math.max(180,this.queryResults.length*36+48),l=e.groupBy===`player`?`Player`:e.groupBy===`game`?`Game`:`Month`;return`
      <section class="card" aria-label="Query results">
        <div class="card-header"><h2 class="card-title">${r(n)}</h2></div>
        <div class="chart-container" style="height:${s}px">
          <canvas id="explorer-chart" aria-label="${r(n)} chart" role="img"></canvas>
        </div>
        <table class="result-table" aria-label="${r(n)} data table">
          <thead>
            <tr><th>#</th><th>${l}</th><th>Value</th><th title="Sample size">n</th></tr>
          </thead>
          <tbody>${o}</tbody>
        </table>
      </section>
    `}async afterRender(){if(document.getElementById(`stats-tab-overview`)?.addEventListener(`click`,()=>{this.activeMainTab!==`overview`&&(this.activeMainTab=`overview`,this.reRender())}),document.getElementById(`stats-tab-explorer`)?.addEventListener(`click`,()=>{this.activeMainTab!==`explorer`&&(this.activeMainTab=`explorer`,this.reRender())}),document.getElementById(`stats-tab-custom`)?.addEventListener(`click`,()=>{this.activeMainTab!==`custom`&&(this.activeMainTab=`custom`,this.reRender())}),this.activeMainTab===`overview`){this.playerStats?.gameBreakdown.length&&await this.renderWinsChart(),this.playerStats&&this.playerStats.scoreTrend.length>1&&await this.renderTrendChart();for(let e of this.games)this.loadGameStats(e);document.querySelectorAll(`[data-player-id]`).forEach(e=>{e.addEventListener(`click`,async()=>{let t=parseInt(e.dataset.playerId??``,10);isNaN(t)||(this.selectedPlayerId=t,this.playerStats=await o(t),this.reRender())})})}else this.activeMainTab===`explorer`?(this.activeFieldDefs=p(this.fieldConfig),this._bindExplorer(),this.queryResults?.length&&this.currentQuery.groupBy!==`none`&&await this.renderExplorerChart()):this.activeMainTab===`custom`&&this._bindCustomTab()}_bindExplorer(){document.querySelectorAll(`.quick-insight-btn`).forEach(e=>{e.addEventListener(`click`,()=>{let t=T.find(t=>t.id===e.dataset.insight);t&&(this.currentQuery={...t.query,conditions:t.query.conditions.map(e=>({...e}))},this.queryResults=d(this.factTable,this.currentQuery,this.activeFieldDefs),this.reRender())})}),document.getElementById(`add-condition-btn`)?.addEventListener(`click`,()=>{let e=this.activeFieldDefs[0];e&&(this.currentQuery.conditions.push({id:l(),fieldKey:e.key,operator:e.operators[0],value:e.type===`boolean`?`true`:e.options?String(e.options[0]?.value??``):e.type===`player-set`?String(this.players[0]?.id??``):``}),this._reRenderExplorer())}),document.querySelectorAll(`.cond-field`).forEach(e=>{e.addEventListener(`change`,()=>{let t=e.dataset.cid,n=this.currentQuery.conditions.find(e=>e.id===t);if(!n)return;let r=this.activeFieldDefs.find(t=>t.key===e.value);r&&(n.fieldKey=e.value,n.operator=r.operators[0],n.value=r.type===`boolean`?`true`:r.options?String(r.options[0]?.value??``):r.type===`player-set`?String(this.players[0]?.id??``):``,this._reRenderExplorer())})}),document.querySelectorAll(`.cond-op`).forEach(e=>{e.addEventListener(`change`,()=>{let t=e.dataset.cid,n=this.currentQuery.conditions.find(e=>e.id===t);n&&(n.operator=e.value,this._reRenderExplorer())})}),document.querySelectorAll(`.cond-val`).forEach(e=>{e.addEventListener(`change`,()=>{let t=e.dataset.cid,n=this.currentQuery.conditions.find(e=>e.id===t);n&&(n.value=e.value)})}),document.querySelectorAll(`.cond-remove`).forEach(e=>{e.addEventListener(`click`,()=>{let t=e.dataset.cid;this.currentQuery.conditions=this.currentQuery.conditions.filter(e=>e.id!==t),this._reRenderExplorer()})}),document.getElementById(`qb-run-btn`)?.addEventListener(`click`,()=>{this._readFormAndRun()})}_readFormAndRun(){document.querySelectorAll(`.cond-val`).forEach(e=>{let t=e.dataset.cid,n=this.currentQuery.conditions.find(e=>e.id===t);n&&(n.value=e.value)}),this.currentQuery.metric=document.getElementById(`qb-metric`)?.value??`count`,this.currentQuery.field=document.getElementById(`qb-field`)?.value??`value`,this.currentQuery.groupBy=document.getElementById(`qb-groupby`)?.value??`none`,this.queryResults=d(this.factTable,this.currentQuery,this.activeFieldDefs),this.reRender()}async _reRenderExplorer(){let e=document.getElementById(`stats-panel-explorer`);e&&(e.innerHTML=this._renderExplorerTab(),this._bindExplorer(),this.queryResults?.length&&this.currentQuery.groupBy!==`none`&&await this.renderExplorerChart())}async renderExplorerChart(){let t=document.getElementById(`explorer-chart`);if(!(!t||!this.queryResults?.length)){this._explorerChart?.destroy(),this._explorerChart=null;try{let{Chart:n,registerables:r}=await e(async()=>{let{Chart:e,registerables:t}=await import(`./chart-vM59ydkj.js`);return{Chart:e,registerables:t}},[],import.meta.url);n.register(...r);let a=this.currentQuery,o=a.field===`roundDuration`,s=document.documentElement.getAttribute(`data-theme`)!==`light`,l=s?`#94a3b8`:`#64748b`,u=s?`rgba(255,255,255,0.05)`:`rgba(0,0,0,0.05)`,d=this.queryResults.map(e=>e.label),f=this.queryResults.map(e=>e.value),p=this.queryResults.map(e=>e.color??`#6366f1`),m=o?{callback:e=>i(Number(e))}:{};a.groupBy===`month`?this._explorerChart=new n(t,{type:`line`,data:{labels:d,datasets:[{label:c(a.field,a.metric),data:f,borderColor:`#6366f1`,backgroundColor:`rgba(99,102,241,0.15)`,borderWidth:2,pointRadius:4,fill:!0,tension:.3}]},options:{responsive:!0,maintainAspectRatio:!1,plugins:{legend:{display:!1}},scales:{x:{ticks:{color:l},grid:{color:u}},y:{ticks:{color:l,...m},grid:{color:u}}}}}):this._explorerChart=new n(t,{type:`bar`,data:{labels:d,datasets:[{label:c(a.field,a.metric),data:f,backgroundColor:p.map(e=>e+`cc`),borderColor:p,borderWidth:1,borderRadius:4}]},options:{indexAxis:`y`,responsive:!0,maintainAspectRatio:!1,plugins:{legend:{display:!1}},scales:{x:{ticks:{color:l,...m},grid:{color:u}},y:{ticks:{color:l},grid:{color:u}}}}})}catch(e){console.warn(`Chart.js failed to load:`,e)}}}teardown(){this._winsChart?.destroy(),this._winsChart=null,this._trendChart?.destroy(),this._trendChart=null,this._explorerChart?.destroy(),this._explorerChart=null}async loadGameStats(e){try{let t=await s(e.id),n=document.getElementById(`game-match-count-${e.id}`);n&&(n.textContent=`${t.totalMatches} match${t.totalMatches===1?``:`es`}`)}catch{}}async renderWinsChart(){let t=document.getElementById(`wins-bar-chart`);if(!(!t||!this.playerStats)){this._winsChart?.destroy(),this._winsChart=null;try{let{Chart:n,registerables:r}=await e(async()=>{let{Chart:e,registerables:t}=await import(`./chart-vM59ydkj.js`);return{Chart:e,registerables:t}},[],import.meta.url);n.register(...r);let i=document.documentElement.getAttribute(`data-theme`)!==`light`,a=i?`#94a3b8`:`#64748b`,o=i?`rgba(255,255,255,0.05)`:`rgba(0,0,0,0.05)`;this._winsChart=new n(t,{type:`bar`,data:{labels:this.playerStats.gameBreakdown.map(e=>e.gameName),datasets:[{label:`Wins`,data:this.playerStats.gameBreakdown.map(e=>e.wins),backgroundColor:`rgba(16,185,129,0.8)`,borderColor:`#10b981`,borderWidth:1,borderRadius:4},{label:`Losses`,data:this.playerStats.gameBreakdown.map(e=>e.losses),backgroundColor:`rgba(239,68,68,0.8)`,borderColor:`#ef4444`,borderWidth:1,borderRadius:4}]},options:{responsive:!0,maintainAspectRatio:!1,plugins:{legend:{labels:{color:a,font:{size:12}}}},scales:{x:{ticks:{color:a},grid:{color:o}},y:{ticks:{color:a,stepSize:1},grid:{color:o},beginAtZero:!0}}}})}catch(e){console.warn(`Chart.js failed to load:`,e)}}}async renderTrendChart(){let t=document.getElementById(`score-line-chart`);if(!(!t||!this.playerStats)){this._trendChart?.destroy(),this._trendChart=null;try{let{Chart:n,registerables:r}=await e(async()=>{let{Chart:e,registerables:t}=await import(`./chart-vM59ydkj.js`);return{Chart:e,registerables:t}},[],import.meta.url);n.register(...r);let i=document.documentElement.getAttribute(`data-theme`)!==`light`,a=i?`#94a3b8`:`#64748b`,o=i?`rgba(255,255,255,0.05)`:`rgba(0,0,0,0.05)`;this._trendChart=new n(t,{type:`line`,data:{labels:this.playerStats.scoreTrend.map((e,t)=>`Match ${t+1}`),datasets:[{label:`Score`,data:this.playerStats.scoreTrend.map(e=>e.total),borderColor:`#6366f1`,backgroundColor:`rgba(99, 102, 241, 0.15)`,borderWidth:2,pointBackgroundColor:`#6366f1`,pointRadius:4,fill:!0,tension:.3}]},options:{responsive:!0,maintainAspectRatio:!1,plugins:{legend:{display:!1}},scales:{x:{ticks:{color:a},grid:{color:o}},y:{ticks:{color:a},grid:{color:o}}}}})}catch(e){console.warn(`Chart.js failed to load:`,e)}}}_renderCustomTab(){let e=!!this.customApiKey;return`${`
      <section class="card mb-4" aria-label="Claude API Key">
        <div class="card-header">
          <h2 class="card-title">Claude API Key</h2>
          ${e?`<span class="badge badge-success" style="margin-left:auto">Configured</span>`:``}
        </div>
        <p class="text-sm text-muted mb-3">
          Custom stats are generated by Claude AI and run locally against your data.
          Your key is stored only on this device.
        </p>
        <div class="flex gap-2">
          <input type="password" id="custom-stat-api-key" class="form-input flex-1"
            placeholder="${e?`●●●●●●●●●●●●●●●●`:`sk-ant-...`}"
            value="" autocomplete="off" />
          <button class="btn btn-secondary" id="custom-stat-save-key">Save</button>
          ${e?`<button class="btn btn-ghost btn-sm" id="custom-stat-clear-key" style="color:var(--danger)">Clear</button>`:``}
        </div>
      </section>
    `}${`
      <section class="card mb-4" aria-label="Add custom stat">
        <div class="card-header">
          <h2 class="card-title">Describe a stat</h2>
        </div>
        <textarea id="custom-stat-desc" class="form-input custom-stat-textarea"
          placeholder="e.g. who has the most come-from-behind wins in Phase 10"
          rows="3" ${e?``:`disabled`}></textarea>
        <button class="btn btn-primary mt-3 btn-full" id="custom-stat-generate"
          ${!e||this._customGenerating?`disabled`:``}>
          ${this._customGenerating?`⏳ Generating…`:`✨ Generate Stat`}
        </button>
        ${e?``:`<p class="text-sm text-muted mt-2" style="text-align:center">Add your Claude API key above to generate stats.</p>`}
      </section>
    `}${this.customStats.length===0?`<div class="explorer-empty">No custom stats yet. Describe one above and click Generate.</div>`:this.customStats.map(e=>this._renderCustomStatCard(e,this._evaluatedStats.get(e.id))).join(``)}`}_renderCustomStatCard(e,t){let n=``;return t?t.type===`error`?n=`<div class="custom-stat-error">⚠ ${r(t.message)}</div>`:t.type===`number`?n=`<div class="stat-big-number">${t.value}</div>`:t.type===`text`?n=`<div class="custom-stat-text-result">${r(t.value)}</div>`:t.type===`table`&&(n=`
        <table class="result-table" style="margin-top:0.75rem">
          <tbody>${t.rows.slice(0,10).map((e,t)=>`
        <tr>
          <td class="result-table-rank">${t+1}</td>
          <td>
            ${e.color?`<span class="player-dot" style="background:${e.color}"></span> `:``}
            ${r(e.label)}
          </td>
          <td class="result-table-val"><strong>${e.value}</strong></td>
        </tr>
      `).join(``)}</tbody>
        </table>
      `):n=`<div class="text-sm text-muted">No data yet.</div>`,`
      <section class="card mb-3" aria-label="${r(e.name)}">
        <div class="card-header">
          <div style="flex:1;min-width:0">
            <h3 class="card-title" style="font-size:0.95rem;margin-bottom:0.15rem">${r(e.name)}</h3>
          </div>
          <button class="btn btn-ghost btn-sm custom-stat-delete" data-stat-id="${r(e.id)}"
            aria-label="Delete stat" style="color:var(--danger);flex-shrink:0">🗑</button>
        </div>
        <div class="custom-stat-result">${n}</div>
      </section>
    `}_bindCustomTab(){document.getElementById(`custom-stat-save-key`)?.addEventListener(`click`,()=>{let e=document.getElementById(`custom-stat-api-key`)?.value.trim()??``;e&&(x(e),this.customApiKey=e,this.reRender())}),document.getElementById(`custom-stat-clear-key`)?.addEventListener(`click`,()=>{x(``),this.customApiKey=``,this.reRender()}),document.getElementById(`custom-stat-generate`)?.addEventListener(`click`,async()=>{let e=document.getElementById(`custom-stat-desc`)?.value.trim()??``;if(!e){t(`Describe a stat first`,`error`);return}if(!this.customApiKey){t(`Add your Claude API key first`,`error`);return}this._customGenerating=!0,this.reRender();try{let n=await C(e,this.customApiKey,this.factTable),r={id:Date.now().toString(),name:e.length>60?e.slice(0,57)+`…`:e,description:e,code:n,createdAt:Date.now()};this._evaluatedStats.set(r.id,w(n,this.factTable)),this.customStats=[r,...this.customStats],y(this.customStats),t(`Stat added!`,`success`)}catch(e){t(e instanceof Error?e.message:`Failed to generate stat`,`error`)}finally{this._customGenerating=!1,this.reRender()}}),document.querySelectorAll(`.custom-stat-delete`).forEach(e=>{e.addEventListener(`click`,()=>{let t=e.dataset.statId;t&&(this.customStats=this.customStats.filter(e=>e.id!==t),this._evaluatedStats.delete(t),y(this.customStats),this.reRender())})})}reRender(){this.teardown();let e=document.getElementById(`view-container`);e&&(e.innerHTML=this.render(),this.afterRender())}};export{E as Stats};