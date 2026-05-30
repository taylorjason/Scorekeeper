import{E as e,M as t,a as n,i as r,k as i,p as a,y as o}from"./index-DHLnSXn1.js";var s=class{matchId=0;match=null;game=null;night=null;players=[];entries=[];playerScores=[];currentRound=0;lastUpdated=new Date;_view=`cards`;_pollInterval=null;_dataChangedHandler=null;async load(e){this.matchId=e,await this._fetchData()}async _fetchData(){if(this.match=await i(this.matchId)??null,!this.match)return;let[n,r,a,s]=await Promise.all([o.games.get(this.match.gameId),e(this.match.gameNightId),o.players.where(`id`).anyOf(this.match.playerIds).toArray(),t(this.matchId)]);this.game=n??null,this.night=r??null,this.entries=s,this.players=this.match.playerIds.map(e=>a.find(t=>t.id===e)).filter(e=>e!==void 0),this._computeScores(),this.currentRound=this.entries.length>0?Math.max(...this.entries.map(e=>e.roundNumber)):0,this.lastUpdated=new Date}_getPlayerPhase(e){let t=this.entries.filter(t=>t.playerId===e.id).sort((e,t)=>e.roundNumber-t.roundNumber),n=1;for(let e of t)if(e.note)try{let t=JSON.parse(e.note);t.completed&&t.phase===n&&(n=Math.min(n+1,11))}catch{}return n}_computeScores(){let e=this.game?.scoringMode;this.playerScores=this.players.map(t=>({player:t,total:this.entries.filter(e=>e.playerId===t.id).reduce((e,t)=>e+t.value,0),phase:e===`phase10`?this._getPlayerPhase(t):void 0})),e===`phase10`?this.playerScores.sort((e,t)=>{let n=e.phase??1,r=t.phase??1;return r===n?e.total-t.total:r-n}):e===`low`?this.playerScores.sort((e,t)=>e.total-t.total):this.playerScores.sort((e,t)=>t.total-e.total)}_esc(e){return e.replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`)}_roundLabel(e){let t=this.game?.roundLabels;return t&&t.length>=e?t[e-1]:`Round ${e}`}_isTied(e,t){return this.game?.scoringMode===`phase10`?(e.phase??1)===(t.phase??1)&&e.total===t.total:e.total===t.total}_effectiveRanks(){let e=[];for(let t=0;t<this.playerScores.length;t++){if(t===0){e.push(0);continue}e.push(this._isTied(this.playerScores[t],this.playerScores[t-1])?e[t-1]:t)}return e}_currentDealerId(){if(this.match?.firstDealerIndex==null||this.players.length===0)return null;let e=(this.match.firstDealerIndex+this.currentRound)%this.players.length;return this.match.playerIds[e]??null}_currentRoundBannerText(){let e=this.game?.scoringMode===`phase10`,t=this.match?.status===`completed`;if(e)return t?`${this.currentRound} Hand${this.currentRound===1?``:`s`} Played`:`Hand ${this.currentRound+1}`;let n=t?this.currentRound:this.currentRound+1;return this._roundLabel(n)}_renderCards(){let e=this.game?.scoringMode===`phase10`,t=this.game?.scoringMode===`low`,n=this._currentDealerId(),r=this._effectiveRanks();return this.playerScores.map((i,a)=>{let o=r[a],s=o===0?`sb-rank-1`:o===1?`sb-rank-2`:o===2?`sb-rank-3`:``,c=i.player.id===n,l=o===0?`🥇`:o===1?`🥈`:o===2?`🥉`:String(o+1),u=o<3?`<span class="sb-medal">${l}</span>`:`<span class="sb-rank-num">${l}</span>`,d;if(e){let e=i.phase??1;d=`
          <div class="sb-phase">${e>10?`🏆 Done`:`Phase ${e}`}</div>
          <div class="sb-penalty">${i.total} pts</div>`}else{let e=``;if(o>0&&this.playerScores.length>1){let n=t?i.total-this.playerScores[0].total:this.playerScores[0].total-i.total;n>0?e=`<div class="sb-gap">${t?`+`:`−`}${n} behind</div>`:n===0&&(e=`<div class="sb-gap sb-gap--tie">TIE</div>`)}d=`
          <div class="sb-score-area">
            <div class="sb-score">${i.total}</div>
            ${e}
          </div>`}return`
        <div class="sb-player ${s}" style="--pc:${i.player.color}">
          <div class="sb-rank-area">${u}</div>
          <div class="sb-player-body">
            <div class="sb-name">
              ${this._esc(i.player.displayName)}
              ${c&&this.match?.status!==`completed`?`<span class="sb-dealer-badge">🃏</span>`:``}
            </div>
            ${d}
          </div>
        </div>`}).join(``)}_renderTableView(){if(this.players.length===0)return`<p class="sb-error">No players</p>`;let e=this.currentRound>0?Array.from({length:this.currentRound},(e,t)=>t+1):[];return`<div class="sbt-wrap"><table class="sbt">
      <thead>${`<tr>
      <th class="sbt-corner"></th>
      ${this.players.map(e=>`<th class="sbt-player-head" style="--pc:${e.color}">
        <span class="sbt-dot" style="background:${e.color}"></span>
        ${this._esc(e.displayName)}
      </th>`).join(``)}
    </tr>`}</thead>
      <tbody>${e.map(e=>{let t=this.players.map(t=>{let n=this.entries.find(n=>n.playerId===t.id&&n.roundNumber===e);return`<td class="sbt-cell">${n==null?`—`:n.value}</td>`}).join(``);return`<tr><td class="sbt-label">${this._esc(this._roundLabel(e))}</td>${t}</tr>`}).join(``)}${`<tr class="sbt-total-row"><td class="sbt-label sbt-label--total">Total</td>${this.players.map(e=>`<td class="sbt-total">${this.entries.filter(t=>t.playerId===e.id).reduce((e,t)=>e+t.value,0)}</td>`).join(``)}</tr>`}</tbody>
    </table></div>`}render(){if(!this.match||!this.game||!this.night)return`<div class="scoreboard"><p class="sb-error">Match not found</p></div>`;let e=this.match.status===`completed`,t=this.currentRound>0?`Round ${this.currentRound}${e?` · Final`:``}`:e?`Final`:`No scores yet`,n=e?`<span class="sb-badge-final">Final</span>`:`<div class="sb-live"><div class="sb-live-dot"></div><span>Live</span></div>`,r=this._currentRoundBannerText(),i=this._view===`cards`,a=`
      <button class="sb-view-btn ${i?`sb-view-btn--active`:``}" id="sb-view-cards" aria-label="Card view" title="Card view">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
          <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
        </svg>
      </button>
      <button class="sb-view-btn ${i?``:`sb-view-btn--active`}" id="sb-view-table" aria-label="Table view" title="Table view">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/>
          <line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="9" x2="9" y2="21"/>
        </svg>
      </button>`;return`
      <div class="scoreboard">
        <div class="sb-header">
          <div class="sb-header-left">
            <div class="sb-game-name">${this._esc(this.game.name)}</div>
            <div class="sb-night-name" id="sb-night-name">${this._esc(this.night.title)} · ${t}</div>
          </div>
          <div class="sb-header-right">
            ${a}
            ${n}
            <button class="sb-close" id="sb-close" aria-label="Close scoreboard">✕</button>
          </div>
        </div>

        ${r?`<div class="sb-round-banner" id="sb-round-banner">${this._esc(r)}</div>`:``}

        <div class="sb-players" id="sb-players">
          ${i?this._renderCards():this._renderTableView()}
        </div>

        <div class="sb-footer" id="sb-footer">
          Updated ${this.lastUpdated.toLocaleTimeString()}
        </div>
      </div>`}afterRender(){document.getElementById(`sb-close`)?.addEventListener(`click`,()=>{window.history.length>1?window.history.back():a(`dashboard`)}),document.getElementById(`sb-view-cards`)?.addEventListener(`click`,()=>{this._view!==`cards`&&(this._view=`cards`,this._patch())}),document.getElementById(`sb-view-table`)?.addEventListener(`click`,()=>{this._view!==`table`&&(this._view=`table`,this._patch())}),this._pollInterval=setInterval(()=>{this._fetchData().then(()=>this._patch()).catch(()=>{})},5e3),this._dataChangedHandler=()=>{this._fetchData().then(()=>this._patch()).catch(()=>{})},window.addEventListener(`scorekeeper:datachanged`,this._dataChangedHandler);let e=r();e&&n(e,()=>{this._fetchData().then(()=>this._patch()).catch(()=>{})}).catch(()=>{})}_patch(){let e=document.getElementById(`sb-players`);if(e){let t=document.querySelector(`.main-content`),n=t?.scrollTop??0,r=e.querySelector(`.sbt-wrap`)?.scrollLeft??0;e.innerHTML=this._view===`cards`?this._renderCards():this._renderTableView(),t&&(t.scrollTop=n);let i=e.querySelector(`.sbt-wrap`);i&&(i.scrollLeft=r)}if(document.getElementById(`sb-view-cards`)?.classList.toggle(`sb-view-btn--active`,this._view===`cards`),document.getElementById(`sb-view-table`)?.classList.toggle(`sb-view-btn--active`,this._view===`table`),this.game&&this.night){let e=this.match?.status===`completed`,t=this.currentRound>0?`Round ${this.currentRound}${e?` · Final`:``}`:e?`Final`:`No scores yet`,n=document.getElementById(`sb-night-name`);n&&(n.textContent=`${this.night.title} · ${t}`)}let t=document.getElementById(`sb-round-banner`);t&&(t.textContent=this._currentRoundBannerText());let n=document.getElementById(`sb-footer`);n&&(n.textContent=`Updated ${this.lastUpdated.toLocaleTimeString()}`)}teardown(){this._pollInterval&&=(clearInterval(this._pollInterval),null),this._dataChangedHandler&&=(window.removeEventListener(`scorekeeper:datachanged`,this._dataChangedHandler),null)}};export{s as Scoreboard};