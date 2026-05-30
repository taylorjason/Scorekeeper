import{E as e,M as t,a as n,i as r,k as i,p as a,y as o}from"./index-DYKgUZpr.js";function s(e){let t=Math.floor(e/1e3),n=Math.floor(t/3600),r=Math.floor(t%3600/60),i=t%60;return n>0?`${n}h ${String(r).padStart(2,`0`)}m`:r>0?`${r}m ${String(i).padStart(2,`0`)}s`:`${i}s`}var c=class{matchId=0;match=null;game=null;night=null;players=[];entries=[];playerScores=[];currentRound=0;lastUpdated=new Date;_view=`cards`;_pollInterval=null;_dataChangedHandler=null;async load(e){this.matchId=e,await this._fetchData()}async _fetchData(){if(this.match=await i(this.matchId)??null,!this.match)return;let[n,r,a,s]=await Promise.all([o.games.get(this.match.gameId),e(this.match.gameNightId),o.players.where(`id`).anyOf(this.match.playerIds).toArray(),t(this.matchId)]);this.game=n??null,this.night=r??null,this.entries=s,this.players=this.match.playerIds.map(e=>a.find(t=>t.id===e)).filter(e=>e!==void 0),this._computeScores(),this.currentRound=this.entries.length>0?Math.max(...this.entries.map(e=>e.roundNumber)):0,this.lastUpdated=new Date}_getPlayerPhase(e){let t=this.entries.filter(t=>t.playerId===e.id).sort((e,t)=>e.roundNumber-t.roundNumber),n=1;for(let e of t)if(e.note)try{let t=JSON.parse(e.note);t.completed&&t.phase===n&&(n=Math.min(n+1,11))}catch{}return n}_computeScores(){let e=this.game?.scoringMode;this.playerScores=this.players.map(t=>({player:t,total:this.entries.filter(e=>e.playerId===t.id).reduce((e,t)=>e+t.value,0),phase:e===`phase10`?this._getPlayerPhase(t):void 0})),e===`phase10`?this.playerScores.sort((e,t)=>{let n=e.phase??1,r=t.phase??1;return r===n?e.total-t.total:r-n}):e===`low`?this.playerScores.sort((e,t)=>e.total-t.total):this.playerScores.sort((e,t)=>t.total-e.total)}_esc(e){return e.replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`)}_roundLabel(e){let t=this.game?.roundLabels;return t&&t.length>=e?t[e-1]:`Round ${e}`}_isTied(e,t){return this.game?.scoringMode===`phase10`?(e.phase??1)===(t.phase??1)&&e.total===t.total:e.total===t.total}_effectiveRanks(){let e=[];for(let t=0;t<this.playerScores.length;t++){if(t===0){e.push(0);continue}e.push(this._isTied(this.playerScores[t],this.playerScores[t-1])?e[t-1]:t)}return e}_currentDealerId(){if(this.match?.firstDealerIndex==null||this.players.length===0)return null;let e=(this.match.firstDealerIndex+this.currentRound)%this.players.length;return this.match.playerIds[e]??null}_currentRoundBannerText(){let e=this.game?.scoringMode===`phase10`,t=this.match?.status===`completed`;if(e)return t?`${this.currentRound} Hand${this.currentRound===1?``:`s`} Played`:`Hand ${this.currentRound+1}`;let n=t?this.currentRound:this.currentRound+1;return this._roundLabel(n)}_renderCards(){let e=this.game?.scoringMode===`phase10`,t=this.game?.scoringMode===`low`,n=this._currentDealerId(),r=this._effectiveRanks(),i=new Map;if(!e&&this.currentRound>=2){let e=this.currentRound-1,n=new Map;for(let t of this.players)n.set(t.id,this.entries.filter(n=>n.playerId===t.id&&n.roundNumber<=e).reduce((e,t)=>e+t.value,0));let r=[...n.values()],a=t?Math.min(...r):Math.max(...r),o=this.playerScores[0].total;for(let e of this.playerScores){let r=e.player.id,s=(t?(n.get(r)??0)-a:a-(n.get(r)??0))-(t?e.total-o:o-e.total);s!==0&&i.set(r,s)}}return this.playerScores.map((a,o)=>{let s=r[o],c=s===0?`sb-rank-1`:s===1?`sb-rank-2`:s===2?`sb-rank-3`:``,l=a.player.id===n,u=s===0?`🥇`:s===1?`🥈`:s===2?`🥉`:String(s+1),d=s<3?`<span class="sb-medal">${u}</span>`:`<span class="sb-rank-num">${u}</span>`,f;if(e){let e=a.phase??1;f=`
          <div class="sb-phase">${e>10?`🏆 Done`:`Phase ${e}`}</div>
          <div class="sb-penalty">${a.total} pts</div>`}else{let e=``;if(s>0&&this.playerScores.length>1){let n=t?a.total-this.playerScores[0].total:this.playerScores[0].total-a.total,r=i.get(a.player.id),o=r===void 0?``:` <span class="sb-trend ${r>0?`sb-trend--up`:`sb-trend--down`}">${r>0?`▲`:`▼`} ${Math.abs(r)}</span>`;n>0?e=`<div class="sb-gap">${t?`+`:`−`}${n} behind${o}</div>`:n===0&&(e=`<div class="sb-gap sb-gap--tie">TIE</div>`)}f=`
          <div class="sb-score-area">
            <div class="sb-score">${a.total}</div>
            ${e}
          </div>`}return`
        <div class="sb-player ${c}" style="--pc:${a.player.color}">
          <div class="sb-rank-area">${d}</div>
          <div class="sb-player-body">
            <div class="sb-name">
              ${this._esc(a.player.displayName)}
              ${l&&this.match?.status!==`completed`?`<span class="sb-dealer-badge">🃏</span>`:``}
            </div>
            ${f}
          </div>
        </div>`}).join(``)}_computeRoundDurations(){let e=new Map,t=this.match?.createdAt??0,n=[...new Set(this.entries.map(e=>e.roundNumber))].sort((e,t)=>e-t);for(let r of n){let n=Math.max(...this.entries.filter(e=>e.roundNumber===r).map(e=>e.createdAt)),i=this.entries.filter(e=>e.roundNumber<r),a=i.length>0?Math.max(...i.map(e=>e.createdAt)):t;e.set(r,n-a)}return e}_totalDuration(){let e=this.match?.createdAt??Date.now();return this.match?.status===`completed`&&this.entries.length>0?Math.max(...this.entries.map(e=>e.createdAt))-e:Date.now()-e}_renderTableView(){if(this.players.length===0)return`<p class="sb-error">No players</p>`;let e=this.currentRound>0?Array.from({length:this.currentRound},(e,t)=>t+1):[],t=`<tr>
      <th class="sbt-corner"></th>
      ${this.players.map(e=>`<th class="sbt-player-head" style="--pc:${e.color}">
        <span class="sbt-dot" style="background:${e.color}"></span>
        ${this._esc(e.displayName)}
      </th>`).join(``)}
    </tr>`,n=this._computeRoundDurations();return`<div class="sbt-wrap"><table class="sbt">
      <thead>${t}</thead>
      <tbody>${e.map(e=>{let t=n.get(e),r=t===void 0?``:` <span class="sbt-dur">${s(t)}</span>`,i=this.players.map(t=>{let n=this.entries.find(n=>n.playerId===t.id&&n.roundNumber===e);return`<td class="sbt-cell">${n==null?`—`:String(n.value)}</td>`}).join(``);return`<tr><td class="sbt-label">${this._esc(this._roundLabel(e))}${r}</td>${i}</tr>`}).join(``)}${`<tr class="sbt-total-row"><td class="sbt-label sbt-label--total">Total</td>${this.players.map(e=>`<td class="sbt-total">${this.entries.filter(t=>t.playerId===e.id).reduce((e,t)=>e+t.value,0)}</td>`).join(``)}</tr>`}</tbody>
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
          Updated ${this.lastUpdated.toLocaleTimeString()} · ${s(this._totalDuration())} total
        </div>
      </div>`}afterRender(){document.getElementById(`sb-close`)?.addEventListener(`click`,()=>{window.history.length>1?window.history.back():a(`dashboard`)}),document.getElementById(`sb-view-cards`)?.addEventListener(`click`,()=>{this._view!==`cards`&&(this._view=`cards`,this._patch())}),document.getElementById(`sb-view-table`)?.addEventListener(`click`,()=>{this._view!==`table`&&(this._view=`table`,this._patch())}),this._pollInterval=setInterval(()=>{this._fetchData().then(()=>this._patch()).catch(()=>{})},5e3),this._dataChangedHandler=()=>{this._fetchData().then(()=>this._patch()).catch(()=>{})},window.addEventListener(`scorekeeper:datachanged`,this._dataChangedHandler);let e=r();e&&n(e,()=>{this._fetchData().then(()=>this._patch()).catch(()=>{})}).catch(()=>{})}_patch(){let e=document.getElementById(`sb-players`);if(e){let t=document.querySelector(`.main-content`),n=t?.scrollTop??0,r=e.querySelector(`.sbt-wrap`)?.scrollLeft??0;e.innerHTML=this._view===`cards`?this._renderCards():this._renderTableView(),t&&(t.scrollTop=n);let i=e.querySelector(`.sbt-wrap`);i&&(i.scrollLeft=r)}if(document.getElementById(`sb-view-cards`)?.classList.toggle(`sb-view-btn--active`,this._view===`cards`),document.getElementById(`sb-view-table`)?.classList.toggle(`sb-view-btn--active`,this._view===`table`),this.game&&this.night){let e=this.match?.status===`completed`,t=this.currentRound>0?`Round ${this.currentRound}${e?` · Final`:``}`:e?`Final`:`No scores yet`,n=document.getElementById(`sb-night-name`);n&&(n.textContent=`${this.night.title} · ${t}`)}let t=document.getElementById(`sb-round-banner`);t&&(t.textContent=this._currentRoundBannerText());let n=document.getElementById(`sb-footer`);n&&(n.textContent=`Updated ${this.lastUpdated.toLocaleTimeString()} · ${s(this._totalDuration())} total`)}teardown(){this._pollInterval&&=(clearInterval(this._pollInterval),null),this._dataChangedHandler&&=(window.removeEventListener(`scorekeeper:datachanged`,this._dataChangedHandler),null)}};export{c as Scoreboard};