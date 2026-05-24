import{O as e,_ as t,f as n,g as r,j as i,p as a}from"./index-xa6lYevC.js";var o=class{players=[];games=[];matches=[];pending=null;async load(){let[t,n]=await Promise.all([i(),e()]);this.players=t.filter(e=>e.active),this.games=n}escHtml(e){return e.replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`)}render(){let e=new Date().toISOString().split(`T`)[0],t=this.games.length===0?`<option value="">No games — add in Settings</option>`:this.games.map(e=>`<option value="${e.id}">${this.escHtml(e.name)}</option>`).join(``),n=this.players.length===0?`<p class="text-sm text-muted">No players — add in Settings</p>`:this.players.map(e=>`
          <label class="checkbox-item" for="player-check-${e.id}">
            <input type="checkbox" id="player-check-${e.id}" value="${e.id}" class="match-player-check" aria-label="${this.escHtml(e.displayName)}">
            <span class="player-dot" style="background:${e.color}"></span>
            <span>${this.escHtml(e.displayName)}</span>
          </label>
        `).join(``),r=this.renderMatchList();return`
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
              <input class="form-input" type="date" id="night-date" name="date" value="${e}" />
            </div>

            <div class="form-group">
              <label class="form-label" for="night-notes">Notes (optional)</label>
              <textarea class="form-textarea" id="night-notes" name="notes"
                placeholder="Any notes about tonight..." rows="2" maxlength="300"></textarea>
            </div>
          </section>

          <section class="settings-section">
            <h2 class="settings-section-title">Add Match</h2>

            <div id="match-selector">
              <div class="form-group">
                <label class="form-label" for="match-game">Game</label>
                <select class="form-select" id="match-game" ${this.games.length===0?`disabled`:``}>
                  <option value="">— Select a game —</option>
                  ${t}
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Players</label>
                <div id="player-checkboxes" role="group" aria-label="Select players">
                  ${n}
                </div>
              </div>

              <button type="button" class="btn btn-secondary btn-full" id="add-match-btn"
                ${this.games.length===0||this.players.length===0?`disabled`:``}>
                + Add Match to List
              </button>
            </div>

            <div id="configure-panel" style="display:none">
              <div class="configure-panel-header">
                <span class="configure-panel-title">Player Order &amp; First Dealer</span>
                <span class="configure-panel-hint">Tap 🃏 to set the first dealer</span>
              </div>
              <div id="configure-player-list"></div>
              <div class="btn-group mt-3">
                <button type="button" class="btn btn-primary flex-1" id="confirm-add-btn">+ Add to List</button>
                <button type="button" class="btn btn-secondary" id="cancel-config-btn">Cancel</button>
              </div>
            </div>
          </section>

          <section class="settings-section">
            <div class="flex items-center justify-between mb-3">
              <h2 class="settings-section-title" style="margin-bottom:0">Matches to Play</h2>
              <span class="badge badge-primary" id="match-count">${this.matches.length}</span>
            </div>
            <div id="match-list">
              ${r}
            </div>
          </section>

          <div style="padding-bottom: 1rem">
            <button type="submit" class="btn btn-primary btn-full" id="start-night-btn"
              ${this.matches.length===0?`disabled`:``}>
              🎮 Start Game Night
            </button>
          </div>
        </form>
      </main>
    `}renderMatchList(){return this.matches.length===0?`<p class="text-sm text-muted" id="no-matches-msg">No matches added yet. Add at least one above.</p>`:this.matches.map((e,t)=>{let n=e.playerNames[e.firstDealerIndex]??``;return`
        <div class="player-list-item" data-match-index="${t}">
          <span style="font-size:1.25rem">🎯</span>
          <div style="flex:1; min-width:0">
            <div class="font-semibold text-sm">${this.escHtml(e.gameName)}</div>
            <div class="text-xs text-muted">${e.playerNames.map(e=>this.escHtml(e)).join(` → `)}</div>
            ${n?`<div class="text-xs text-muted">🃏 First dealer: ${this.escHtml(n)}</div>`:``}
          </div>
          <div class="actions">
            <button type="button" class="btn btn-icon btn-sm remove-match-btn" data-index="${t}" aria-label="Remove match ${t+1}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6l-1 14H6L5 6"></path>
                <path d="M10 11v6M14 11v6"></path>
              </svg>
            </button>
          </div>
        </div>
      `}).join(``)}renderConfigurePlayerList(){return this.pending?this.pending.playerIds.map((e,t)=>{let n=this.players.find(t=>t.id===e);if(!n)return``;let r=t===this.pending.firstDealerIndex,i=t===0,a=t===this.pending.playerIds.length-1;return`
        <div class="configure-player-row">
          <div class="configure-player-info">
            <span class="player-dot" style="background:${n.color}; flex-shrink:0"></span>
            <span class="configure-player-name">${this.escHtml(n.displayName)}</span>
          </div>
          <div class="configure-player-actions">
            <button type="button" class="btn btn-icon btn-sm configure-dealer-btn ${r?`dealer-selected`:``}"
              data-index="${t}" aria-label="Set as first dealer" title="First dealer" aria-pressed="${r}">
              🃏
            </button>
            <button type="button" class="btn btn-icon btn-sm move-up-btn" data-index="${t}"
              ${i?`disabled`:``} aria-label="Move up">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="18 15 12 9 6 15"/></svg>
            </button>
            <button type="button" class="btn btn-icon btn-sm move-down-btn" data-index="${t}"
              ${a?`disabled`:``} aria-label="Move down">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
          </div>
        </div>
      `}).join(``):``}afterRender(){document.getElementById(`back-btn`)?.addEventListener(`click`,()=>a(`dashboard`)),document.getElementById(`add-match-btn`)?.addEventListener(`click`,()=>{this.handleAddMatch()}),document.getElementById(`new-night-form`)?.addEventListener(`submit`,e=>{e.preventDefault(),this.handleSubmit()}),this.bindRemoveButtons()}bindRemoveButtons(){document.querySelectorAll(`.remove-match-btn`).forEach(e=>{e.addEventListener(`click`,e=>{let t=parseInt(e.currentTarget.dataset.index??`0`,10);this.matches.splice(t,1),this.refreshMatchList()})})}bindConfigurePanel(){document.getElementById(`confirm-add-btn`)?.addEventListener(`click`,()=>this.handleConfirmAdd()),document.getElementById(`cancel-config-btn`)?.addEventListener(`click`,()=>this.hideConfigurePanel()),document.querySelectorAll(`.configure-dealer-btn`).forEach(e=>{e.addEventListener(`click`,e=>{let t=parseInt(e.currentTarget.dataset.index??`0`,10);this.pending&&(this.pending.firstDealerIndex=t,this.refreshConfigurePanel())})}),document.querySelectorAll(`.move-up-btn`).forEach(e=>{e.addEventListener(`click`,e=>{let t=parseInt(e.currentTarget.dataset.index??`0`,10);this.movePlayer(t,-1)})}),document.querySelectorAll(`.move-down-btn`).forEach(e=>{e.addEventListener(`click`,e=>{let t=parseInt(e.currentTarget.dataset.index??`0`,10);this.movePlayer(t,1)})})}movePlayer(e,t){if(!this.pending)return;let n=this.pending.playerIds,r=e+t;r<0||r>=n.length||([n[e],n[r]]=[n[r],n[e]],this.pending.firstDealerIndex===e?this.pending.firstDealerIndex=r:this.pending.firstDealerIndex===r&&(this.pending.firstDealerIndex=e),this.refreshConfigurePanel())}refreshConfigurePanel(){let e=document.getElementById(`configure-player-list`);e&&(e.innerHTML=this.renderConfigurePlayerList()),this.bindConfigurePanel()}showConfigurePanel(){document.getElementById(`match-selector`).style.display=`none`;let e=document.getElementById(`configure-panel`);e.style.display=`block`,this.refreshConfigurePanel()}hideConfigurePanel(){this.pending=null,document.getElementById(`configure-panel`).style.display=`none`,document.getElementById(`match-selector`).style.display=`block`}handleAddMatch(){let e=document.getElementById(`match-game`),t=parseInt(e.value,10);if(!t){n(`Please select a game`,`error`);return}let r=document.querySelectorAll(`.match-player-check:checked`),i=Array.from(r).map(e=>parseInt(e.value,10));if(i.length<1){n(`Select at least one player`,`error`);return}let a=this.games.find(e=>e.id===t);a&&(this.pending={gameId:t,gameName:a.name,playerIds:i,firstDealerIndex:0},this.showConfigurePanel())}handleConfirmAdd(){if(!this.pending)return;let e=this.pending.playerIds.map(e=>this.players.find(t=>t.id===e)?.displayName??`Player ${e}`);this.matches.push({gameId:this.pending.gameId,gameName:this.pending.gameName,playerIds:[...this.pending.playerIds],playerNames:e,firstDealerIndex:this.pending.firstDealerIndex});let t=document.getElementById(`match-game`);t&&(t.value=``),document.querySelectorAll(`.match-player-check`).forEach(e=>{e.checked=!1}),n(`Added ${this.pending.gameName} to the list`,`success`),this.hideConfigurePanel(),this.refreshMatchList()}refreshMatchList(){let e=document.getElementById(`match-list`);e&&(e.innerHTML=this.renderMatchList(),this.bindRemoveButtons());let t=document.getElementById(`match-count`);t&&(t.textContent=String(this.matches.length));let n=document.getElementById(`start-night-btn`);n&&(n.disabled=this.matches.length===0)}async handleSubmit(){let e=document.getElementById(`night-title`),i=document.getElementById(`night-date`),o=document.getElementById(`night-notes`),s=document.getElementById(`title-error`),c=e.value.trim();if(!c){e.classList.add(`error`),s&&(s.textContent=`Title is required`),e.focus();return}if(s&&(s.textContent=``),e.classList.remove(`error`),this.matches.length===0){n(`Add at least one match to the night`,`error`);return}let l=document.getElementById(`start-night-btn`);l.disabled=!0,l.textContent=`Creating...`;try{let e=await r({title:c,date:i.value||new Date().toISOString().split(`T`)[0],notes:o.value.trim()||void 0,createdAt:Date.now()}),s=[];for(let n of this.matches){let r=await t({gameNightId:e,gameId:n.gameId,playerIds:n.playerIds,status:`active`,firstDealerIndex:n.firstDealerIndex,createdAt:Date.now()});s.push(r)}n(`Game night created!`,`success`),a(`match`,{id:String(s[0])})}catch(e){console.error(`Failed to create game night:`,e),n(`Failed to create game night`,`error`),l.disabled=!1,l.textContent=`🎮 Start Game Night`}}};export{o as NewNight};