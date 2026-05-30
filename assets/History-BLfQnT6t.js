import{A as e,D as t,M as n,P as r,_ as i,f as a,p as o,x as s,y as c}from"./index-DYDI3YCB.js";import{n as l,r as u,t as d}from"./utils-BZltm_RL.js";var f=class{nights=[];allPlayers=[];allGames=[];filterPlayerId=null;filterGameId=null;filterDateFrom=``;filterDateTo=``;sortOrder=`desc`;async load(){let[r,i,a]=await Promise.all([t(),c.players.toArray(),c.games.toArray()]);this.allPlayers=i,this.allGames=a,this.nights=await Promise.all(r.map(async t=>{let r=await e(t.id);return{night:t,matches:await Promise.all(r.map(async e=>{let t=a.find(t=>t.id===e.gameId),r=e.playerIds.map(e=>i.find(t=>t.id===e)).filter(e=>e!==void 0),o=e.winnerId===void 0?void 0:i.find(t=>t.id===e.winnerId),s=await n(e.id),c=r.map(e=>({player:e,total:s.filter(t=>t.playerId===e.id).reduce((e,t)=>e+t.value,0)}));return t?.scoringMode===`low`?c.sort((e,t)=>e.total-t.total):c.sort((e,t)=>t.total-e.total),{match:e,game:t,players:r,winner:o,playerTotals:c,entries:s}}))}}))}formatDate(e){return new Date(e+`T00:00:00`).toLocaleDateString(`en-US`,{weekday:`short`,month:`short`,day:`numeric`,year:`numeric`})}getFilteredNights(){let e=this.nights;if(this.filterPlayerId!==null){let t=this.filterPlayerId;e=e.filter(e=>e.matches.some(e=>e.match.playerIds.includes(t)))}if(this.filterGameId!==null){let t=this.filterGameId;e=e.filter(e=>e.matches.some(e=>e.match.gameId===t))}return this.filterDateFrom&&(e=e.filter(e=>e.night.date>=this.filterDateFrom)),this.filterDateTo&&(e=e.filter(e=>e.night.date<=this.filterDateTo)),this.sortOrder===`asc`&&(e=[...e].reverse()),e}dateFromPreset(e){if(!e)return``;let t=new Date;switch(e){case`30d`:t.setDate(t.getDate()-30);break;case`3mo`:t.setMonth(t.getMonth()-3);break;case`6mo`:t.setMonth(t.getMonth()-6);break;case`1yr`:t.setFullYear(t.getFullYear()-1);break;default:return``}return t.toISOString().slice(0,10)}render(){let e=this.getFilteredNights(),t=[`<button class="tab-btn ${this.filterPlayerId===null?`active`:``}" data-player-filter="null">All Players</button>`,...this.allPlayers.map(e=>`<button class="tab-btn ${this.filterPlayerId===e.id?`active`:``}" data-player-filter="${e.id}">
          <span class="player-dot" style="background:${e.color}"></span>
          ${l(e.displayName)}
        </button>`)].join(``),n=this.allGames.map(e=>`<option value="${e.id}" ${this.filterGameId===e.id?`selected`:``}>${l(e.name)}</option>`).join(``),r=[[``,`All`],[`30d`,`30d`],[`3mo`,`3mo`],[`6mo`,`6mo`],[`1yr`,`1yr`]],i=r.find(([e])=>this.filterDateFrom===this.dateFromPreset(e)&&!this.filterDateTo)?.[0]??null,a=``;return a=e.length===0?`
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

          <div class="history-filter-row">
            <div class="history-filter-group" style="flex:0 0 auto;min-width:130px;max-width:180px">
              <div class="section-title mb-1">Game</div>
              <select id="game-filter-select" class="form-input" style="min-width:0;width:100%">
                <option value="">All Games</option>
                ${n}
              </select>
            </div>

            <div class="history-filter-group" style="flex:1;min-width:0">
              <div class="section-title mb-1">Date Range</div>
              <div style="display:flex;gap:0.5rem;align-items:center;margin-bottom:0.5rem">
                <input type="date" id="date-from" class="form-input" value="${this.filterDateFrom}"
                  aria-label="From date" style="flex:1;min-width:0;padding:6px 8px;font-size:0.85rem">
                <span style="color:var(--text-muted);flex-shrink:0;font-size:0.9rem">–</span>
                <input type="date" id="date-to" class="form-input" value="${this.filterDateTo}"
                  aria-label="To date" style="flex:1;min-width:0;padding:6px 8px;font-size:0.85rem">
              </div>
              <div class="filter-bar" role="group" aria-label="Date presets" style="flex-wrap:nowrap;gap:0.3rem">
                ${r.map(([e,t])=>`<button class="tab-btn ${i===e?`active`:``}" data-date-preset="${e}" style="padding:4px 10px;font-size:0.8rem">${t}</button>`).join(``)}
              </div>
            </div>

            <div style="display:flex;flex-direction:column;justify-content:flex-end;flex-shrink:0">
              <button class="btn btn-secondary btn-sm" id="sort-toggle" style="white-space:nowrap">
                ${this.sortOrder===`desc`?`↓ Newest`:`↑ Oldest`}
              </button>
            </div>
          </div>
        </section>

        <section aria-label="Game nights list" id="nights-list">
          ${a}
        </section>
      </main>
    `}renderNightItem(e){let{night:t,matches:n}=e,r=sessionStorage.getItem(`highlight-night`),i=String(t.id)===r;i&&sessionStorage.removeItem(`highlight-night`);let a=n.filter(e=>e.match.status===`completed`),o=n.filter(e=>e.match.status===`active`),s=[`${n.length} match${n.length===1?``:`es`}`,a.length>0?`${a.length} completed`:``,o.length>0?`${o.length} active`:``].filter(Boolean).join(` · `),c=n.map(e=>this.renderMatchDetail(e)).join(``);return`
      <div class="history-item ${i?`highlighted`:``}" id="night-${t.id}" data-night-id="${t.id}">
        <div class="history-header" role="button" aria-expanded="false" aria-controls="night-body-${t.id}" tabindex="0" aria-label="Toggle ${l(t.title)}">
          <div>
            <div class="history-date">${this.formatDate(t.date)}</div>
            <div class="history-title">${l(t.title)}</div>
            <div class="history-meta">${s}</div>
          </div>
          <svg class="expand-icon" width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"
            style="flex-shrink:0; transition: transform 0.2s; color:var(--text-muted)">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
        <div class="history-body ${i?`open`:``}" id="night-body-${t.id}">
          ${t.notes?`<p class="text-sm text-muted" style="padding: 0.5rem 0; font-style:italic">${l(t.notes)}</p>`:``}
          ${c}
          <div style="padding-top:0.75rem; display:flex; justify-content:flex-end; gap:0.5rem; border-top: 1px solid var(--border); margin-top: 0.5rem">
            ${o.length>0?`<button class="btn btn-primary btn-sm resume-btn" data-match-id="${o[0].match.id}">Resume Match</button>`:``}
            <button class="btn btn-secondary btn-sm add-match-btn" data-night-id="${t.id}" aria-label="Add match to ${l(t.title)}">
              + Add Match
            </button>
            <button class="btn btn-danger btn-sm delete-night-btn" data-night-id="${t.id}" aria-label="Delete ${l(t.title)}">
              Delete Night
            </button>
          </div>
        </div>
      </div>
    `}renderMatchDetail(e){let t=e.match.status===`completed`?`<span class="badge badge-success" style="font-size:0.7rem">Done</span>`:`<span class="badge badge-primary" style="font-size:0.7rem">Active</span>`,n=e.playerTotals.map((t,n)=>`
      <div class="flex items-center gap-2" style="padding: 3px 0">
        ${n===0&&e.match.status===`completed`?`🏆`:``}
        <span class="player-dot" style="background:${t.player.color}"></span>
        <span class="text-sm">${l(t.player.displayName)}</span>
        <span class="text-sm font-semibold" style="margin-left:auto">${t.total}</span>
      </div>
    `).join(``),r=e.entries.length>0,i=r?Math.max(...e.entries.map(e=>e.roundNumber)):0,a=e.match.status===`completed`;return`
      <div class="match-result">
        <div class="match-result-title">
          ${e.game?l(e.game.name):`Unknown Game`}
          ${t}
          ${e.winner?`<span class="winner-label">🏆 ${l(e.winner.displayName)}</span>`:``}
          <span style="margin-left:auto;display:flex;gap:0.35rem;align-items:center">
            ${r?`<button class="btn btn-sm btn-secondary view-scores-btn" data-match-id="${e.match.id}" style="font-size:0.7rem;padding:2px 8px">📊 ${i} round${i===1?``:`s`}</button>`:``}
            ${a?`<button class="btn btn-sm btn-secondary reopen-match-btn" data-match-id="${e.match.id}" style="font-size:0.7rem;padding:2px 8px">↩ Re-open</button>`:``}
          </span>
        </div>
        <div style="padding-left: 0.25rem">
          ${n}
        </div>
      </div>
    `}showScoreTableModal(e){let t=this.nights.flatMap(e=>e.matches).find(t=>t.match.id===e);if(!t)return;let n=t.game?.scoringMode===`phase10`,r=t.game?.roundLabels,i=[...new Set(t.entries.map(e=>e.roundNumber))].sort((e,t)=>e-t),a=e=>r&&r.length>=e?r[e-1]:`Round ${e}`,o=e=>{if(e===`first_out`)return!0;if(e)try{return!!JSON.parse(e).firstOut}catch{}return!1},s=d(t.entries,t.match.createdAt),c=t.players.map(e=>`<th style="background:${e.color}22; border-bottom:2px solid ${e.color}">
        <div class="flex items-center gap-1 justify-center">
          <span class="player-dot" style="background:${e.color}; flex-shrink:0"></span>
          <span>${l(e.displayName)}</span>
          ${t.winner?.id===e.id?` 🏆`:``}
        </div>
      </th>`).join(``),f=t.players.map(e=>`<td class="score-table-footer">${t.playerTotals.find(t=>t.player.id===e.id)?.total??0}</td>`).join(``),p=new Map(t.players.map(e=>[e.id,0])),m=new Map;for(let e of i){let n=t.entries.filter(t=>t.roundNumber===e);for(let e of t.players){let t=n.find(t=>t.playerId===e.id)?.value??0;p.set(e.id,(p.get(e.id)??0)+t)}m.set(e,new Map(p))}let h=``;for(let e of[...i].reverse()){let r=t.entries.filter(t=>t.roundNumber===e),i=s.get(e),c=i===void 0?``:` <span class="score-table-dur">${u(i)}</span>`,d=t.players.map(e=>{let t=r.find(t=>t.playerId===e.id);if(!t)return`<td class="score-table-score">–</td>`;if(n)try{let e=JSON.parse(t.note??`{}`);return`<td class="score-table-score">${e.phase?`Ph.${e.phase}`:``}${e.completed?` ✓`:``}${e.firstOut?` ⚡`:``}<br><small>${t.value}pts</small></td>`}catch{}return`<td class="score-table-score">${o(t.note)?`⚡ `:``}${t.value}</td>`}).join(``),f=t.players.map(t=>`<td class="score-table-total">= ${m.get(e)?.get(t.id)??0}</td>`).join(``);h+=`
        <tr class="score-table-round-row">
          <td class="score-table-label">${l(a(e))}${c}</td>
          ${d}
        </tr>
        <tr class="score-table-total-row">
          <td class="score-table-label-total">∑</td>
          ${f}
        </tr>`}let g=document.createElement(`div`);g.id=`score-table-modal`,g.setAttribute(`role`,`dialog`),g.setAttribute(`aria-modal`,`true`),g.setAttribute(`aria-label`,`Score Table`),g.innerHTML=`
      <div class="modal-backdrop"></div>
      <div class="modal-sheet">
        <div class="modal-header">
          <h2 class="modal-title">${t.game?l(t.game.name):`Score Table`}</h2>
          <button class="icon-btn modal-close-btn" aria-label="Close">✕</button>
        </div>
        <div class="score-table-wrapper" style="overflow:auto;flex:1">
          <table class="score-table" aria-label="Scores by round">
            <thead>
              <tr>
                <th class="score-table-corner">Round</th>
                ${c}
              </tr>
              <tr class="score-table-totals-row">
                <td class="score-table-label-total">Total</td>
                ${f}
              </tr>
            </thead>
            <tbody>${h}</tbody>
          </table>
        </div>
      </div>
    `,document.body.appendChild(g),g.querySelectorAll(`.modal-close-btn, .modal-backdrop`).forEach(e=>{e.addEventListener(`click`,()=>g.remove())})}showAddMatchModal(e){let t=document.getElementById(`add-match-modal`);t&&t.remove();let n=this.allGames.map(e=>`<option value="${e.id}">${l(e.name)}</option>`).join(``),r=this.allPlayers.map(e=>`
      <label class="flex items-center gap-2" style="padding:0.25rem 0; cursor:pointer">
        <input type="checkbox" name="player" value="${e.id}" style="accent-color:${e.color}">
        <span class="player-dot" style="background:${e.color}"></span>
        <span>${l(e.displayName)}</span>
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
              ${r}
            </div>
          </div>
          <div class="flex gap-2" style="margin-top:1rem">
            <button type="button" class="btn btn-secondary flex-1 modal-close-btn">Cancel</button>
            <button type="submit" class="btn btn-primary flex-1">Start Match</button>
          </div>
        </form>
      </div>
    `,document.body.appendChild(s),s.querySelectorAll(`.modal-close-btn, .modal-backdrop`).forEach(e=>{e.addEventListener(`click`,()=>s.remove())});let c=s.querySelector(`#add-match-form`);c.addEventListener(`submit`,async t=>{t.preventDefault();let n=parseInt(c.querySelector(`#add-match-game`).value,10);if(!n)return;let r=Array.from(c.querySelectorAll(`input[name="player"]:checked`)).map(e=>parseInt(e.value,10));if(r.length===0){a(`Select at least one player`,`error`);return}try{let t=await i({gameNightId:e,gameId:n,playerIds:r,status:`active`,createdAt:Date.now()});s.remove(),o(`match`,{id:String(t)})}catch(e){console.error(e),a(`Failed to create match`,`error`)}})}afterRender(){document.getElementById(`go-new-night`)?.addEventListener(`click`,()=>{o(`new-night`)}),document.querySelectorAll(`[data-player-filter]`).forEach(e=>{e.addEventListener(`click`,()=>{let t=e.dataset.playerFilter;this.filterPlayerId=t===`null`?null:parseInt(t??``,10),this.refreshList()})}),document.getElementById(`game-filter-select`)?.addEventListener(`change`,e=>{let t=e.target.value;this.filterGameId=t?parseInt(t,10):null,this.refreshList()}),document.querySelectorAll(`[data-date-preset]`).forEach(e=>{e.addEventListener(`click`,()=>{this.filterDateFrom=this.dateFromPreset(e.dataset.datePreset??``),this.filterDateTo=``;let t=document.getElementById(`date-to`);t&&(t.value=``),this.refreshList()})}),document.getElementById(`date-from`)?.addEventListener(`change`,e=>{this.filterDateFrom=e.target.value,this.refreshList()}),document.getElementById(`date-to`)?.addEventListener(`change`,e=>{this.filterDateTo=e.target.value,this.refreshList()}),document.getElementById(`sort-toggle`)?.addEventListener(`click`,()=>{this.sortOrder=this.sortOrder===`desc`?`asc`:`desc`,this.refreshList()}),document.querySelectorAll(`.history-header`).forEach(e=>{let t=()=>{let t=e.closest(`.history-item`)?.dataset.nightId,n=document.getElementById(`night-body-${t}`),r=e.querySelector(`.expand-icon`);if(!n)return;let i=n.classList.contains(`open`);n.classList.toggle(`open`,!i),r&&(r.style.transform=i?``:`rotate(180deg)`),e.setAttribute(`aria-expanded`,String(!i))};e.addEventListener(`click`,t),e.addEventListener(`keydown`,e=>{(e.key===`Enter`||e.key===` `)&&(e.preventDefault(),t())})}),document.querySelectorAll(`.delete-night-btn`).forEach(e=>{e.addEventListener(`click`,async e=>{e.stopPropagation();let t=parseInt(e.currentTarget.dataset.nightId??``,10),n=this.nights.find(e=>e.night.id===t);if(n&&confirm(`Delete "${n.night.title}" and all its matches? This cannot be undone.`))try{await s(t),this.nights=this.nights.filter(e=>e.night.id!==t),this.refreshList(),a(`Game night deleted`,`info`)}catch(e){console.error(e),a(`Failed to delete game night`,`error`)}})}),document.querySelectorAll(`.add-match-btn`).forEach(e=>{e.addEventListener(`click`,e=>{e.stopPropagation();let t=parseInt(e.currentTarget.dataset.nightId??``,10);this.showAddMatchModal(t)})}),document.querySelectorAll(`.view-scores-btn`).forEach(e=>{e.addEventListener(`click`,e=>{e.stopPropagation();let t=parseInt(e.currentTarget.dataset.matchId??``,10);document.getElementById(`score-table-modal`)?.remove(),this.showScoreTableModal(t)})}),document.querySelectorAll(`.resume-btn`).forEach(e=>{e.addEventListener(`click`,e=>{e.stopPropagation();let t=e.currentTarget.dataset.matchId;t&&o(`match`,{id:t})})}),document.querySelectorAll(`.reopen-match-btn`).forEach(e=>{e.addEventListener(`click`,async e=>{e.stopPropagation();let t=parseInt(e.currentTarget.dataset.matchId??``,10);if(!isNaN(t))try{await r(t),o(`match`,{id:String(t)})}catch(e){console.error(e),a(`Failed to re-open match`,`error`)}})})}refreshList(){let e=document.getElementById(`nights-list`);if(!e)return;let t=this.getFilteredNights();t.length===0?e.innerHTML=`
        <div class="empty-state">
          <div class="empty-state-icon">📅</div>
          <div class="empty-state-title">No results</div>
          <p>Try removing a filter.</p>
        </div>
      `:(e.innerHTML=t.map(e=>this.renderNightItem(e)).join(``),this.afterRender()),document.querySelectorAll(`[data-player-filter]`).forEach(e=>{let t=e.dataset.playerFilter;e.classList.toggle(`active`,t===`null`?this.filterPlayerId===null:parseInt(t??``,10)===this.filterPlayerId)});let n=document.getElementById(`game-filter-select`);n&&(n.value=this.filterGameId===null?``:String(this.filterGameId));let r=[``,`30d`,`3mo`,`6mo`,`1yr`].find(e=>this.filterDateFrom===this.dateFromPreset(e)&&!this.filterDateTo)??null;document.querySelectorAll(`[data-date-preset]`).forEach(e=>{e.classList.toggle(`active`,e.dataset.datePreset===r)});let i=document.getElementById(`date-from`);i&&(i.value=this.filterDateFrom);let a=document.getElementById(`date-to`);a&&(a.value=this.filterDateTo);let o=document.getElementById(`sort-toggle`);o&&(o.textContent=this.sortOrder===`desc`?`↓ Newest`:`↑ Oldest`)}};export{f as History};