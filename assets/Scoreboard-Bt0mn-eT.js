import{E as e,M as t,a as n,i as r,k as i,p as a,y as o}from"./index-xa6lYevC.js";var s=class{matchId=0;match=null;game=null;night=null;players=[];entries=[];playerScores=[];currentRound=0;lastUpdated=new Date;_pollInterval=null;_dataChangedHandler=null;async load(e){this.matchId=e,await this._fetchData()}async _fetchData(){if(this.match=await i(this.matchId)??null,!this.match)return;let[n,r,a,s]=await Promise.all([o.games.get(this.match.gameId),e(this.match.gameNightId),o.players.where(`id`).anyOf(this.match.playerIds).toArray(),t(this.matchId)]);this.game=n??null,this.night=r??null,this.entries=s,this.players=this.match.playerIds.map(e=>a.find(t=>t.id===e)).filter(e=>e!==void 0),this._computeScores(),this.currentRound=this.entries.length>0?Math.max(...this.entries.map(e=>e.roundNumber)):0,this.lastUpdated=new Date}_getPlayerPhase(e){let t=this.entries.filter(t=>t.playerId===e.id).sort((e,t)=>e.roundNumber-t.roundNumber),n=1;for(let e of t)if(e.note)try{let t=JSON.parse(e.note);t.completed&&t.phase===n&&(n=Math.min(n+1,11))}catch{}return n}_computeScores(){let e=this.game?.scoringMode;this.playerScores=this.players.map(t=>({player:t,total:this.entries.filter(e=>e.playerId===t.id).reduce((e,t)=>e+t.value,0),phase:e===`phase10`?this._getPlayerPhase(t):void 0})),e===`phase10`?this.playerScores.sort((e,t)=>{let n=e.phase??1,r=t.phase??1;return r===n?e.total-t.total:r-n}):e===`low`?this.playerScores.sort((e,t)=>e.total-t.total):this.playerScores.sort((e,t)=>t.total-e.total)}_esc(e){return e.replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`)}_roundLabel(e){let t=this.game?.roundLabels;return t&&t.length>=e?t[e-1]:`Round ${e}`}_currentDealerId(){if(this.match?.firstDealerIndex==null||this.players.length===0)return null;let e=(this.match.firstDealerIndex+this.currentRound)%this.players.length;return this.match.playerIds[e]??null}_currentRoundBannerText(){let e=this.game?.scoringMode===`phase10`,t=this.match?.status===`completed`;if(e)return t?`${this.currentRound} Hand${this.currentRound===1?``:`s`} Played`:`Hand ${this.currentRound+1}`;let n=t?this.currentRound:this.currentRound+1;return this._roundLabel(n)}_renderCards(){let e=this.game?.scoringMode===`phase10`,t=this.game?.scoringMode===`low`,n=this._currentDealerId();return this.playerScores.map((r,i)=>{let a=i===0?`sb-rank-1`:i===1?`sb-rank-2`:i===2?`sb-rank-3`:``,o=r.player.id===n,s=i===0?`🥇`:i===1?`🥈`:i===2?`🥉`:String(i+1),c=i<3?`<span class="sb-medal">${s}</span>`:`<span class="sb-rank-num">${s}</span>`,l;if(e){let e=r.phase??1;l=`
          <div class="sb-phase">${e>10?`🏆 Done`:`Phase ${e}`}</div>
          <div class="sb-penalty">${r.total} pts</div>`}else{let e=``;if(i>0&&this.playerScores.length>1){let n=t?r.total-this.playerScores[0].total:this.playerScores[0].total-r.total;n>0&&(e=`<div class="sb-gap">${t?`+`:`−`}${n} back</div>`)}l=`
          <div class="sb-score-area">
            <div class="sb-score">${r.total}</div>
            ${e}
          </div>`}return`
        <div class="sb-player ${a}" style="--pc:${r.player.color}">
          <div class="sb-rank-area">${c}</div>
          <div class="sb-player-body">
            <div class="sb-name">
              ${this._esc(r.player.displayName)}
              ${o&&this.match?.status!==`completed`?`<span class="sb-dealer-badge">🃏</span>`:``}
            </div>
            ${l}
          </div>
        </div>`}).join(``)}render(){if(!this.match||!this.game||!this.night)return`<div class="scoreboard"><p class="sb-error">Match not found</p></div>`;let e=this.match.status===`completed`,t=this.currentRound>0?`Round ${this.currentRound}${e?` · Final`:``}`:e?`Final`:`No scores yet`,n=e?`<span class="sb-badge-final">Final</span>`:`<div class="sb-live"><div class="sb-live-dot"></div><span>Live</span></div>`,r=this._currentRoundBannerText();return`
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

        ${r?`<div class="sb-round-banner" id="sb-round-banner">${this._esc(r)}</div>`:``}

        <div class="sb-players" id="sb-players">
          ${this._renderCards()}
        </div>

        <div class="sb-footer" id="sb-footer">
          Updated ${this.lastUpdated.toLocaleTimeString()}
        </div>
      </div>`}afterRender(){document.getElementById(`sb-close`)?.addEventListener(`click`,()=>{window.history.length>1?window.history.back():a(`dashboard`)}),this._pollInterval=setInterval(()=>{this._fetchData().then(()=>this._patch()).catch(()=>{})},5e3),this._dataChangedHandler=()=>{this._fetchData().then(()=>this._patch()).catch(()=>{})},window.addEventListener(`scorekeeper:datachanged`,this._dataChangedHandler);let e=r();e&&n(e,()=>{this._fetchData().then(()=>this._patch()).catch(()=>{})}).catch(()=>{})}_patch(){let e=document.getElementById(`sb-players`);if(e&&(e.innerHTML=this._renderCards()),this.game&&this.night){let e=this.match?.status===`completed`,t=this.currentRound>0?`Round ${this.currentRound}${e?` · Final`:``}`:e?`Final`:`No scores yet`,n=document.getElementById(`sb-night-name`);n&&(n.textContent=`${this.night.title} · ${t}`)}let t=document.getElementById(`sb-round-banner`);t&&(t.textContent=this._currentRoundBannerText());let n=document.getElementById(`sb-footer`);n&&(n.textContent=`Updated ${this.lastUpdated.toLocaleTimeString()}`)}teardown(){this._pollInterval&&=(clearInterval(this._pollInterval),null),this._dataChangedHandler&&=(window.removeEventListener(`scorekeeper:datachanged`,this._dataChangedHandler),null)}};export{s as Scoreboard};