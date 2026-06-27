import{M as e,S as t,f as n,k as r,m as i,p as a,y as o}from"./index-vN90WraJ.js";import{n as s}from"./utils-BZltm_RL.js";var c=class{matchId=0;match=null;game=null;players=[];entries=[];currentRound=1;async load(t){if(this.matchId=t,this.match=await r(t)??null,!this.match)return;let[n,i,a]=await Promise.all([o.games.get(this.match.gameId),o.players.where(`id`).anyOf(this.match.playerIds).toArray(),e(t)]);this.game=n??null,this.entries=a,this.players=this.match.playerIds.map(e=>i.find(t=>t.id===e)).filter(e=>e!==void 0),this.currentRound=a.length>0?Math.max(...a.map(e=>e.roundNumber))+1:1}roundLabel(e){let t=this.game?.roundLabels;return t&&t.length>=e?t[e-1]:`Round ${e}`}getPlayerCurrentPhase(e){let t=this.entries.filter(t=>t.playerId===e.id).sort((e,t)=>e.roundNumber-t.roundNumber),n=1;for(let e of t)if(e.note)try{let t=JSON.parse(e.note);t.completed&&t.phase===n&&(n=Math.min(n+1,11))}catch{}return n}render(){if(!this.match||!this.game)return`<div class="si-screen"><p style="padding:2rem;font-size:1.25rem;color:var(--danger)">Match not found</p></div>`;if(this.match.status===`completed`)return`
        <div class="si-screen">
          <div class="si-header">
            <button class="si-close" id="si-close" aria-label="Close">✕</button>
            <div>
              <div class="si-game-name">${s(this.game.name)}</div>
              <div class="si-round">Match complete</div>
            </div>
          </div>
          <div style="flex:1;display:flex;align-items:center;justify-content:center;font-size:5rem">🏆</div>
        </div>`;let e=this.game.scoringMode,t=e===`phase10`,n=e===`finish-order`,r=this.players.map(e=>{if(t){let t=this.getPlayerCurrentPhase(e);return t>10?`
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
      </div>`}afterRender(){document.getElementById(`si-close`)?.addEventListener(`click`,()=>{window.history.length>1?window.history.back():a(`dashboard`)}),document.getElementById(`si-save`)?.addEventListener(`click`,()=>{this.handleSave()}),document.getElementById(`si-undo`)?.addEventListener(`click`,()=>{this.handleUndo()}),document.getElementById(`first-out-select`)?.addEventListener(`change`,e=>{let t=e.target.value,n=document.getElementById(`player-rows-container`);if(!n)return;if(!t){let e=Array.from(n.querySelectorAll(`[data-player-id]`)),t=new Map(e.map(e=>[e.dataset.playerId,e]));this.players.forEach(e=>{let r=t.get(String(e.id));r&&n.appendChild(r)});return}let r=Array.from(n.querySelectorAll(`[data-player-id]`)).find(e=>e.dataset.playerId===t);if(!r)return;n.insertBefore(r,n.firstChild);let i=document.getElementById(`score-input-${t}`);i&&(i.value=`0`);let a=Array.from(n.querySelectorAll(`[data-player-id]`)).filter(e=>e.dataset.playerId!==t)[0]?.dataset.playerId;a&&document.getElementById(`score-input-${a}`)?.focus()});let e=Array.from(document.querySelectorAll(`.si-score-input`));e.forEach((t,n)=>{t.addEventListener(`keydown`,t=>{if(t.key===`Enter`){t.preventDefault();let r=e[n+1];r?r.focus():document.getElementById(`si-save`)?.click()}})}),e[0]?.focus()}async handleSave(){if(!this.match||!this.game)return;let e=this.game.scoringMode,t=[];if(e===`phase10`){for(let e of this.players){let n=this.getPlayerCurrentPhase(e);if(n>10)continue;let r=document.getElementById(`score-input-${e.id}`),i=parseFloat(r?.value??`0`)||0,a=document.getElementById(`completed-${e.id}`)?.checked??!1,o=JSON.stringify({phase:n,completed:a});t.push({playerId:e.id,value:i,note:o})}if(t.length===0){n(`All players have completed all phases`,`info`);return}}else if(e===`finish-order`){let e=new Set;for(let r of this.players){let i=document.getElementById(`score-input-${r.id}`),a=parseInt(i?.value??``,10);if(!a||isNaN(a)){n(`Set position for ${r.displayName}`,`error`);return}if(e.has(a)){n(`Each player must have a unique position`,`error`);return}e.add(a),t.push({playerId:r.id,value:this.players.length-a+1})}}else{let e=document.getElementById(`first-out-select`)?.value??``;for(let n of this.players){let r=document.getElementById(`score-input-${n.id}`),i=parseFloat(r?.value??`0`)||0,a=e===String(n.id);t.push({playerId:n.id,value:i,...a?{note:`first_out`}:{}})}}let r=Date.now();try{for(let e of t)await i({matchId:this.matchId,playerId:e.playerId,roundNumber:this.currentRound,value:e.value,...e.note===void 0?{}:{note:e.note},createdAt:r});n(`${this.roundLabel(this.currentRound)} saved`,`success`),await this.load(this.matchId),this.reRender()}catch(e){console.error(`Failed to save scores:`,e),n(`Failed to save scores`,`error`)}}async handleUndo(){let e=this.currentRound-1;if(!(e<1))try{await t(this.matchId)&&(n(`Removed ${this.roundLabel(e)}`,`info`),await this.load(this.matchId),this.reRender())}catch(e){console.error(e),n(`Failed to undo`,`error`)}}teardown(){}reRender(){let e=document.getElementById(`view-container`);e&&(e.innerHTML=this.render(),this.afterRender())}};export{c as ScoreInput};