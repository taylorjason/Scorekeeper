import{A as e,D as t,M as n,_ as r,f as i,p as a,x as o,y as s}from"./index-DA_iAJv6.js";import{n as c}from"./utils-BZltm_RL.js";var l=class{nights=[];allPlayers=[];allGames=[];filterPlayerId=null;filterGameId=null;async load(){let[r,i,a]=await Promise.all([t(),s.players.toArray(),s.games.toArray()]);this.allPlayers=i,this.allGames=a,this.nights=await Promise.all(r.map(async t=>{let r=await e(t.id);return{night:t,matches:await Promise.all(r.map(async e=>{let t=a.find(t=>t.id===e.gameId),r=e.playerIds.map(e=>i.find(t=>t.id===e)).filter(e=>e!==void 0),o=e.winnerId===void 0?void 0:i.find(t=>t.id===e.winnerId),s=await n(e.id),c=r.map(e=>({player:e,total:s.filter(t=>t.playerId===e.id).reduce((e,t)=>e+t.value,0)}));return t?.scoringMode===`low`?c.sort((e,t)=>e.total-t.total):c.sort((e,t)=>t.total-e.total),{match:e,game:t,players:r,winner:o,playerTotals:c,entries:s}}))}}))}formatDate(e){return new Date(e+`T00:00:00`).toLocaleDateString(`en-US`,{weekday:`short`,month:`short`,day:`numeric`,year:`numeric`})}getFilteredNights(){let e=this.nights;if(this.filterPlayerId!==null){let t=this.filterPlayerId;e=e.filter(e=>e.matches.some(e=>e.match.playerIds.includes(t)))}if(this.filterGameId!==null){let t=this.filterGameId;e=e.filter(e=>e.matches.some(e=>e.match.gameId===t))}return e}render(){let e=this.getFilteredNights(),t=[`<button class="tab-btn ${this.filterPlayerId===null?`active`:``}" data-player-filter="null">All Players</button>`,...this.allPlayers.map(e=>`<button class="tab-btn ${this.filterPlayerId===e.id?`active`:``}" data-player-filter="${e.id}">
          <span class="player-dot" style="background:${e.color}"></span>
          ${c(e.displayName)}
        </button>`)].join(``),n=[`<button class="tab-btn ${this.filterGameId===null?`active`:``}" data-game-filter="null">All Games</button>`,...this.allGames.map(e=>`<button class="tab-btn ${this.filterGameId===e.id?`active`:``}" data-game-filter="${e.id}">${c(e.name)}</button>`)].join(``),r=``;return r=e.length===0?`
        <div class="empty-state">
          <div class="empty-state-icon">📅</div>
          <div class="empty-state-title">No game nights found</div>
          <p>${this.nights.length===0?`Start your first game night!`:`No results for current filter.`}</p>
          ${this.nights.length===0?`<button class="btn btn-primary mt-4" id="go-new-night">Start a Night</button>`:``}
        </div>
      `:e.map(e=>this.renderNightItem(e)).join(``),`
      <main class="view" aria-label="History">
        <header class="page-header">
          <h1 class="page-title">History</h1>
          <p class="page-subtitle">${this.nights.length} game night${this.nights.length===1?``:`s`} recorded</p>
        </header>

        <section class="mb-4" aria-label="Filters">
          <div class="section-title mb-2">Filter by Player</div>
          <div class="filter-bar" role="group" aria-label="Player filter">${t}</div>
          <div class="section-title mb-2 mt-4">Filter by Game</div>
          <div class="filter-bar" role="group" aria-label="Game filter">${n}</div>
        </section>

        <section aria-label="Game nights list" id="nights-list">
          ${r}
        </section>
      </main>
    `}renderNightItem(e){let{night:t,matches:n}=e,r=sessionStorage.getItem(`highlight-night`),i=String(t.id)===r;i&&sessionStorage.removeItem(`highlight-night`);let a=n.filter(e=>e.match.status===`completed`),o=n.filter(e=>e.match.status===`active`),s=[`${n.length} match${n.length===1?``:`es`}`,a.length>0?`${a.length} completed`:``,o.length>0?`${o.length} active`:``].filter(Boolean).join(` · `),l=n.map(e=>this.renderMatchDetail(e)).join(``);return`
      <div class="history-item ${i?`highlighted`:``}" id="night-${t.id}" data-night-id="${t.id}">
        <div class="history-header" role="button" aria-expanded="false" aria-controls="night-body-${t.id}" tabindex="0" aria-label="Toggle ${c(t.title)}">
          <div>
            <div class="history-date">${this.formatDate(t.date)}</div>
            <div class="history-title">${c(t.title)}</div>
            <div class="history-meta">${s}</div>
          </div>
          <svg class="expand-icon" width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"
            style="flex-shrink:0; transition: transform 0.2s; color:var(--text-muted)">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
        <div class="history-body ${i?`open`:``}" id="night-body-${t.id}">
          ${t.notes?`<p class="text-sm text-muted" style="padding: 0.5rem 0; font-style:italic">${c(t.notes)}</p>`:``}
          ${l}
          <div style="padding-top:0.75rem; display:flex; justify-content:flex-end; gap:0.5rem; border-top: 1px solid var(--border); margin-top: 0.5rem">
            ${o.length>0?`<button class="btn btn-primary btn-sm resume-btn" data-match-id="${o[0].match.id}">Resume Match</button>`:``}
            <button class="btn btn-secondary btn-sm add-match-btn" data-night-id="${t.id}" aria-label="Add match to ${c(t.title)}">
              + Add Match
            </button>
            <button class="btn btn-danger btn-sm delete-night-btn" data-night-id="${t.id}" aria-label="Delete ${c(t.title)}">
              Delete Night
            </button>
          </div>
        </div>
      </div>
    `}renderMatchDetail(e){let t=e.match.status===`completed`?`<span class="badge badge-success" style="font-size:0.7rem">Done</span>`:`<span class="badge badge-primary" style="font-size:0.7rem">Active</span>`,n=e.playerTotals.map((t,n)=>`
      <div class="flex items-center gap-2" style="padding: 3px 0">
        ${n===0&&e.match.status===`completed`?`🏆`:``}
        <span class="player-dot" style="background:${t.player.color}"></span>
        <span class="text-sm">${c(t.player.displayName)}</span>
        <span class="text-sm font-semibold" style="margin-left:auto">${t.total}</span>
      </div>
    `).join(``),r=e.entries.length>0,i=r?Math.max(...e.entries.map(e=>e.roundNumber)):0;return`
      <div class="match-result">
        <div class="match-result-title">
          ${e.game?c(e.game.name):`Unknown Game`}
          ${t}
          ${e.winner?`<span class="winner-label">🏆 ${c(e.winner.displayName)}</span>`:``}
          ${r?`<button class="btn btn-sm btn-secondary view-scores-btn" data-match-id="${e.match.id}" style="margin-left:auto;font-size:0.7rem;padding:2px 8px">📊 ${i} round${i===1?``:`s`}</button>`:``}
        </div>
        <div style="padding-left: 0.25rem">
          ${n}
        </div>
      </div>
    `}showScoreTableModal(e){let t=this.nights.flatMap(e=>e.matches).find(t=>t.match.id===e);if(!t)return;let n=[...new Set(t.entries.map(e=>e.roundNumber))].sort((e,t)=>e-t),r=t.game?.roundLabels,i=n.map(e=>`<th>${r?.[e-1]?c(r[e-1]):`R${e}`}</th>`).join(``),a=t.playerTotals.map(({player:e,total:r},i)=>{let a=n.map(n=>{let r=t.entries.find(t=>t.playerId===e.id&&t.roundNumber===n);return`<td class="score-table-score">${r===void 0?`—`:r.value}</td>`}).join(``);return`
        <tr class="${i===0&&t.match.status===`completed`?`score-table-total-row`:``}">
          <td class="score-table-label">
            <span class="player-dot" style="background:${e.color}"></span>
            ${i===0&&t.match.status===`completed`?`🏆 `:``}${c(e.displayName)}
          </td>
          ${a}
          <td class="score-table-label-total">${r}</td>
        </tr>`}).join(``),o=document.createElement(`div`);o.id=`score-table-modal`,o.setAttribute(`role`,`dialog`),o.setAttribute(`aria-modal`,`true`),o.setAttribute(`aria-label`,`Score Table`),o.innerHTML=`
      <div class="modal-backdrop"></div>
      <div class="modal-sheet">
        <div class="modal-header">
          <h2 class="modal-title">${t.game?c(t.game.name):`Score Table`}</h2>
          <button class="icon-btn modal-close-btn" aria-label="Close">✕</button>
        </div>
        <div class="score-table-wrapper" style="overflow-x:auto;max-height:60vh;overflow-y:auto">
          <table class="score-table">
            <thead>
              <tr>
                <th class="score-table-corner">Player</th>
                ${i}
                <th>Total</th>
              </tr>
            </thead>
            <tbody>${a}</tbody>
          </table>
        </div>
      </div>
    `,document.body.appendChild(o),o.querySelectorAll(`.modal-close-btn, .modal-backdrop`).forEach(e=>{e.addEventListener(`click`,()=>o.remove())})}showAddMatchModal(e){let t=document.getElementById(`add-match-modal`);t&&t.remove();let n=this.allGames.map(e=>`<option value="${e.id}">${c(e.name)}</option>`).join(``),o=this.allPlayers.map(e=>`
      <label class="flex items-center gap-2" style="padding:0.25rem 0; cursor:pointer">
        <input type="checkbox" name="player" value="${e.id}" style="accent-color:${e.color}">
        <span class="player-dot" style="background:${e.color}"></span>
        <span>${c(e.displayName)}</span>
      </label>
    `).join(``),s=document.createElement(`div`);s.id=`add-match-modal`,s.setAttribute(`role`,`dialog`),s.setAttribute(`aria-modal`,`true`),s.setAttribute(`aria-label`,`Add Match`),s.innerHTML=`
      <div class="modal-backdrop"></div>
      <div class="modal-sheet">
        <div class="modal-header">
          <h2 class="modal-title">Add Match</h2>
          <button class="icon-btn modal-close-btn" aria-label="Close">✕</button>
        </div>
        <form id="add-match-form" data-night-id="${e}">
          <div class="form-group">
            <label class="form-label" for="add-match-game">Game</label>
            <select id="add-match-game" class="form-input" required>
              <option value="">— select a game —</option>
              ${n}
            </select>
          </div>
          <div class="form-group">
            <div class="form-label">Players</div>
            <div style="max-height:200px;overflow-y:auto;padding:0.25rem 0">
              ${o}
            </div>
          </div>
          <div class="flex gap-2" style="margin-top:1rem">
            <button type="button" class="btn btn-secondary flex-1 modal-close-btn">Cancel</button>
            <button type="submit" class="btn btn-primary flex-1">Start Match</button>
          </div>
        </form>
      </div>
    `,document.body.appendChild(s),s.querySelectorAll(`.modal-close-btn, .modal-backdrop`).forEach(e=>{e.addEventListener(`click`,()=>s.remove())});let l=s.querySelector(`#add-match-form`);l.addEventListener(`submit`,async t=>{t.preventDefault();let n=parseInt(l.querySelector(`#add-match-game`).value,10);if(!n)return;let o=Array.from(l.querySelectorAll(`input[name="player"]:checked`)).map(e=>parseInt(e.value,10));if(o.length===0){i(`Select at least one player`,`error`);return}try{let t=await r({gameNightId:e,gameId:n,playerIds:o,status:`active`,createdAt:Date.now()});s.remove(),a(`match`,{id:String(t)})}catch(e){console.error(e),i(`Failed to create match`,`error`)}})}afterRender(){document.getElementById(`go-new-night`)?.addEventListener(`click`,()=>{a(`new-night`)}),document.querySelectorAll(`[data-player-filter]`).forEach(e=>{e.addEventListener(`click`,()=>{let t=e.dataset.playerFilter;this.filterPlayerId=t===`null`?null:parseInt(t??``,10),this.refreshList()})}),document.querySelectorAll(`[data-game-filter]`).forEach(e=>{e.addEventListener(`click`,()=>{let t=e.dataset.gameFilter;this.filterGameId=t===`null`?null:parseInt(t??``,10),this.refreshList()})}),document.querySelectorAll(`.history-header`).forEach(e=>{let t=()=>{let t=e.closest(`.history-item`)?.dataset.nightId,n=document.getElementById(`night-body-${t}`),r=e.querySelector(`.expand-icon`);if(!n)return;let i=n.classList.contains(`open`);n.classList.toggle(`open`,!i),r&&(r.style.transform=i?``:`rotate(180deg)`),e.setAttribute(`aria-expanded`,String(!i))};e.addEventListener(`click`,t),e.addEventListener(`keydown`,e=>{(e.key===`Enter`||e.key===` `)&&(e.preventDefault(),t())})}),document.querySelectorAll(`.delete-night-btn`).forEach(e=>{e.addEventListener(`click`,async e=>{e.stopPropagation();let t=parseInt(e.currentTarget.dataset.nightId??``,10),n=this.nights.find(e=>e.night.id===t);if(n&&confirm(`Delete "${n.night.title}" and all its matches? This cannot be undone.`))try{await o(t),this.nights=this.nights.filter(e=>e.night.id!==t),this.refreshList(),i(`Game night deleted`,`info`)}catch(e){console.error(e),i(`Failed to delete game night`,`error`)}})}),document.querySelectorAll(`.add-match-btn`).forEach(e=>{e.addEventListener(`click`,e=>{e.stopPropagation();let t=parseInt(e.currentTarget.dataset.nightId??``,10);this.showAddMatchModal(t)})}),document.querySelectorAll(`.view-scores-btn`).forEach(e=>{e.addEventListener(`click`,e=>{e.stopPropagation();let t=parseInt(e.currentTarget.dataset.matchId??``,10);document.getElementById(`score-table-modal`)?.remove(),this.showScoreTableModal(t)})}),document.querySelectorAll(`.resume-btn`).forEach(e=>{e.addEventListener(`click`,e=>{e.stopPropagation();let t=e.currentTarget.dataset.matchId;t&&a(`match`,{id:t})})})}refreshList(){let e=document.getElementById(`nights-list`);if(!e)return;let t=this.getFilteredNights();t.length===0?e.innerHTML=`
        <div class="empty-state">
          <div class="empty-state-icon">📅</div>
          <div class="empty-state-title">No results</div>
          <p>Try removing a filter.</p>
        </div>
      `:(e.innerHTML=t.map(e=>this.renderNightItem(e)).join(``),this.afterRender()),document.querySelectorAll(`[data-player-filter]`).forEach(e=>{let t=e.dataset.playerFilter;e.classList.toggle(`active`,t===`null`?this.filterPlayerId===null:parseInt(t??``,10)===this.filterPlayerId)}),document.querySelectorAll(`[data-game-filter]`).forEach(e=>{let t=e.dataset.gameFilter;e.classList.toggle(`active`,t===`null`?this.filterGameId===null:parseInt(t??``,10)===this.filterGameId)})}};export{l as History};