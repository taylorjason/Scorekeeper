var p=Object.defineProperty;var v=(d,t,a)=>t in d?p(d,t,{enumerable:!0,configurable:!0,writable:!0,value:a}):d[t]=a;var c=(d,t,a)=>v(d,typeof t!="symbol"?t+"":t,a);import{h as b,_ as g}from"./index-CGen8vRM.js";import{c as u,a as y,b as $}from"./stats-CNxwKS_N.js";class P{constructor(){c(this,"players",[]);c(this,"games",[]);c(this,"selectedPlayerId",null);c(this,"leaderboard",[]);c(this,"playerStats",null)}async load(){const[t,a,l]=await Promise.all([b.players.toArray(),b.games.toArray(),u()]);this.players=t.filter(i=>i.active),this.games=a,this.leaderboard=l,this.selectedPlayerId===null&&this.players.length>0&&(this.selectedPlayerId=this.players[0].id),this.selectedPlayerId!==null&&(this.playerStats=await y(this.selectedPlayerId))}escHtml(t){return t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}render(){const t=this.players.map(e=>`
      <button class="tab-btn ${this.selectedPlayerId===e.id?"active":""}"
        data-player-id="${e.id}" aria-selected="${this.selectedPlayerId===e.id}"
        aria-label="${this.escHtml(e.displayName)}">
        <span class="player-dot" style="background:${e.color}"></span>
        ${this.escHtml(e.displayName)}
      </button>
    `).join(""),a=this.playerStats;let l="";if(a&&this.selectedPlayerId!==null){const e=this.players.find(s=>s.id===this.selectedPlayerId);l=`
        <section class="card mb-4" aria-labelledby="player-stats-heading">
          <div class="card-header">
            <h2 class="card-title" id="player-stats-heading">
              ${e?`<span class="player-dot" style="background:${e.color}; margin-right:6px"></span>`:""}
              ${e?this.escHtml(e.displayName):"Player"} Stats
            </h2>
          </div>
          <div class="stat-grid">
            <div class="stat-card">
              <div class="stat-value" style="color:var(--success)">${a.wins}</div>
              <div class="stat-label">Wins</div>
            </div>
            <div class="stat-card">
              <div class="stat-value" style="color:var(--danger)">${a.losses}</div>
              <div class="stat-label">Losses</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${a.winRate}%</div>
              <div class="stat-label">Win Rate</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${a.avgScore}</div>
              <div class="stat-label">Avg Score</div>
            </div>
          </div>
          <div class="text-sm text-muted" style="margin-top:0.25rem">${a.gamesPlayed} matches played</div>
        </section>

        ${a.gameBreakdown.length>0?`
          <section class="card mb-4" aria-labelledby="wins-chart-heading">
            <h2 class="card-title mb-3" id="wins-chart-heading">Wins by Game</h2>
            <div class="chart-container">
              <canvas id="wins-bar-chart" aria-label="Bar chart of wins by game" role="img"></canvas>
            </div>
          </section>
        `:""}

        ${a.scoreTrend.length>1?`
          <section class="card mb-4" aria-labelledby="trend-chart-heading">
            <h2 class="card-title mb-3" id="trend-chart-heading">Score Trend (Last 10)</h2>
            <div class="chart-container">
              <canvas id="score-line-chart" aria-label="Line chart of score trend" role="img"></canvas>
            </div>
          </section>
        `:""}

        ${a.gameBreakdown.length>0?`
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
                ${a.gameBreakdown.map(s=>`
                  <tr>
                    <td>${this.escHtml(s.gameName)}</td>
                    <td>${s.gamesPlayed}</td>
                    <td>${s.wins}</td>
                    <td>${s.avgScore}</td>
                  </tr>
                `).join("")}
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
      `}const i=this.leaderboard.length===0?'<div class="text-sm text-muted" style="padding:1rem 0">No games played yet</div>':`
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
            ${this.leaderboard.map((e,s)=>`
              <tr class="${this.selectedPlayerId===e.player.id?"highlighted-row":""}">
                <td>
                  ${s===0?"🥇":s===1?"🥈":s===2?"🥉":s+1}
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
            `).join("")}
          </tbody>
        </table>
      `,n=this.games.length>0?`
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
          `).join("")}
        </div>
      </section>
    `:"";return`
      <main class="view" aria-label="Statistics">
        <header class="page-header">
          <h1 class="page-title">Statistics</h1>
        </header>

        <section class="mb-4" aria-label="Player tabs">
          <div class="section-title mb-2">Select Player</div>
          <div class="tabs" role="tablist" aria-label="Player selection">
            ${t}
          </div>
        </section>

        <div id="player-stats-section">
          ${l}
        </div>

        <section class="card mb-4" aria-labelledby="leaderboard-heading">
          <h2 class="card-title mb-3" id="leaderboard-heading">Overall Leaderboard</h2>
          ${i}
        </section>

        ${n}
      </main>
    `}async afterRender(){this.playerStats&&this.playerStats.gameBreakdown.length>0&&await this.renderWinsChart(),this.playerStats&&this.playerStats.scoreTrend.length>1&&await this.renderTrendChart();for(const t of this.games)this.loadGameStats(t);document.querySelectorAll("[data-player-id]").forEach(t=>{t.addEventListener("click",async()=>{const a=parseInt(t.dataset.playerId??"",10);isNaN(a)||(this.selectedPlayerId=a,this.playerStats=await y(a),this.reRender())})})}async loadGameStats(t){try{const a=await $(t.id),l=document.getElementById(`game-match-count-${t.id}`);l&&(l.textContent=`${a.totalMatches} match${a.totalMatches!==1?"es":""}`)}catch{}}async renderWinsChart(){const t=document.getElementById("wins-bar-chart");if(!(!t||!this.playerStats))try{const{Chart:a,registerables:l}=await g(async()=>{const{Chart:r,registerables:m}=await import("./chart-CXLAvRhu.js");return{Chart:r,registerables:m}},[],import.meta.url);a.register(...l);const i=this.playerStats.gameBreakdown.map(r=>r.gameName),n=this.playerStats.gameBreakdown.map(r=>r.wins),e=this.playerStats.gameBreakdown.map(r=>r.losses),s=document.documentElement.getAttribute("data-theme")!=="light",o=s?"#94a3b8":"#64748b",h=s?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.05)";new a(t,{type:"bar",data:{labels:i,datasets:[{label:"Wins",data:n,backgroundColor:"rgba(16, 185, 129, 0.7)",borderColor:"#10b981",borderWidth:1,borderRadius:6},{label:"Losses",data:e,backgroundColor:"rgba(239, 68, 68, 0.5)",borderColor:"#ef4444",borderWidth:1,borderRadius:6}]},options:{responsive:!0,maintainAspectRatio:!1,plugins:{legend:{labels:{color:o,font:{size:12}}}},scales:{x:{ticks:{color:o},grid:{color:h}},y:{beginAtZero:!0,ticks:{color:o,stepSize:1},grid:{color:h}}}}})}catch(a){console.warn("Chart.js failed to load:",a)}}async renderTrendChart(){const t=document.getElementById("score-line-chart");if(!(!t||!this.playerStats))try{const{Chart:a,registerables:l}=await g(async()=>{const{Chart:r,registerables:m}=await import("./chart-CXLAvRhu.js");return{Chart:r,registerables:m}},[],import.meta.url);a.register(...l);const i=this.playerStats.scoreTrend,n=i.map((r,m)=>`Match ${m+1}`),e=i.map(r=>r.total),s=document.documentElement.getAttribute("data-theme")!=="light",o=s?"#94a3b8":"#64748b",h=s?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.05)";new a(t,{type:"line",data:{labels:n,datasets:[{label:"Score",data:e,borderColor:"#6366f1",backgroundColor:"rgba(99, 102, 241, 0.15)",borderWidth:2,pointBackgroundColor:"#6366f1",pointRadius:4,fill:!0,tension:.3}]},options:{responsive:!0,maintainAspectRatio:!1,plugins:{legend:{display:!1}},scales:{x:{ticks:{color:o},grid:{color:h}},y:{ticks:{color:o},grid:{color:h}}}}})}catch(a){console.warn("Chart.js failed to load:",a)}}reRender(){const t=document.getElementById("view-container");t&&(t.innerHTML=this.render(),this.afterRender())}}export{P as Stats};
