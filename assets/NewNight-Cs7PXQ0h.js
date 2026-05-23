var p=Object.defineProperty;var u=(l,t,e)=>t in l?p(l,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):l[t]=e;var m=(l,t,e)=>u(l,typeof t!="symbol"?t+"":t,e);import{b,c as y,n as h,s as o,d as v,e as f}from"./index-CiAI0UP5.js";class k{constructor(){m(this,"players",[]);m(this,"games",[]);m(this,"matches",[])}async load(){const[t,e]=await Promise.all([b(),y()]);this.players=t.filter(a=>a.active),this.games=e}escHtml(t){return t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}render(){const t=new Date().toISOString().split("T")[0],e=this.games.length===0?'<option value="">No games — add in Settings</option>':this.games.map(s=>`<option value="${s.id}">${this.escHtml(s.name)}</option>`).join(""),a=this.players.length===0?'<p class="text-sm text-muted">No players — add in Settings</p>':this.players.map(s=>`
          <label class="checkbox-item" for="player-check-${s.id}">
            <input type="checkbox" id="player-check-${s.id}" value="${s.id}" class="match-player-check" aria-label="${this.escHtml(s.displayName)}">
            <span class="player-dot" style="background:${s.color}"></span>
            <span>${this.escHtml(s.displayName)}</span>
          </label>
        `).join(""),n=this.renderMatchList();return`
      <main class="view" aria-label="New Game Night">
        <header class="page-header flex items-center gap-3">
          <button class="btn btn-icon" id="back-btn" aria-label="Go back">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <h1 class="page-title" style="font-size:1.375rem">New Game Night</h1>
        </header>

        <form id="new-night-form" novalidate>
          <section class="settings-section">
            <h2 class="settings-section-title">Night Details</h2>

            <div class="form-group">
              <label class="form-label" for="night-title">Title <span aria-hidden="true">*</span></label>
              <input class="form-input" type="text" id="night-title" name="title"
                placeholder="e.g. Friday Night Games" required maxlength="80"
                aria-required="true" autocomplete="off" />
              <span class="form-error" id="title-error" role="alert" aria-live="polite"></span>
            </div>

            <div class="form-group">
              <label class="form-label" for="night-date">Date</label>
              <input class="form-input" type="date" id="night-date" name="date" value="${t}" />
            </div>

            <div class="form-group">
              <label class="form-label" for="night-notes">Notes (optional)</label>
              <textarea class="form-textarea" id="night-notes" name="notes"
                placeholder="Any notes about tonight..." rows="2" maxlength="300"></textarea>
            </div>
          </section>

          <section class="settings-section">
            <h2 class="settings-section-title">Add Match</h2>

            <div class="form-group">
              <label class="form-label" for="match-game">Game</label>
              <select class="form-select" id="match-game" ${this.games.length===0?"disabled":""}>
                <option value="">— Select a game —</option>
                ${e}
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Players</label>
              <div id="player-checkboxes" role="group" aria-label="Select players">
                ${a}
              </div>
            </div>

            <button type="button" class="btn btn-secondary btn-full" id="add-match-btn"
              ${this.games.length===0||this.players.length===0?"disabled":""}>
              + Add Match to List
            </button>
          </section>

          <section class="settings-section">
            <div class="flex items-center justify-between mb-3">
              <h2 class="settings-section-title" style="margin-bottom:0">Matches to Play</h2>
              <span class="badge badge-primary" id="match-count">${this.matches.length}</span>
            </div>
            <div id="match-list">
              ${n}
            </div>
          </section>

          <div style="padding-bottom: 1rem">
            <button type="submit" class="btn btn-primary btn-full" id="start-night-btn"
              ${this.matches.length===0?"disabled":""}>
              🎮 Start Game Night
            </button>
          </div>
        </form>
      </main>
    `}renderMatchList(){return this.matches.length===0?'<p class="text-sm text-muted" id="no-matches-msg">No matches added yet. Add at least one above.</p>':this.matches.map((t,e)=>`
      <div class="player-list-item" data-match-index="${e}">
        <span style="font-size:1.25rem">🎯</span>
        <div>
          <div class="font-semibold text-sm">${this.escHtml(t.gameName)}</div>
          <div class="text-xs text-muted">${t.playerNames.map(a=>this.escHtml(a)).join(", ")}</div>
        </div>
        <div class="actions">
          <button type="button" class="btn btn-icon btn-sm remove-match-btn" data-index="${e}" aria-label="Remove match ${e+1}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6l-1 14H6L5 6"></path>
              <path d="M10 11v6M14 11v6"></path>
            </svg>
          </button>
        </div>
      </div>
    `).join("")}afterRender(){var t,e,a;(t=document.getElementById("back-btn"))==null||t.addEventListener("click",()=>{h("dashboard")}),(e=document.getElementById("add-match-btn"))==null||e.addEventListener("click",()=>{this.handleAddMatch()}),(a=document.getElementById("new-night-form"))==null||a.addEventListener("submit",n=>{n.preventDefault(),this.handleSubmit()}),this.bindRemoveButtons()}bindRemoveButtons(){document.querySelectorAll(".remove-match-btn").forEach(t=>{t.addEventListener("click",e=>{const a=parseInt(e.currentTarget.dataset.index??"0",10);this.matches.splice(a,1),this.refreshMatchList()})})}handleAddMatch(){const t=document.getElementById("match-game"),e=parseInt(t.value,10);if(!e){o("Please select a game","error");return}const a=document.querySelectorAll(".match-player-check:checked"),n=Array.from(a).map(i=>parseInt(i.value,10));if(n.length<1){o("Select at least one player","error");return}const s=this.games.find(i=>i.id===e);if(!s)return;const r=n.map(i=>{var c;return((c=this.players.find(d=>d.id===i))==null?void 0:c.displayName)??`Player ${i}`});this.matches.push({gameId:e,gameName:s.name,playerIds:n,playerNames:r}),this.refreshMatchList(),t.value="",document.querySelectorAll(".match-player-check").forEach(i=>{i.checked=!1}),o(`Added ${s.name} to the list`,"success")}refreshMatchList(){const t=document.getElementById("match-list");t&&(t.innerHTML=this.renderMatchList(),this.bindRemoveButtons());const e=document.getElementById("match-count");e&&(e.textContent=String(this.matches.length));const a=document.getElementById("start-night-btn");a&&(a.disabled=this.matches.length===0)}async handleSubmit(){const t=document.getElementById("night-title"),e=document.getElementById("night-date"),a=document.getElementById("night-notes"),n=document.getElementById("title-error"),s=t.value.trim();if(!s){t.classList.add("error"),n&&(n.textContent="Title is required"),t.focus();return}if(n&&(n.textContent=""),t.classList.remove("error"),this.matches.length===0){o("Add at least one match to the night","error");return}const r=document.getElementById("start-night-btn");r.disabled=!0,r.textContent="Creating...";try{const i=await v({title:s,date:e.value||new Date().toISOString().split("T")[0],notes:a.value.trim()||void 0,createdAt:Date.now()}),c=[];for(const d of this.matches){const g=await f({gameNightId:i,gameId:d.gameId,playerIds:d.playerIds,status:"active",createdAt:Date.now()});c.push(g)}o("Game night created!","success"),h("match",{id:String(c[0])})}catch(i){console.error("Failed to create game night:",i),o("Failed to create game night","error"),r.disabled=!1,r.textContent="🎮 Start Game Night"}}}export{k as NewNight};
