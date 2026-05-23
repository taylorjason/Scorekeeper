import{E as e,M as t,a as n,i as r,k as i,p as a,y as o}from"./index-DWzhef4u.js";var s=class{matchId=0;match=null;game=null;night=null;players=[];entries=[];playerScores=[];currentRound=0;lastUpdated=new Date;_pollInterval=null;_dataChangedHandler=null;async load(e){this.matchId=e,await this._fetchData()}async _fetchData(){if(this.match=await i(this.matchId)??null,!this.match)return;let[n,r,a,s]=await Promise.all([o.games.get(this.match.gameId),e(this.match.gameNightId),o.players.where(`id`).anyOf(this.match.playerIds).toArray(),t(this.matchId)]);this.game=n??null,this.night=r??null,this.entries=s,this.players=this.match.playerIds.map(e=>a.find(t=>t.id===e)).filter(e=>e!==void 0),this._computeScores(),this.currentRound=this.entries.length>0?Math.max(...this.entries.map(e=>e.roundNumber)):0,this.lastUpdated=new Date}_getPlayerPhase(e){let t=this.entries.filter(t=>t.playerId===e.id).sort((e,t)=>e.roundNumber-t.roundNumber),n=1;for(let e of t)if(e.note)try{let t=JSON.parse(e.note);t.completed&&t.phase===n&&(n=Math.min(n+1,11))}catch{}return n}_computeScores(){let e=this.game?.scoringMode;this.playerScores=this.players.map(t=>({player:t,total:this.entries.filter(e=>e.playerId===t.id).reduce((e,t)=>e+t.value,0),phase:e===`phase10`?this._getPlayerPhase(t):void 0})),e===`phase10`?this.playerScores.sort((e,t)=>{let n=e.phase??1,r=t.phase??1;return r===n?e.total-t.total:r-n}):e===`low`?this.playerScores.sort((e,t)=>e.total-t.total):this.playerScores.sort((e,t)=>t.total-e.total)}_esc(e){return e.replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`)}_renderCards(){let e=this.game?.scoringMode===`phase10`,t=this.game?.scoringMode===`low`;return this.playerScores.map((n,r)=>{let i=r===0?`sb-rank-1`:r===1?`sb-rank-2`:r===2?`sb-rank-3`:``,a=r===0?`🥇`:r===1?`🥈`:r===2?`🥉`:String(r+1),o=r<3?`<span class="sb-medal">${a}</span>`:`<span class="sb-rank-num">${a}</span>`,s;if(e){let e=n.phase??1;s=`
          <div class="sb-score-area">
            <div class="sb-phase">${e>10?`🏆 Done`:`Phase ${e}`}</div>
            <div class="sb-penalty">${n.total} pts</div>
          </div>`}else{let e=``;if(r>0&&this.playerScores.length>1){let r=t?n.total-this.playerScores[0].total:this.playerScores[0].total-n.total;r>0&&(e=`<div class="sb-gap">${t?`+`:`-`}${r}</div>`)}s=`
          <div class="sb-score-area">
            <div class="sb-score">${n.total}</div>
            ${e}
          </div>`}return`
        <div class="sb-player ${i}" style="--pc:${n.player.color}">
          <div class="sb-rank-area">${o}</div>
          <div class="sb-player-body">
            <div class="sb-name">${this._esc(n.player.displayName)}</div>
            ${s}
          </div>
        </div>`}).join(``)}render(){if(!this.match||!this.game||!this.night)return`<div class="scoreboard"><p class="sb-error">Match not found</p></div>`;let e=this.match.status===`completed`,t=this.currentRound>0?`Round ${this.currentRound}${e?` · Final`:``}`:e?`Final`:`No scores yet`,n=e?`<span class="sb-badge-final">Final</span>`:`<div class="sb-live"><div class="sb-live-dot"></div><span>Live</span></div>`;return`
      <div class="scoreboard">
        <div class="sb-header">
          <div class="sb-header-left">
            <div class="sb-game-name">${this._esc(this.game.name)}</div>
            <div class="sb-night-name" id="sb-night-name">${this._esc(this.night.title)} · ${t}</div>
          </div>
          <div class="sb-header-right">
            ${n}
            <button class="sb-close" id="sb-close" aria-label="Close scoreboard">✕</button>
          </div>
        </div>

        <div class="sb-players" id="sb-players">
          ${this._renderCards()}
        </div>

        <div class="sb-footer" id="sb-footer">
          Updated ${this.lastUpdated.toLocaleTimeString()}
        </div>
      </div>`}afterRender(){document.getElementById(`sb-close`)?.addEventListener(`click`,()=>{window.history.length>1?window.history.back():a(`dashboard`)}),this._pollInterval=setInterval(()=>{this._fetchData().then(()=>this._patch()).catch(()=>{})},5e3),this._dataChangedHandler=()=>{this._fetchData().then(()=>this._patch()).catch(()=>{})},window.addEventListener(`scorekeeper:datachanged`,this._dataChangedHandler);let e=r();e&&n(e,()=>{this._fetchData().then(()=>this._patch()).catch(()=>{})}).catch(()=>{})}_patch(){let e=document.getElementById(`sb-players`);if(e&&(e.innerHTML=this._renderCards()),this.game&&this.night){let e=this.match?.status===`completed`,t=this.currentRound>0?`Round ${this.currentRound}${e?` · Final`:``}`:e?`Final`:`No scores yet`,n=document.getElementById(`sb-night-name`);n&&(n.textContent=`${this.night.title} · ${t}`)}let t=document.getElementById(`sb-footer`);t&&(t.textContent=`Updated ${this.lastUpdated.toLocaleTimeString()}`)}teardown(){this._pollInterval&&=(clearInterval(this._pollInterval),null),this._dataChangedHandler&&=(window.removeEventListener(`scorekeeper:datachanged`,this._dataChangedHandler),null)}};export{s as Scoreboard};