import{M as e,S as t,f as n,k as r,m as i,p as a,y as o}from"./index-DD03_IsR.js";import{n as s}from"./utils-BZltm_RL.js";import{a as c,i as l,n as u,r as d,t as f}from"./round-entry-C_vLGKZq.js";var p=class{matchId=0;match=null;game=null;players=[];entries=[];currentRound=1;async load(t){if(this.matchId=t,this.match=await r(t)??null,!this.match)return;let[n,i,a]=await Promise.all([o.games.get(this.match.gameId),o.players.where(`id`).anyOf(this.match.playerIds).toArray(),e(t)]);this.game=n??null,this.entries=a,this.players=this.match.playerIds.map(e=>i.find(t=>t.id===e)).filter(e=>e!==void 0),this.currentRound=a.length>0?Math.max(...a.map(e=>e.roundNumber))+1:1}roundLabel(e){let t=this.game?.roundLabels;return t&&t.length>=e?t[e-1]:`Round ${e}`}currentPhase(e){return d(this.entries,e.id,l(this.game?.roundLabels))}render(){if(!this.match||!this.game)return`<div class="si-screen"><p style="padding:2rem;font-size:1.25rem;color:var(--danger)">Match not found</p></div>`;if(this.match.status===`completed`)return`
        <div class="si-screen">
          <div class="si-header">
            <button class="si-close" id="si-close" aria-label="Close">✕</button>
            <div>
              <div class="si-game-name">${s(this.game.name)}</div>
              <div class="si-round">Match complete</div>
            </div>
          </div>
          <div style="flex:1;display:flex;align-items:center;justify-content:center;font-size:5rem">🏆</div>
        </div>`;let e=this.game.scoringMode,t=e===`phase10`,n=e===`finish-order`,r=this.players.map(e=>{if(t){let t=this.currentPhase(e);return t>l(this.game?.roundLabels)?`
          <div class="si-player" data-player-id="${e.id}" style="opacity:0.45">
            <div class="si-player-bar" style="background:${e.color}"></div>
            <div class="si-player-info">
              <div class="si-player-name">${s(e.displayName)}</div>
              <div class="si-player-sub">All phases done 🏆</div>
            </div>
          </div>`:`
          <div class="si-player" data-player-id="${e.id}">
            <div class="si-player-bar" style="background:${e.color}"></div>
            <div class="si-player-info">
              <div class="si-player-name">${s(e.displayName)}</div>
              <div class="si-player-sub">Phase ${t}</div>
            </div>
            <div class="si-player-controls">
              <input class="si-score-input" type="number" id="score-input-${e.id}"
                placeholder="0" min="0" step="5" inputmode="numeric"
                aria-label="${s(e.displayName)} penalty points" />
              <label class="si-checkbox-label">
                <input type="checkbox" id="completed-${e.id}" style="width:22px;height:22px;accent-color:${e.color}">
                <span>✓ Done</span>
              </label>
            </div>
          </div>`}return n?`
          <div class="si-player" data-player-id="${e.id}">
            <div class="si-player-bar" style="background:${e.color}"></div>
            <div class="si-player-info">
              <div class="si-player-name">${s(e.displayName)}</div>
            </div>
            <select class="si-order-select" id="score-input-${e.id}" aria-label="${s(e.displayName)} position">
              <option value="">Place</option>
              ${this.players.map((e,t)=>`<option value="${t+1}">${t+1}${[`st`,`nd`,`rd`][t]??`th`}</option>`).join(``)}
            </select>
          </div>`:`
        <div class="si-player" data-player-id="${e.id}">
          <div class="si-player-bar" style="background:${e.color}"></div>
          <div class="si-player-info">
            <div class="si-player-name">${s(e.displayName)}</div>
          </div>
          <input class="si-score-input" type="number" id="score-input-${e.id}"
            placeholder="0" step="1" inputmode="numeric"
            aria-label="${s(e.displayName)} score" />
        </div>`}).join(``),i=!t&&!n?`
      <div class="si-first-out">
        <div class="si-first-out-label">⚡ Who went out first?</div>
        <select class="si-first-out-select" id="first-out-select">
          <option value="">— none / unknown —</option>
          ${this.players.map(e=>`<option value="${e.id}">${s(e.displayName)}</option>`).join(``)}
        </select>
      </div>`:``;return`
      <div class="si-screen">
        <div class="si-header">
          <button class="si-close" id="si-close" aria-label="Close">✕</button>
          <div style="flex:1;min-width:0">
            <div class="si-game-name">${s(this.game.name)}</div>
            <div class="si-round">${s(this.roundLabel(this.currentRound))}</div>
          </div>
        </div>

        <div class="si-players" id="player-rows-container">
          ${r}
        </div>

        ${i}

        <div class="si-footer">
          <button class="btn btn-primary si-save-btn" id="si-save">
            ✓ Save ${s(this.roundLabel(this.currentRound))}
          </button>
          <button class="btn btn-secondary si-undo-btn" id="si-undo" ${this.entries.length===0?`disabled`:``}>
            ↩ Undo Last Round
          </button>
        </div>
      </div>`}afterRender(){document.getElementById(`si-close`)?.addEventListener(`click`,()=>{window.history.length>1?window.history.back():a(`dashboard`)}),document.getElementById(`si-save`)?.addEventListener(`click`,()=>{this.handleSave()}),document.getElementById(`si-undo`)?.addEventListener(`click`,()=>{this.handleUndo()}),document.getElementById(`first-out-select`)?.addEventListener(`change`,e=>{let t=e.target.value,n=document.getElementById(`player-rows-container`);if(!n)return;if(!t){c(this.players,n);return}let r=f(this.players,n,t);r&&document.getElementById(`score-input-${r.id}`)?.focus()});let e=Array.from(document.querySelectorAll(`.si-score-input`));e.forEach((t,n)=>{t.addEventListener(`keydown`,t=>{if(t.key===`Enter`){t.preventDefault();let r=e[n+1];r?r.focus():document.getElementById(`si-save`)?.click()}})}),e[0]?.focus()}async handleSave(){if(!this.match||!this.game)return;let e=this.game.scoringMode,{entries:t,error:r}=u(e,this.players,this.entries,l(this.game.roundLabels));if(r){n(r,e===`phase10`?`info`:`error`);return}let a=Date.now();try{for(let e of t)await i({matchId:this.matchId,playerId:e.playerId,roundNumber:this.currentRound,value:e.value,...e.note===void 0?{}:{note:e.note},createdAt:a});n(`${this.roundLabel(this.currentRound)} saved`,`success`),await this.load(this.matchId),this.reRender()}catch(e){console.error(`Failed to save scores:`,e),n(`Failed to save scores`,`error`)}}async handleUndo(){let e=this.currentRound-1;if(!(e<1))try{await t(this.matchId)&&(n(`Removed ${this.roundLabel(e)}`,`info`),await this.load(this.matchId),this.reRender())}catch(e){console.error(e),n(`Failed to undo`,`error`)}}teardown(){}reRender(){let e=document.getElementById(`view-container`);e&&(e.innerHTML=this.render(),this.afterRender())}};export{p as ScoreInput};