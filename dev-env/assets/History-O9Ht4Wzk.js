var w=Object.defineProperty;var k=(h,a,t)=>a in h?w(h,a,{enumerable:!0,configurable:!0,writable:!0,value:t}):h[a]=t;var g=(h,a,t)=>k(h,typeof a!="symbol"?a+"":a,t);import{g as E,h as b,k as A,j as x,s as u,e as S,n as v,o as H}from"./index-vUGePuu_.js";class G{constructor(){g(this,"nights",[]);g(this,"allPlayers",[]);g(this,"allGames",[]);g(this,"filterPlayerId",null);g(this,"filterGameId",null)}async load(){const[a,t,e]=await Promise.all([E(),b.players.toArray(),b.games.toArray()]);this.allPlayers=t,this.allGames=e,this.nights=await Promise.all(a.map(async s=>{const i=await A(s.id),r=await Promise.all(i.map(async l=>{const o=e.find(n=>n.id===l.gameId),p=l.playerIds.map(n=>t.find(m=>m.id===n)).filter(n=>n!==void 0),d=l.winnerId!==void 0?t.find(n=>n.id===l.winnerId):void 0,c=await x(l.id),y=p.map(n=>{const $=c.filter(f=>f.playerId===n.id).reduce((f,I)=>f+I.value,0);return{player:n,total:$}});return(o==null?void 0:o.scoringMode)==="low"?y.sort((n,m)=>n.total-m.total):y.sort((n,m)=>m.total-n.total),{match:l,game:o,players:p,winner:d,playerTotals:y}}));return{night:s,matches:r}}))}escHtml(a){return a.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}formatDate(a){return new Date(a+"T00:00:00").toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric",year:"numeric"})}getFilteredNights(){let a=this.nights;if(this.filterPlayerId!==null){const t=this.filterPlayerId;a=a.filter(e=>e.matches.some(s=>s.match.playerIds.includes(t)))}if(this.filterGameId!==null){const t=this.filterGameId;a=a.filter(e=>e.matches.some(s=>s.match.gameId===t))}return a}render(){const a=this.getFilteredNights(),t=[`<button class="tab-btn ${this.filterPlayerId===null?"active":""}" data-player-filter="null">All Players</button>`,...this.allPlayers.map(i=>`<button class="tab-btn ${this.filterPlayerId===i.id?"active":""}" data-player-filter="${i.id}">
          <span class="player-dot" style="background:${i.color}"></span>
          ${this.escHtml(i.displayName)}
        </button>`)].join(""),e=[`<button class="tab-btn ${this.filterGameId===null?"active":""}" data-game-filter="null">All Games</button>`,...this.allGames.map(i=>`<button class="tab-btn ${this.filterGameId===i.id?"active":""}" data-game-filter="${i.id}">${this.escHtml(i.name)}</button>`)].join("");let s="";return a.length===0?s=`
        <div class="empty-state">
          <div class="empty-state-icon">📅</div>
          <div class="empty-state-title">No game nights found</div>
          <p>${this.nights.length===0?"Start your first game night!":"No results for current filter."}</p>
          ${this.nights.length===0?'<button class="btn btn-primary mt-4" id="go-new-night">Start a Night</button>':""}
        </div>
      `:s=a.map(i=>this.renderNightItem(i)).join(""),`
      <main class="view" aria-label="History">
        <header class="page-header">
          <h1 class="page-title">History</h1>
          <p class="page-subtitle">${this.nights.length} game night${this.nights.length!==1?"s":""} recorded</p>
        </header>

        <section class="mb-4" aria-label="Filters">
          <div class="section-title mb-2">Filter by Player</div>
          <div class="filter-bar" role="group" aria-label="Player filter">${t}</div>
          <div class="section-title mb-2 mt-4">Filter by Game</div>
          <div class="filter-bar" role="group" aria-label="Game filter">${e}</div>
        </section>

        <section aria-label="Game nights list" id="nights-list">
          ${s}
        </section>
      </main>
    `}renderNightItem(a){const{night:t,matches:e}=a,s=sessionStorage.getItem("highlight-night"),i=String(t.id)===s;i&&sessionStorage.removeItem("highlight-night");const r=e.filter(d=>d.match.status==="completed"),l=e.filter(d=>d.match.status==="active"),o=[`${e.length} match${e.length!==1?"es":""}`,r.length>0?`${r.length} completed`:"",l.length>0?`${l.length} active`:""].filter(Boolean).join(" · "),p=e.map(d=>this.renderMatchDetail(d)).join("");return`
      <div class="history-item ${i?"highlighted":""}" id="night-${t.id}" data-night-id="${t.id}">
        <div class="history-header" role="button" aria-expanded="false" aria-controls="night-body-${t.id}" tabindex="0" aria-label="Toggle ${this.escHtml(t.title)}">
          <div>
            <div class="history-date">${this.formatDate(t.date)}</div>
            <div class="history-title">${this.escHtml(t.title)}</div>
            <div class="history-meta">${o}</div>
          </div>
          <svg class="expand-icon" width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"
            style="flex-shrink:0; transition: transform 0.2s; color:var(--text-muted)">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
        <div class="history-body ${i?"open":""}" id="night-body-${t.id}">
          ${t.notes?`<p class="text-sm text-muted" style="padding: 0.5rem 0; font-style:italic">${this.escHtml(t.notes)}</p>`:""}
          ${p}
          <div style="padding-top:0.75rem; display:flex; justify-content:flex-end; gap:0.5rem; border-top: 1px solid var(--border); margin-top: 0.5rem">
            ${l.length>0?`<button class="btn btn-primary btn-sm resume-btn" data-match-id="${l[0].match.id}">Resume Match</button>`:""}
            <button class="btn btn-secondary btn-sm add-match-btn" data-night-id="${t.id}" aria-label="Add match to ${this.escHtml(t.title)}">
              + Add Match
            </button>
            <button class="btn btn-danger btn-sm delete-night-btn" data-night-id="${t.id}" aria-label="Delete ${this.escHtml(t.title)}">
              Delete Night
            </button>
          </div>
        </div>
      </div>
    `}renderMatchDetail(a){const t=a.match.status==="completed"?'<span class="badge badge-success" style="font-size:0.7rem">Done</span>':'<span class="badge badge-primary" style="font-size:0.7rem">Active</span>',e=a.playerTotals.map((s,i)=>`
      <div class="flex items-center gap-2" style="padding: 3px 0">
        ${i===0&&a.match.status==="completed"?"🏆":""}
        <span class="player-dot" style="background:${s.player.color}"></span>
        <span class="text-sm">${this.escHtml(s.player.displayName)}</span>
        <span class="text-sm font-semibold" style="margin-left:auto">${s.total}</span>
      </div>
    `).join("");return`
      <div class="match-result">
        <div class="match-result-title">
          ${a.game?this.escHtml(a.game.name):"Unknown Game"}
          ${t}
          ${a.winner?`<span class="winner-label">🏆 ${this.escHtml(a.winner.displayName)}</span>`:""}
        </div>
        <div style="padding-left: 0.25rem">
          ${e}
        </div>
      </div>
    `}showAddMatchModal(a){const t=document.getElementById("add-match-modal");t&&t.remove();const e=this.allGames.map(l=>`<option value="${l.id}">${this.escHtml(l.name)}</option>`).join(""),s=this.allPlayers.map(l=>`
      <label class="flex items-center gap-2" style="padding:0.25rem 0; cursor:pointer">
        <input type="checkbox" name="player" value="${l.id}" style="accent-color:${l.color}">
        <span class="player-dot" style="background:${l.color}"></span>
        <span>${this.escHtml(l.displayName)}</span>
      </label>
    `).join(""),i=document.createElement("div");i.id="add-match-modal",i.setAttribute("role","dialog"),i.setAttribute("aria-modal","true"),i.setAttribute("aria-label","Add Match"),i.innerHTML=`
      <div class="modal-backdrop"></div>
      <div class="modal-sheet">
        <div class="modal-header">
          <h2 class="modal-title">Add Match</h2>
          <button class="icon-btn modal-close-btn" aria-label="Close">✕</button>
        </div>
        <form id="add-match-form" data-night-id="${a}">
          <div class="form-group">
            <label class="form-label" for="add-match-game">Game</label>
            <select id="add-match-game" class="form-input" required>
              <option value="">— select a game —</option>
              ${e}
            </select>
          </div>
          <div class="form-group">
            <div class="form-label">Players</div>
            <div style="max-height:200px;overflow-y:auto;padding:0.25rem 0">
              ${s}
            </div>
          </div>
          <div class="flex gap-2" style="margin-top:1rem">
            <button type="button" class="btn btn-secondary flex-1 modal-close-btn">Cancel</button>
            <button type="submit" class="btn btn-primary flex-1">Start Match</button>
          </div>
        </form>
      </div>
    `,document.body.appendChild(i),i.querySelectorAll(".modal-close-btn, .modal-backdrop").forEach(l=>{l.addEventListener("click",()=>i.remove())});const r=i.querySelector("#add-match-form");r.addEventListener("submit",async l=>{l.preventDefault();const o=parseInt(r.querySelector("#add-match-game").value,10);if(!o)return;const d=Array.from(r.querySelectorAll('input[name="player"]:checked')).map(c=>parseInt(c.value,10));if(d.length===0){u("Select at least one player","error");return}try{const c=await S({gameNightId:a,gameId:o,playerIds:d,status:"active",createdAt:Date.now()});i.remove(),v("match",{id:String(c)})}catch(c){console.error(c),u("Failed to create match","error")}})}afterRender(){var a;(a=document.getElementById("go-new-night"))==null||a.addEventListener("click",()=>{v("new-night")}),document.querySelectorAll("[data-player-filter]").forEach(t=>{t.addEventListener("click",()=>{const e=t.dataset.playerFilter;this.filterPlayerId=e==="null"?null:parseInt(e??"",10),this.refreshList()})}),document.querySelectorAll("[data-game-filter]").forEach(t=>{t.addEventListener("click",()=>{const e=t.dataset.gameFilter;this.filterGameId=e==="null"?null:parseInt(e??"",10),this.refreshList()})}),document.querySelectorAll(".history-header").forEach(t=>{const e=()=>{var o;const s=(o=t.closest(".history-item"))==null?void 0:o.dataset.nightId,i=document.getElementById(`night-body-${s}`),r=t.querySelector(".expand-icon");if(!i)return;const l=i.classList.contains("open");i.classList.toggle("open",!l),r&&(r.style.transform=l?"":"rotate(180deg)"),t.setAttribute("aria-expanded",String(!l))};t.addEventListener("click",e),t.addEventListener("keydown",s=>{(s.key==="Enter"||s.key===" ")&&(s.preventDefault(),e())})}),document.querySelectorAll(".delete-night-btn").forEach(t=>{t.addEventListener("click",async e=>{e.stopPropagation();const s=parseInt(e.currentTarget.dataset.nightId??"",10),i=this.nights.find(r=>r.night.id===s);if(i&&confirm(`Delete "${i.night.title}" and all its matches? This cannot be undone.`))try{await H(s),this.nights=this.nights.filter(r=>r.night.id!==s),this.refreshList(),u("Game night deleted","info")}catch(r){console.error(r),u("Failed to delete game night","error")}})}),document.querySelectorAll(".add-match-btn").forEach(t=>{t.addEventListener("click",e=>{e.stopPropagation();const s=parseInt(e.currentTarget.dataset.nightId??"",10);this.showAddMatchModal(s)})}),document.querySelectorAll(".resume-btn").forEach(t=>{t.addEventListener("click",e=>{e.stopPropagation();const s=e.currentTarget.dataset.matchId;s&&v("match",{id:s})})})}refreshList(){const a=document.getElementById("nights-list");if(!a)return;const t=this.getFilteredNights();t.length===0?a.innerHTML=`
        <div class="empty-state">
          <div class="empty-state-icon">📅</div>
          <div class="empty-state-title">No results</div>
          <p>Try removing a filter.</p>
        </div>
      `:(a.innerHTML=t.map(e=>this.renderNightItem(e)).join(""),this.afterRender()),document.querySelectorAll("[data-player-filter]").forEach(e=>{const s=e.dataset.playerFilter;e.classList.toggle("active",s==="null"?this.filterPlayerId===null:parseInt(s??"",10)===this.filterPlayerId)}),document.querySelectorAll("[data-game-filter]").forEach(e=>{const s=e.dataset.gameFilter;e.classList.toggle("active",s==="null"?this.filterGameId===null:parseInt(s??"",10)===this.filterGameId)})}}export{G as History};
