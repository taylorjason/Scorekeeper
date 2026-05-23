var h=Object.defineProperty;var m=(d,t,e)=>t in d?h(d,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):d[t]=e;var n=(d,t,e)=>m(d,typeof t!="symbol"?t+"":t,e);import{g,a as b,n as l}from"./index-Crbsirou.js";import{c as v}from"./stats-Cl3Ax1s6.js";class f{constructor(){n(this,"gameNights",[]);n(this,"leaderboard",[]);n(this,"activeMatch")}async load(){const[t,e,s]=await Promise.all([g(),v(),b()]);this.gameNights=t.slice(0,3),this.leaderboard=e.slice(0,5),this.activeMatch=s}formatDate(t){const e=new Date(t+"T00:00:00"),i=Math.floor((new Date().getTime()-e.getTime())/864e5);return i===0?"Today":i===1?"Yesterday":i<7?`${i} days ago`:e.toLocaleDateString("en-US",{month:"short",day:"numeric",year:i>365?"numeric":void 0})}rankIcon(t){return t===1?"🥇":t===2?"🥈":t===3?"🥉":`<span class="rank-number">${t}</span>`}render(){const t=new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"});let e="";this.activeMatch&&(e=`
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
      `);let s="";this.gameNights.length===0?s=`
        <div class="empty-state" style="padding: 1.5rem 0">
          <div class="empty-state-icon">🎲</div>
          <div class="empty-state-title">No game nights yet</div>
          <p>Start your first game night!</p>
        </div>
      `:s=this.gameNights.map(a=>`
        <div class="card card-clickable mb-3 night-card" data-night-id="${a.id}" role="button" aria-label="Open ${a.title}">
          <div class="flex items-center gap-3">
            <div>
              <div class="history-date">${this.formatDate(a.date)}</div>
              <div class="font-semibold">${this.escHtml(a.title)}</div>
            </div>
            <span style="margin-left:auto; color:var(--text-muted)">›</span>
          </div>
        </div>
      `).join("");let i="";return this.leaderboard.length===0?i='<div class="text-sm text-muted" style="padding: 0.5rem 0">No stats yet — play some games!</div>':i=`
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
            ${this.leaderboard.map((a,r)=>`
              <tr>
                <td>${this.rankIcon(r+1)}</td>
                <td>
                  <div class="flex items-center gap-2">
                    <span class="player-dot" style="background:${a.player.color}"></span>
                    ${this.escHtml(a.player.displayName)}
                  </div>
                </td>
                <td><strong>${a.wins}</strong></td>
                <td>${a.winRate}%</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      `,`
      <main class="view" id="dashboard-view" aria-label="Dashboard">
        <header class="page-header">
          <h1 class="page-title">🎲 Scorekeeper</h1>
          <p class="page-subtitle">${t}</p>
        </header>

        ${e}

        <section aria-labelledby="recent-nights-heading">
          <div class="flex items-center justify-between mb-3">
            <h2 class="section-title" id="recent-nights-heading">Recent Nights</h2>
            <button class="btn btn-ghost btn-sm" id="view-all-history" aria-label="View all history">View all</button>
          </div>
          ${s}
        </section>

        <section aria-labelledby="leaderboard-heading" class="mt-4">
          <div class="flex items-center justify-between mb-3">
            <h2 class="section-title" id="leaderboard-heading">Leaderboard</h2>
            <button class="btn btn-ghost btn-sm" id="view-stats" aria-label="View full stats">Stats</button>
          </div>
          <div class="card">
            ${i}
          </div>
        </section>
      </main>

      <button class="fab" id="new-night-fab" aria-label="Start new game night" title="New Game Night">+</button>
    `}afterRender(){var t,e,s,i;(t=document.getElementById("new-night-fab"))==null||t.addEventListener("click",()=>{l("new-night")}),(e=document.getElementById("view-all-history"))==null||e.addEventListener("click",()=>{l("history")}),(s=document.getElementById("view-stats"))==null||s.addEventListener("click",()=>{l("stats")}),(i=document.getElementById("active-match-banner"))==null||i.addEventListener("click",a=>{const c=a.currentTarget.dataset.matchId;c&&l("match",{id:c})}),document.querySelectorAll(".night-card").forEach(a=>{a.addEventListener("click",r=>{const o=r.currentTarget.dataset.nightId;o&&(l("history"),sessionStorage.setItem("highlight-night",o))})})}escHtml(t){return t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}}export{f as Dashboard};
