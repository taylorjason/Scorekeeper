import{d as e,y as t}from"./index-D67e1Pnr.js";import{n,r,t as i}from"./utils-BZltm_RL.js";import{n as a,r as o,t as s}from"./stats-D8yhUiaD.js";async function c(){let[e,n,r,a]=await Promise.all([t.matches.where(`status`).equals(`completed`).toArray(),t.players.toArray(),t.games.toArray(),t.gameNights.toArray()]),o=new Map(n.map(e=>[e.id,e])),s=new Map(r.map(e=>[e.id,e])),c=new Map(a.map(e=>[e.id,e])),l=e.map(e=>e.id),u=l.length>0?await t.scoreEntries.where(`matchId`).anyOf(l).toArray():[],d=new Map;for(let e of u){let t=d.get(e.matchId)??[];t.push(e),d.set(e.matchId,t)}let f=[];for(let t of e){let e=s.get(t.gameId),n=c.get(t.gameNightId);if(!e||!n)continue;let r=d.get(t.id)??[],a=i(r,t.createdAt);for(let i of r){let r=o.get(i.playerId);if(!r)continue;let s=i.note===`first_out`;if(!s&&i.note)try{JSON.parse(i.note).firstOut&&(s=!0)}catch{}f.push({entryId:i.id,playerId:i.playerId,playerName:r.displayName,playerColor:r.color,matchId:t.id,gameId:t.gameId,gameName:e.name,nightId:t.gameNightId,nightDate:n.date,roundNumber:i.roundNumber,value:i.value,note:i.note,entryCreatedAt:i.createdAt,isFirstOut:s,isWinner:t.winnerId===i.playerId,roundDuration:a.get(i.roundNumber)})}}return f}function l(e,t){let n=e;if(t.filters.playerIds.length>0){let e=new Set(t.filters.playerIds);n=n.filter(t=>e.has(t.playerId))}if(t.filters.gameIds.length>0){let e=new Set(t.filters.gameIds);n=n.filter(t=>e.has(t.gameId))}if(t.filters.dateFrom&&(n=n.filter(e=>e.nightDate>=t.filters.dateFrom)),t.field===`roundDuration`){let e=new Set;n=n.filter(t=>{let n=`${t.matchId}:${t.roundNumber}`;return e.has(n)?!1:(e.add(n),!0)})}if(t.field===`isWin`){let e=new Set;n=n.filter(t=>{let n=`${t.matchId}:${t.playerId}`;return e.has(n)?!1:(e.add(n),!0)})}let r=new Map,i=e=>{switch(t.groupBy){case`player`:return{key:String(e.playerId),label:e.playerName,color:e.playerColor};case`game`:return{key:String(e.gameId),label:e.gameName};case`month`:return{key:e.nightDate.slice(0,7),label:e.nightDate.slice(0,7)};default:return{key:`all`,label:`All`}}};for(let e of n){let n;switch(t.field){case`value`:n=e.value;break;case`roundDuration`:n=e.roundDuration;break;case`isFirstOut`:n=e.isFirstOut?1:void 0;break;case`isWin`:n=e.isWinner?1:void 0;break}if(n===void 0)continue;let{key:a,label:o,color:s}=i(e),c=r.get(a)??{label:o,color:s,values:[]};c.values.push(n),r.set(a,c)}let a=(e,t)=>{if(e.length===0)return 0;switch(t){case`count`:return e.length;case`sum`:return e.reduce((e,t)=>e+t,0);case`avg`:return Math.round(e.reduce((e,t)=>e+t,0)/e.length);case`min`:return Math.min(...e);case`max`:return Math.max(...e)}},o=[];for(let[,e]of r.entries())o.push({label:e.label,value:a(e.values,t.metric),color:e.color,sampleSize:e.values.length});let s=t.metric===`min`||t.field===`roundDuration`;return o.sort((e,t)=>s?e.value-t.value:t.value-e.value),o}function u(e){if(!e)return``;let t=new Date;switch(e){case`30d`:t.setDate(t.getDate()-30);break;case`3mo`:t.setMonth(t.getMonth()-3);break;case`6mo`:t.setMonth(t.getMonth()-6);break;case`1yr`:t.setFullYear(t.getFullYear()-1);break;default:return``}return t.toISOString().slice(0,10)}function d(e,t){let n={value:`Round Score`,roundDuration:`Round Duration`,isFirstOut:`First-Out Events`,isWin:`Wins`};return(e===`isFirstOut`||e===`isWin`)&&t===`count`?n[e]:`${{count:`Count of`,sum:`Total`,avg:`Average`,min:`Shortest`,max:`Longest`}[t]} ${n[e]}`}var f=[{id:`first-out`,label:`⚡ First-Out Leaders`,query:{metric:`count`,field:`isFirstOut`,filters:{playerIds:[],gameIds:[],dateFrom:``},groupBy:`player`}},{id:`fastest`,label:`⏱ Fastest Rounds`,query:{metric:`min`,field:`roundDuration`,filters:{playerIds:[],gameIds:[],dateFrom:``},groupBy:`game`}},{id:`avg-score`,label:`📊 Avg Round Score`,query:{metric:`avg`,field:`value`,filters:{playerIds:[],gameIds:[],dateFrom:``},groupBy:`player`}},{id:`wins`,label:`🏆 Win Leaders`,query:{metric:`count`,field:`isWin`,filters:{playerIds:[],gameIds:[],dateFrom:``},groupBy:`player`}},{id:`monthly`,label:`📅 Last 3 Months`,query:{metric:`count`,field:`isWin`,filters:{playerIds:[],gameIds:[],dateFrom:u(`3mo`)},groupBy:`month`}}],p=class{players=[];games=[];selectedPlayerId=null;leaderboard=[];playerStats=null;activeMainTab=`overview`;factTable=[];currentQuery=f[0].query;queryResults=null;_winsChart=null;_trendChart=null;_explorerChart=null;async load(){let[e,n,r,i]=await Promise.all([t.players.toArray(),t.games.toArray(),a(),c()]);this.players=e.filter(e=>e.active),this.games=n,this.leaderboard=r,this.factTable=i,this.selectedPlayerId===null&&this.players.length>0&&(this.selectedPlayerId=this.players[0].id),this.selectedPlayerId!==null&&(this.playerStats=await o(this.selectedPlayerId))}render(){let e=this._renderOverview();return`
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
        </div>

        <div id="stats-panel-overview" role="tabpanel" aria-labelledby="stats-tab-overview"
          ${this.activeMainTab===`overview`?``:`hidden`}>
          ${e}
        </div>

        <div id="stats-panel-explorer" role="tabpanel" aria-labelledby="stats-tab-explorer"
          ${this.activeMainTab===`explorer`?``:`hidden`}>
          ${this._renderExplorerTab()}
        </div>
      </main>
    `}_renderOverview(){let e=this.players.map(e=>`
      <button class="tab-btn ${this.selectedPlayerId===e.id?`active`:``}"
        data-player-id="${e.id}" aria-selected="${this.selectedPlayerId===e.id}"
        aria-label="${n(e.displayName)}">
        <span class="player-dot" style="background:${e.color}"></span>
        ${n(e.displayName)}
      </button>
    `).join(``),t=this.playerStats,r=``;if(t&&this.selectedPlayerId!==null){let e=this.players.find(e=>e.id===this.selectedPlayerId);r=`
        <section class="card mb-4" aria-labelledby="player-stats-heading">
          <div class="card-header">
            <h2 class="card-title" id="player-stats-heading">
              ${e?`<span class="player-dot" style="background:${e.color}; margin-right:6px"></span>`:``}
              ${e?n(e.displayName):`Player`} Stats
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
                    <td>${n(e.gameName)}</td>
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
                      data-player-id="${e.player.id}">${n(e.player.displayName)}</button>
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
                <div class="font-semibold text-sm">${n(e.name)}</div>
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

      <div id="player-stats-section">${r}</div>

      <section class="card mb-4" aria-labelledby="leaderboard-heading">
        <h2 class="card-title mb-3" id="leaderboard-heading">Overall Leaderboard</h2>
        ${i}
      </section>

      ${a}
    `}_renderExplorerTab(){let e=this.currentQuery,t=f.map(e=>`<button class="quick-insight-btn" data-insight="${e.id}">${e.label}</button>`).join(``),r=`<option value="">All Players</option>`+this.players.map(t=>`<option value="${t.id}" ${e.filters.playerIds[0]===t.id?`selected`:``}>${n(t.displayName)}</option>`).join(``),i=`<option value="">All Games</option>`+this.games.map(t=>`<option value="${t.id}" ${e.filters.gameIds[0]===t.id?`selected`:``}>${n(t.name)}</option>`).join(``),a=[{value:``,label:`All time`},{value:`30d`,label:`Last 30 days`},{value:`3mo`,label:`Last 3 months`},{value:`6mo`,label:`Last 6 months`},{value:`1yr`,label:`This year`}],o=a.find(t=>t.value!==``&&u(t.value)===e.filters.dateFrom)?.value??``,s=a.map(e=>`<option value="${e.value}" ${o===e.value?`selected`:``}>${e.label}</option>`).join(``),c=[{value:`value`,label:`Round Score`},{value:`roundDuration`,label:`Round Duration`},{value:`isFirstOut`,label:`First-Out Events`},{value:`isWin`,label:`Wins`}].map(t=>`<option value="${t.value}" ${e.field===t.value?`selected`:``}>${t.label}</option>`).join(``);return`
      <div class="explorer-wrap">
        <section class="mb-4" aria-label="Quick insights">
          <div class="section-title mb-2">Quick Insights</div>
          <div class="quick-insights-row" role="group" aria-label="Quick insight shortcuts">
            ${t}
          </div>
        </section>

        <section class="query-builder card mb-4" aria-label="Custom query builder">
          <div class="card-header">
            <h2 class="card-title">Custom Query</h2>
          </div>
          <div class="qb-row">
            <label class="qb-label" for="qb-metric">Show me</label>
            <select class="form-select qb-select" id="qb-metric">${[{value:`count`,label:`Count`},{value:`avg`,label:`Average`},{value:`sum`,label:`Total`},{value:`min`,label:`Minimum`},{value:`max`,label:`Maximum`}].map(t=>`<option value="${t.value}" ${e.metric===t.value?`selected`:``}>${t.label}</option>`).join(``)}</select>
            <span class="qb-of">of</span>
            <select class="form-select qb-select" id="qb-field">${c}</select>
          </div>
          <div class="qb-row">
            <label class="qb-label" for="qb-player">Player</label>
            <select class="form-select qb-select" id="qb-player">${r}</select>
          </div>
          <div class="qb-row">
            <label class="qb-label" for="qb-game">Game</label>
            <select class="form-select qb-select" id="qb-game">${i}</select>
          </div>
          <div class="qb-row">
            <label class="qb-label" for="qb-date">Date</label>
            <select class="form-select qb-select" id="qb-date">${s}</select>
          </div>
          <div class="qb-row">
            <label class="qb-label" for="qb-groupby">Group by</label>
            <select class="form-select qb-select" id="qb-groupby">${[{value:`none`,label:`None (single value)`},{value:`player`,label:`By Player`},{value:`game`,label:`By Game`},{value:`month`,label:`By Month`}].map(t=>`<option value="${t.value}" ${e.groupBy===t.value?`selected`:``}>${t.label}</option>`).join(``)}</select>
          </div>
          <button class="btn btn-primary mt-3 btn-full" id="qb-run-btn">▶ Run Query</button>
        </section>

        <div id="explorer-results">${this._renderQueryResults()}</div>
      </div>
    `}_renderQueryResults(){if(this.queryResults===null)return`<div class="explorer-empty">Pick an insight above or configure a query and click Run.</div>`;if(this.queryResults.length===0)return`<div class="explorer-empty">No data for these filters — try broadening the date range or removing filters.</div>`;let e=this.currentQuery,t=e.field===`roundDuration`,i=d(e.field,e.metric),a=e=>t?r(e):String(e);if(e.groupBy===`none`){let e=this.queryResults[0];return`
        <section class="card" aria-label="Query result">
          <div class="card-header"><h2 class="card-title">${n(i)}</h2></div>
          <div class="stat-big-number">${a(e.value)}</div>
          <div class="text-sm text-muted" style="text-align:center">${e.sampleSize} data point${e.sampleSize===1?``:`s`}</div>
        </section>
      `}let o=this.queryResults.map((e,t)=>`
      <tr>
        <td class="result-table-rank">${t+1}</td>
        <td>
          ${e.color?`<span class="player-dot" style="background:${e.color}"></span> `:``}
          ${n(e.label)}
        </td>
        <td class="result-table-val"><strong>${a(e.value)}</strong></td>
        <td class="result-table-n text-muted">${e.sampleSize}</td>
      </tr>
    `).join(``),s=Math.max(180,this.queryResults.length*36+48),c=e.groupBy===`player`?`Player`:e.groupBy===`game`?`Game`:`Month`;return`
      <section class="card" aria-label="Query results">
        <div class="card-header"><h2 class="card-title">${n(i)}</h2></div>
        <div class="chart-container" style="height:${s}px">
          <canvas id="explorer-chart" aria-label="${n(i)} chart" role="img"></canvas>
        </div>
        <table class="result-table" aria-label="${n(i)} data table">
          <thead>
            <tr><th>#</th><th>${c}</th><th>Value</th><th title="Sample size">n</th></tr>
          </thead>
          <tbody>${o}</tbody>
        </table>
      </section>
    `}async afterRender(){if(document.getElementById(`stats-tab-overview`)?.addEventListener(`click`,()=>{this.activeMainTab!==`overview`&&(this.activeMainTab=`overview`,this.reRender())}),document.getElementById(`stats-tab-explorer`)?.addEventListener(`click`,()=>{this.activeMainTab!==`explorer`&&(this.activeMainTab=`explorer`,this.reRender())}),this.activeMainTab===`overview`){this.playerStats?.gameBreakdown.length&&await this.renderWinsChart(),this.playerStats&&this.playerStats.scoreTrend.length>1&&await this.renderTrendChart();for(let e of this.games)this.loadGameStats(e);document.querySelectorAll(`[data-player-id]`).forEach(e=>{e.addEventListener(`click`,async()=>{let t=parseInt(e.dataset.playerId??``,10);isNaN(t)||(this.selectedPlayerId=t,this.playerStats=await o(t),this.reRender())})})}else this._bindExplorer(),this.queryResults?.length&&this.currentQuery.groupBy!==`none`&&await this.renderExplorerChart()}_bindExplorer(){document.querySelectorAll(`.quick-insight-btn`).forEach(e=>{e.addEventListener(`click`,()=>{let t=f.find(t=>t.id===e.dataset.insight);t&&(this.currentQuery={...t.query},this.queryResults=l(this.factTable,this.currentQuery),this.reRender())})}),document.getElementById(`qb-run-btn`)?.addEventListener(`click`,()=>{this._readFormAndRun()})}_readFormAndRun(){let e=document.getElementById(`qb-metric`)?.value??`count`,t=document.getElementById(`qb-field`)?.value??`value`,n=document.getElementById(`qb-groupby`)?.value??`none`,r=document.getElementById(`qb-player`)?.value??``,i=document.getElementById(`qb-game`)?.value??``,a=document.getElementById(`qb-date`)?.value??``;this.currentQuery={metric:e,field:t,groupBy:n,filters:{playerIds:r?[parseInt(r,10)]:[],gameIds:i?[parseInt(i,10)]:[],dateFrom:u(a)}},this.queryResults=l(this.factTable,this.currentQuery),this.reRender()}async renderExplorerChart(){let t=document.getElementById(`explorer-chart`);if(!(!t||!this.queryResults?.length)){this._explorerChart?.destroy(),this._explorerChart=null;try{let{Chart:n,registerables:i}=await e(async()=>{let{Chart:e,registerables:t}=await import(`./chart-vM59ydkj.js`);return{Chart:e,registerables:t}},[],import.meta.url);n.register(...i);let a=this.currentQuery,o=a.field===`roundDuration`,s=document.documentElement.getAttribute(`data-theme`)!==`light`,c=s?`#94a3b8`:`#64748b`,l=s?`rgba(255,255,255,0.05)`:`rgba(0,0,0,0.05)`,u=this.queryResults.map(e=>e.label),f=this.queryResults.map(e=>e.value),p=this.queryResults.map(e=>e.color??`#6366f1`),m=o?{callback:e=>r(Number(e))}:{};a.groupBy===`month`?this._explorerChart=new n(t,{type:`line`,data:{labels:u,datasets:[{label:d(a.field,a.metric),data:f,borderColor:`#6366f1`,backgroundColor:`rgba(99,102,241,0.15)`,borderWidth:2,pointRadius:4,fill:!0,tension:.3}]},options:{responsive:!0,maintainAspectRatio:!1,plugins:{legend:{display:!1}},scales:{x:{ticks:{color:c},grid:{color:l}},y:{ticks:{color:c,...m},grid:{color:l}}}}}):this._explorerChart=new n(t,{type:`bar`,data:{labels:u,datasets:[{label:d(a.field,a.metric),data:f,backgroundColor:p.map(e=>e+`cc`),borderColor:p,borderWidth:1,borderRadius:4}]},options:{indexAxis:`y`,responsive:!0,maintainAspectRatio:!1,plugins:{legend:{display:!1}},scales:{x:{ticks:{color:c,...m},grid:{color:l}},y:{ticks:{color:c},grid:{color:l}}}}})}catch(e){console.warn(`Chart.js failed to load:`,e)}}}teardown(){this._winsChart?.destroy(),this._winsChart=null,this._trendChart?.destroy(),this._trendChart=null,this._explorerChart?.destroy(),this._explorerChart=null}async loadGameStats(e){try{let t=await s(e.id),n=document.getElementById(`game-match-count-${e.id}`);n&&(n.textContent=`${t.totalMatches} match${t.totalMatches===1?``:`es`}`)}catch{}}async renderWinsChart(){let t=document.getElementById(`wins-bar-chart`);if(!(!t||!this.playerStats)){this._winsChart?.destroy(),this._winsChart=null;try{let{Chart:n,registerables:r}=await e(async()=>{let{Chart:e,registerables:t}=await import(`./chart-vM59ydkj.js`);return{Chart:e,registerables:t}},[],import.meta.url);n.register(...r);let i=document.documentElement.getAttribute(`data-theme`)!==`light`,a=i?`#94a3b8`:`#64748b`,o=i?`rgba(255,255,255,0.05)`:`rgba(0,0,0,0.05)`;this._winsChart=new n(t,{type:`bar`,data:{labels:this.playerStats.gameBreakdown.map(e=>e.gameName),datasets:[{label:`Wins`,data:this.playerStats.gameBreakdown.map(e=>e.wins),backgroundColor:`rgba(16,185,129,0.8)`,borderColor:`#10b981`,borderWidth:1,borderRadius:4},{label:`Losses`,data:this.playerStats.gameBreakdown.map(e=>e.losses),backgroundColor:`rgba(239,68,68,0.8)`,borderColor:`#ef4444`,borderWidth:1,borderRadius:4}]},options:{responsive:!0,maintainAspectRatio:!1,plugins:{legend:{labels:{color:a,font:{size:12}}}},scales:{x:{ticks:{color:a},grid:{color:o}},y:{ticks:{color:a,stepSize:1},grid:{color:o},beginAtZero:!0}}}})}catch(e){console.warn(`Chart.js failed to load:`,e)}}}async renderTrendChart(){let t=document.getElementById(`score-line-chart`);if(!(!t||!this.playerStats)){this._trendChart?.destroy(),this._trendChart=null;try{let{Chart:n,registerables:r}=await e(async()=>{let{Chart:e,registerables:t}=await import(`./chart-vM59ydkj.js`);return{Chart:e,registerables:t}},[],import.meta.url);n.register(...r);let i=document.documentElement.getAttribute(`data-theme`)!==`light`,a=i?`#94a3b8`:`#64748b`,o=i?`rgba(255,255,255,0.05)`:`rgba(0,0,0,0.05)`;this._trendChart=new n(t,{type:`line`,data:{labels:this.playerStats.scoreTrend.map((e,t)=>`Match ${t+1}`),datasets:[{label:`Score`,data:this.playerStats.scoreTrend.map(e=>e.total),borderColor:`#6366f1`,backgroundColor:`rgba(99, 102, 241, 0.15)`,borderWidth:2,pointBackgroundColor:`#6366f1`,pointRadius:4,fill:!0,tension:.3}]},options:{responsive:!0,maintainAspectRatio:!1,plugins:{legend:{display:!1}},scales:{x:{ticks:{color:a},grid:{color:o}},y:{ticks:{color:a},grid:{color:o}}}}})}catch(e){console.warn(`Chart.js failed to load:`,e)}}}reRender(){this.teardown();let e=document.getElementById(`view-container`);e&&(e.innerHTML=this.render(),this.afterRender())}};export{p as Stats};