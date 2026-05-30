import{D as e,T as t,p as n}from"./index-I5FnJ29-.js";import{n as r}from"./utils-BZltm_RL.js";import{n as i}from"./stats-BxyP8803.js";var a=class{gameNights=[];leaderboard=[];activeMatch;async load(){let[n,r,a]=await Promise.all([e(),i(),t()]);this.gameNights=n.slice(0,3),this.leaderboard=r.slice(0,5),this.activeMatch=a}formatDate(e){let t=new Date(e+`T00:00:00`),n=Math.floor((new Date().getTime()-t.getTime())/864e5);return n===0?`Today`:n===1?`Yesterday`:n<7?`${n} days ago`:t.toLocaleDateString(`en-US`,{month:`short`,day:`numeric`,year:n>365?`numeric`:void 0})}rankIcon(e){return e===1?`🥇`:e===2?`🥈`:e===3?`🥉`:`<span class="rank-number">${e}</span>`}render(){let e=new Date().toLocaleDateString(`en-US`,{weekday:`long`,month:`long`,day:`numeric`}),t=``;this.activeMatch&&(t=`
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
      `);let n=``;n=this.gameNights.length===0?`
        <div class="empty-state" style="padding: 1.5rem 0">
          <div class="empty-state-icon">🎲</div>
          <div class="empty-state-title">No game nights yet</div>
          <p>Start your first game night!</p>
        </div>
      `:this.gameNights.map(e=>`
        <div class="card card-clickable mb-3 night-card" data-night-id="${e.id}" role="button" aria-label="Open ${e.title}">
          <div class="flex items-center gap-3">
            <div>
              <div class="history-date">${this.formatDate(e.date)}</div>
              <div class="font-semibold">${r(e.title)}</div>
            </div>
            <span style="margin-left:auto; color:var(--text-muted)">›</span>
          </div>
        </div>
      `).join(``);let i=``;return i=this.leaderboard.length===0?`<div class="text-sm text-muted" style="padding: 0.5rem 0">No stats yet — play some games!</div>`:`
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
            ${this.leaderboard.map((e,t)=>`
              <tr>
                <td>${this.rankIcon(t+1)}</td>
                <td>
                  <div class="flex items-center gap-2">
                    <span class="player-dot" style="background:${e.player.color}"></span>
                    ${r(e.player.displayName)}
                  </div>
                </td>
                <td><strong>${e.wins}</strong></td>
                <td>${e.winRate}%</td>
              </tr>
            `).join(``)}
          </tbody>
        </table>
      `,`
      <main class="view" id="dashboard-view" aria-label="Dashboard">
        <header class="page-header">
          <h1 class="page-title">🎲 Scorekeeper</h1>
          <p class="page-subtitle">${e}</p>
        </header>

        ${t}

        <section aria-labelledby="recent-nights-heading">
          <div class="flex items-center justify-between mb-3">
            <h2 class="section-title" id="recent-nights-heading">Recent Nights</h2>
            <button class="btn btn-ghost btn-sm" id="view-all-history" aria-label="View all history">View all</button>
          </div>
          ${n}
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
    `}afterRender(){document.getElementById(`new-night-fab`)?.addEventListener(`click`,()=>{n(`new-night`)}),document.getElementById(`view-all-history`)?.addEventListener(`click`,()=>{n(`history`)}),document.getElementById(`view-stats`)?.addEventListener(`click`,()=>{n(`stats`)}),document.getElementById(`active-match-banner`)?.addEventListener(`click`,e=>{let t=e.currentTarget.dataset.matchId;t&&n(`match`,{id:t})}),document.querySelectorAll(`.night-card`).forEach(e=>{e.addEventListener(`click`,e=>{let t=e.currentTarget.dataset.nightId;t&&(n(`history`),sessionStorage.setItem(`highlight-night`,t))})})}};export{a as Dashboard};