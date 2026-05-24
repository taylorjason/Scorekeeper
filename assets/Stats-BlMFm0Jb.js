import{d as e,y as t}from"./index-DCbQaupu.js";import{n,r,t as i}from"./stats-BVAHefdb.js";var a=class{players=[];games=[];selectedPlayerId=null;leaderboard=[];playerStats=null;async load(){let[e,i,a]=await Promise.all([t.players.toArray(),t.games.toArray(),n()]);this.players=e.filter(e=>e.active),this.games=i,this.leaderboard=a,this.selectedPlayerId===null&&this.players.length>0&&(this.selectedPlayerId=this.players[0].id),this.selectedPlayerId!==null&&(this.playerStats=await r(this.selectedPlayerId))}escHtml(e){return e.replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`)}render(){let e=this.players.map(e=>`
      <button class="tab-btn ${this.selectedPlayerId===e.id?`active`:``}"
        data-player-id="${e.id}" aria-selected="${this.selectedPlayerId===e.id}"
        aria-label="${this.escHtml(e.displayName)}">
        <span class="player-dot" style="background:${e.color}"></span>
        ${this.escHtml(e.displayName)}
      </button>
    `).join(``),t=this.playerStats,n=``;if(t&&this.selectedPlayerId!==null){let e=this.players.find(e=>e.id===this.selectedPlayerId);n=`
        <section class="card mb-4" aria-labelledby="player-stats-heading">
          <div class="card-header">
            <h2 class="card-title" id="player-stats-heading">
              ${e?`<span class="player-dot" style="background:${e.color}; margin-right:6px"></span>`:``}
              ${e?this.escHtml(e.displayName):`Player`} Stats
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
                <tr>
                  <th>Game</th>
                  <th>Played</th>
                  <th>Wins</th>
                  <th>Avg Score</th>
                </tr>
              </thead>
              <tbody>
                ${t.gameBreakdown.map(e=>`
                  <tr>
                    <td>${this.escHtml(e.gameName)}</td>
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
      `}let r=this.leaderboard.length===0?`<div class="text-sm text-muted" style="padding:1rem 0">No games played yet</div>`:`
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
            ${this.leaderboard.map((e,t)=>`
              <tr class="${this.selectedPlayerId===e.player.id?`highlighted-row`:``}">
                <td>
                  ${t===0?`🥇`:t===1?`🥈`:t===2?`🥉`:t+1}
                </td>
                <td>
                  <div class="flex items-center gap-2">
                    <span class="player-dot" style="background:${e.player.color}"></span>
                    <button class="btn btn-ghost btn-sm" style="padding:0; min-height:auto; font-size:0.9rem"
                      data-player-id="${e.player.id}">${this.escHtml(e.player.displayName)}</button>
                  </div>
                </td>
                <td><strong>${e.wins}</strong></td>
                <td>${e.gamesPlayed}</td>
                <td>${e.winRate}%</td>
              </tr>
            `).join(``)}
          </tbody>
        </table>
      `,i=this.games.length>0?`
      <section class="card mb-4" aria-labelledby="game-stats-heading">
        <h2 class="card-title mb-3" id="game-stats-heading">Game Overview</h2>
        <div id="game-stats-list">
          ${this.games.map(e=>`
            <div class="flex items-center gap-3 mb-2" style="padding: 0.5rem 0; border-bottom: 1px solid var(--border)">
              <div class="flex-1">
                <div class="font-semibold text-sm">${this.escHtml(e.name)}</div>
                <div class="text-xs text-muted">${e.scoringMode} scoring</div>
              </div>
              <span id="game-match-count-${e.id}" class="badge badge-muted text-xs">Loading...</span>
            </div>
          `).join(``)}
        </div>
      </section>
    `:``;return`
      <main class="view" aria-label="Statistics">
        <header class="page-header">
          <h1 class="page-title">Statistics</h1>
        </header>

        <section class="mb-4" aria-label="Player tabs">
          <div class="section-title mb-2">Select Player</div>
          <div class="tabs" role="tablist" aria-label="Player selection">
            ${e}
          </div>
        </section>

        <div id="player-stats-section">
          ${n}
        </div>

        <section class="card mb-4" aria-labelledby="leaderboard-heading">
          <h2 class="card-title mb-3" id="leaderboard-heading">Overall Leaderboard</h2>
          ${r}
        </section>

        ${i}
      </main>
    `}async afterRender(){this.playerStats&&this.playerStats.gameBreakdown.length>0&&await this.renderWinsChart(),this.playerStats&&this.playerStats.scoreTrend.length>1&&await this.renderTrendChart();for(let e of this.games)this.loadGameStats(e);document.querySelectorAll(`[data-player-id]`).forEach(e=>{e.addEventListener(`click`,async()=>{let t=parseInt(e.dataset.playerId??``,10);isNaN(t)||(this.selectedPlayerId=t,this.playerStats=await r(t),this.reRender())})})}async loadGameStats(e){try{let t=await i(e.id),n=document.getElementById(`game-match-count-${e.id}`);n&&(n.textContent=`${t.totalMatches} match${t.totalMatches===1?``:`es`}`)}catch{}}async renderWinsChart(){let t=document.getElementById(`wins-bar-chart`);if(!(!t||!this.playerStats))try{let{Chart:n,registerables:r}=await e(async()=>{let{Chart:e,registerables:t}=await import(`./chart-vM59ydkj.js`);return{Chart:e,registerables:t}},[],import.meta.url);n.register(...r);let i=this.playerStats.gameBreakdown.map(e=>e.gameName),a=this.playerStats.gameBreakdown.map(e=>e.wins),o=this.playerStats.gameBreakdown.map(e=>e.losses),s=document.documentElement.getAttribute(`data-theme`)!==`light`,c=s?`#94a3b8`:`#64748b`,l=s?`rgba(255,255,255,0.05)`:`rgba(0,0,0,0.05)`;new n(t,{type:`bar`,data:{labels:i,datasets:[{label:`Wins`,data:a,backgroundColor:`rgba(16, 185, 129, 0.7)`,borderColor:`#10b981`,borderWidth:1,borderRadius:6},{label:`Losses`,data:o,backgroundColor:`rgba(239, 68, 68, 0.5)`,borderColor:`#ef4444`,borderWidth:1,borderRadius:6}]},options:{responsive:!0,maintainAspectRatio:!1,plugins:{legend:{labels:{color:c,font:{size:12}}}},scales:{x:{ticks:{color:c},grid:{color:l}},y:{beginAtZero:!0,ticks:{color:c,stepSize:1},grid:{color:l}}}}})}catch(e){console.warn(`Chart.js failed to load:`,e)}}async renderTrendChart(){let t=document.getElementById(`score-line-chart`);if(!(!t||!this.playerStats))try{let{Chart:n,registerables:r}=await e(async()=>{let{Chart:e,registerables:t}=await import(`./chart-vM59ydkj.js`);return{Chart:e,registerables:t}},[],import.meta.url);n.register(...r);let i=this.playerStats.scoreTrend,a=i.map((e,t)=>`Match ${t+1}`),o=i.map(e=>e.total),s=document.documentElement.getAttribute(`data-theme`)!==`light`,c=s?`#94a3b8`:`#64748b`,l=s?`rgba(255,255,255,0.05)`:`rgba(0,0,0,0.05)`;new n(t,{type:`line`,data:{labels:a,datasets:[{label:`Score`,data:o,borderColor:`#6366f1`,backgroundColor:`rgba(99, 102, 241, 0.15)`,borderWidth:2,pointBackgroundColor:`#6366f1`,pointRadius:4,fill:!0,tension:.3}]},options:{responsive:!0,maintainAspectRatio:!1,plugins:{legend:{display:!1}},scales:{x:{ticks:{color:c},grid:{color:l}},y:{ticks:{color:c},grid:{color:l}}}}})}catch(e){console.warn(`Chart.js failed to load:`,e)}}reRender(){let e=document.getElementById(`view-container`);e&&(e.innerHTML=this.render(),this.afterRender())}};export{a as Stats};