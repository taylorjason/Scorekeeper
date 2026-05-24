import{C as e,D as t,L as n,M as r,O as i,P as a,b as o,f as s,h as c,j as l,m as u,p as d}from"./index-bJaEmcwP.js";var f=class{matchId=0;match=null;game=null;night=null;players=[];entries=[];playerScores=[];currentRound=1;nightMatches=[];nightMatchGames=new Map;tableView=!1;customStats=[];customFieldsExpanded=!1;roundLabel(e){let t=this.game?.roundLabels;return t&&t.length>=e?t[e-1]:`Round ${e}`}async load(e){if(this.matchId=e,this.match=await l(e)??null,!this.match)return;let[n,s,c,u,d,f]=await Promise.all([o.games.get(this.match.gameId),i(this.match.gameNightId),o.players.where(`id`).anyOf(this.match.playerIds).toArray(),a(e),r(this.match.gameNightId),t(e)]);this.game=n??null,this.night=s??null,this.entries=u,this.nightMatches=d,this.customStats=f;let p=[...new Set(d.map(e=>e.gameId))],m=p.length>0?await o.games.where(`id`).anyOf(p).toArray():[];this.nightMatchGames=new Map(m.map(e=>[e.id,e])),this.players=this.match.playerIds.map(e=>c.find(t=>t.id===e)).filter(e=>e!==void 0),this.computeScores(),this.currentRound=this.entries.length>0?Math.max(...this.entries.map(e=>e.roundNumber))+1:1}getPlayerCurrentPhase(e){let t=this.entries.filter(t=>t.playerId===e.id).sort((e,t)=>e.roundNumber-t.roundNumber),n=1;for(let e of t)if(e.note)try{let t=JSON.parse(e.note);t.completed&&t.phase===n&&(n=Math.min(n+1,11))}catch{}return n}computeScores(){this.playerScores=this.players.map(e=>{let t=this.entries.filter(t=>t.playerId===e.id);return{player:e,total:t.reduce((e,t)=>e+t.value,0),entries:t}});let e=this.game?.scoringMode;e===`low`||e===`phase10`?e===`phase10`?this.playerScores.sort((e,t)=>{let n=this.getPlayerCurrentPhase(e.player),r=this.getPlayerCurrentPhase(t.player);return r===n?e.total-t.total:r-n}):this.playerScores.sort((e,t)=>e.total-t.total):this.playerScores.sort((e,t)=>t.total-e.total)}rankIcon(e){return e===0?`🥇`:e===1?`🥈`:e===2?`🥉`:``}rankClass(e){return e===0?`rank-1-card`:e===1?`rank-2-card`:e===2?`rank-3-card`:``}escHtml(e){return e.replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`)}_effectiveRanks(){let e=[];for(let t=0;t<this.playerScores.length;t++){if(t===0){e.push(0);continue}let n=this.playerScores[t],r=this.playerScores[t-1],i=this.game?.scoringMode===`phase10`?this.getPlayerCurrentPhase(n.player)===this.getPlayerCurrentPhase(r.player)&&n.total===r.total:n.total===r.total;e.push(i?e[t-1]:t)}return e}_currentDealerId(){if(this.match?.firstDealerIndex==null||this.players.length===0)return null;let e=(this.match.firstDealerIndex+this.currentRound-1)%this.players.length;return this.match.playerIds[e]??null}renderCustomFieldInputs(e){let t=(this.game?.customFields??[]).filter(t=>t.trigger===e);if(t.length===0)return``;let n=t.map(e=>{let t=e.icon?`${e.icon} `:``;return e.type===`pick-one`?`<div class="form-group" style="margin-top:0.75rem">
          <label class="form-label" style="font-size:0.8rem">${t}${this.escHtml(e.label)} <span class="text-muted">(optional)</span></label>
          <select class="form-select" id="cstat-${e.id}" data-field-id="${e.id}" style="min-height:38px">
            <option value="">— none —</option>
            ${this.players.map(e=>`<option value="${e.id}">${this.escHtml(e.displayName)}</option>`).join(``)}
          </select>
        </div>`:e.scope===`player`?`<div class="form-group" style="margin-top:0.75rem">
          <label class="form-label" style="font-size:0.8rem">${t}${this.escHtml(e.label)}</label>
          <div style="display:flex; flex-wrap:wrap; gap:0.5rem; margin-top:0.25rem">
            ${this.players.map(t=>`
              <div style="display:flex; flex-direction:column; align-items:center; gap:2px">
                <span class="text-xs text-muted">${this.escHtml(t.displayName)}</span>
                <input class="score-input" type="number" id="cstat-${e.id}-${t.id}"
                  data-field-id="${e.id}" data-player-id="${t.id}"
                  placeholder="0" step="1" style="max-width:70px; text-align:center" />
              </div>`).join(``)}
          </div>
        </div>`:`<div class="form-group" style="margin-top:0.75rem">
        <label class="form-label" style="font-size:0.8rem">${t}${this.escHtml(e.label)}</label>
        <input class="form-input" type="number" id="cstat-${e.id}"
          data-field-id="${e.id}" placeholder="0" step="1" style="max-width:120px" />
      </div>`}).join(``);return t.length<=2?`<div class="custom-stats-inline">${n}</div>`:`<div class="custom-stats-inline">
      <button type="button" class="custom-stats-expander" id="custom-stats-toggle">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
          ${this.customFieldsExpanded?`<polyline points="18 15 12 9 6 15"/>`:`<polyline points="6 9 12 15 18 9"/>`}
        </svg>
        More stats (${t.length})
      </button>
      <div id="custom-stats-body"${this.customFieldsExpanded?``:` style="display:none"`}>
        ${n}
      </div>
    </div>`}renderScoreTable(){if(this.players.length===0||this.entries.length===0)return`<div class="text-sm text-muted" style="padding:1rem 0; text-align:center">No scores yet — add a round to see the table.</div>`;let e=this.game?.scoringMode===`phase10`,t=[...new Set(this.entries.map(e=>e.roundNumber))].sort((e,t)=>t-e),n=this._currentDealerId(),r=this.players.map(e=>`<th style="background:${e.color}22; border-bottom: 2px solid ${e.color}">
        <div class="flex items-center gap-1 justify-center">
          <span class="player-dot" style="background:${e.color}; flex-shrink:0"></span>
          <span>${this.escHtml(e.displayName)}</span>
          ${e.id===n?`<span class="dealer-badge" title="Current dealer">🃏</span>`:``}
        </div>
      </th>`).join(``),i=this.players.map(e=>`<td class="score-table-footer">${this.playerScores.find(t=>t.player.id===e.id)?.total??0}</td>`).join(``),a=[...t].sort((e,t)=>e-t),o=new Map,s=new Map(this.players.map(e=>[e.id,0]));for(let e of a){let t=this.entries.filter(t=>t.roundNumber===e);for(let e of this.players){let n=t.find(t=>t.playerId===e.id)?.value??0;s.set(e.id,(s.get(e.id)??0)+n)}o.set(e,new Map(s))}let c=``;for(let n of t){let t=this.entries.filter(e=>e.roundNumber===n),r=this.players.map(r=>{let i=t.find(e=>e.playerId===r.id);if(!i)return`<td class="score-table-score">–</td>`;let a=`data-entry-id="${i.id}" data-player-id="${r.id}" data-round="${n}"`,o=(this.game?.customFields??[]).filter(e=>e.trigger===`per-round`&&e.icon).filter(e=>this.customStats.some(t=>t.fieldId===e.id&&t.playerId===r.id&&t.roundNumber===n)).map(e=>e.icon).join(``);if(e)try{let e=JSON.parse(i.note??`{}`);return`<td class="score-table-score score-cell-editable" ${a}>${e.phase?`Ph.${e.phase}`:``}${e.completed?` ✓`:``}${o?` `+o:``}<br><small>${i.value}pts</small></td>`}catch{}return`<td class="score-table-score score-cell-editable" ${a}>${o?o+` `:``}${i.value}</td>`}).join(``),i=this.players.map(e=>`<td class="score-table-total">= ${o.get(n)?.get(e.id)??0}</td>`).join(``);c+=`<tr class="score-table-round-row">
        <td class="score-table-label">${this.escHtml(this.roundLabel(n))}</td>
        ${r}
      </tr>
      <tr class="score-table-total-row">
        <td class="score-table-label-total">∑</td>
        ${i}
      </tr>`}return`
      <div class="score-table-wrapper" role="region" aria-label="Score table">
        <table class="score-table" aria-label="Scores by round">
          <thead>
            <tr>
              <th class="score-table-corner">Round</th>
              ${r}
            </tr>
            <tr class="score-table-totals-row">
              <td class="score-table-label-total">Total</td>
              ${i}
            </tr>
          </thead>
          <tbody>
            ${c}
          </tbody>
        </table>
      </div>
    `}render(){if(!this.match||!this.game||!this.night)return`
        <main class="view" aria-label="Match not found">
          <div class="empty-state">
            <div class="empty-state-icon">🔍</div>
            <div class="empty-state-title">Match not found</div>
            <p>This match may have been deleted.</p>
            <button class="btn btn-primary mt-4" id="back-to-dashboard">Back to Dashboard</button>
          </div>
        </main>
      `;let e=this.match.status===`completed`,t=this.game.scoringMode,n=this.nightMatches.findIndex(e=>e.id===this.matchId),r=this.nightMatches[n+1],i=this.nightMatches.every(e=>e.status===`completed`||e.id===this.matchId),a=t===`phase10`,o=this._currentDealerId(),s=this._effectiveRanks(),c=this.playerScores.map((e,t)=>{let n=s[t],r=e.player.id===o;if(a){let t=this.getPlayerCurrentPhase(e.player),i=t>10;return`
          <div class="score-card ${this.rankClass(n)}" aria-label="${this.escHtml(e.player.displayName)}: Phase ${i?`10 done`:t}, ${e.total} pts">
            ${n<3?`<span class="score-rank" aria-hidden="true">${this.rankIcon(n)}</span>`:``}
            ${r?`<span class="dealer-badge dealer-badge--card" title="Current dealer">🃏</span>`:``}
            <div class="player-avatar" style="background:${e.player.color}">
              ${e.player.displayName.charAt(0).toUpperCase()}
            </div>
            <div class="player-name">${this.escHtml(e.player.displayName)}</div>
            <div class="score-total" style="font-size:1.1rem">${i?`🏆 Done`:`Ph.${t}`}</div>
            <div class="text-xs text-muted">${e.total} penalty pts</div>
          </div>
        `}return`
        <div class="score-card ${this.rankClass(n)}" aria-label="${this.escHtml(e.player.displayName)}: ${e.total} points">
          ${n<3?`<span class="score-rank" aria-hidden="true">${this.rankIcon(n)}</span>`:``}
          ${r?`<span class="dealer-badge dealer-badge--card" title="Current dealer">🃏</span>`:``}
          <div class="player-avatar" style="background:${e.player.color}">
            ${e.player.displayName.charAt(0).toUpperCase()}
          </div>
          <div class="player-name">${this.escHtml(e.player.displayName)}</div>
          <div class="score-total" aria-label="${e.total} points">${e.total}</div>
        </div>
      `}).join(``),l=this.renderCustomFieldInputs(`per-round`),u=``;if(e){let e=this.playerScores[0],t=r?`<button class="btn btn-primary btn-full mt-4" id="next-match-btn" aria-label="Go to next match">▶ Next Match</button>`:i?`<button class="btn btn-success btn-full mt-4" id="finish-night-btn" aria-label="Finish the game night">🎉 Finish Night</button>`:``;u=`
        <div class="card mt-4" style="text-align:center; padding:2rem 1rem;">
          <div style="font-size:3rem; margin-bottom:0.5rem">🏆</div>
          <div class="font-bold" style="font-size:1.25rem">${e?this.escHtml(e.player.displayName):`Draw`} wins!</div>
          <div class="text-muted text-sm mt-4">Final score: ${e?.total??0}</div>
          ${t}
          <button class="btn btn-secondary btn-full mt-4" id="back-to-night-btn">Back to Dashboard</button>
        </div>
      `}else{if(t===`phase10`){let e=this.players.map(e=>{let t=this.getPlayerCurrentPhase(e);return t>10?`
              <div class="phase10-player-row" style="opacity:0.6">
                <div class="flex items-center gap-2">
                  <span class="player-dot" style="background:${e.color}"></span>
                  <span class="font-semibold">${this.escHtml(e.displayName)}</span>
                  <span class="phase10-badge phase10-done">All phases done 🏆</span>
                </div>
              </div>
            `:`
            <div class="phase10-player-row">
              <div class="flex items-center gap-2 mb-1">
                <span class="player-dot" style="background:${e.color}"></span>
                <span class="font-semibold">${this.escHtml(e.displayName)}</span>
                <span class="phase10-badge">Phase ${t}</span>
              </div>
              <div class="flex items-center gap-3 flex-wrap">
                <div style="display:flex; flex-direction:column; align-items:center; gap:2px">
                  <span class="text-xs text-muted">Penalty pts</span>
                  <input class="score-input" type="number" id="score-input-${e.id}" data-player-id="${e.id}"
                    placeholder="0" min="0" step="5" style="max-width:80px; text-align:center"
                    aria-label="${this.escHtml(e.displayName)} penalty points" />
                </div>
                <label class="flex items-center gap-2" style="cursor:pointer; padding: 4px 0">
                  <input type="checkbox" id="completed-${e.id}" style="width:18px; height:18px">
                  <span class="text-sm">Completed Phase ${t}</span>
                </label>
              </div>
            </div>
          `}).join(``);u=`
          <div class="card mt-4">
            <div class="card-header">
              <div class="card-title">Round ${this.currentRound}</div>
              <span class="round-badge">Phase 10</span>
            </div>
            ${e}
            ${l}
            <div class="btn-group mt-3">
              <button class="btn btn-primary flex-1" id="add-round-btn" aria-label="Save round">
                ✓ Save Round
              </button>
              <button class="btn btn-secondary" id="undo-btn" ${this.entries.length===0?`disabled`:``} aria-label="Undo last round">
                ↩ Undo
              </button>
            </div>
          </div>
        `}else if(t===`rounds`){let e=this.players.map(e=>`
          <div style="display:flex; flex-direction:column; align-items:center; gap:4px;">
            <div class="flex items-center gap-1">
              <span class="player-dot" style="background:${e.color}"></span>
              <span class="text-xs font-semibold">${this.escHtml(e.displayName)}</span>
            </div>
            <input
              class="score-input"
              type="number"
              id="score-input-${e.id}"
              data-player-id="${e.id}"
              placeholder="0"
              aria-label="${this.escHtml(e.displayName)} score"
              step="1"
              style="max-width: 90px;"
            />
          </div>
        `).join(``);u=`
          <div class="card mt-4">
            <div class="card-header">
              <div class="card-title">${this.roundLabel(this.currentRound)}</div>
              <span class="round-badge">🎯 ${this.roundLabel(this.currentRound)}</span>
            </div>
            <div style="display:flex; flex-wrap:wrap; gap:0.75rem; justify-content:center; margin-bottom:0.5rem;">
              ${e}
            </div>
            ${l}
            <div class="btn-group mt-2">
              <button class="btn btn-primary flex-1" id="add-round-btn" aria-label="Save round scores">
                ✓ Add Round
              </button>
              <button class="btn btn-secondary" id="undo-btn" ${this.entries.length===0?`disabled`:``} aria-label="Undo last round">
                ↩ Undo
              </button>
            </div>
          </div>
        `}else if(t===`finish-order`)u=`
          <div class="card mt-4">
            <div class="card-header">
              <div class="card-title">Final Positions</div>
            </div>
            ${this.players.map(e=>`
          <div class="flex items-center gap-3 mb-2">
            <span class="player-dot player-dot-lg" style="background:${e.color}"></span>
            <span class="font-semibold flex-1">${this.escHtml(e.displayName)}</span>
            <select class="form-select" style="max-width:120px; min-height:42px"
              id="order-input-${e.id}" data-player-id="${e.id}" aria-label="${this.escHtml(e.displayName)} position">
              <option value="">Place</option>
              ${this.players.map((e,t)=>`<option value="${t+1}">${t+1}${[`st`,`nd`,`rd`][t]||`th`}</option>`).join(``)}
            </select>
          </div>
        `).join(``)}
            <div class="btn-group mt-4">
              <button class="btn btn-primary flex-1" id="add-round-btn" aria-label="Save finish order">
                ✓ Save Positions
              </button>
              <button class="btn btn-secondary" id="undo-btn" ${this.entries.length===0?`disabled`:``} aria-label="Undo">
                ↩ Undo
              </button>
            </div>
          </div>
        `;else{let e=this.players.map(e=>{let t=this.playerScores.find(t=>t.player.id===e.id)?.total??0;return`
            <div class="flex items-center gap-3 mb-2">
              <span class="player-dot player-dot-lg" style="background:${e.color}"></span>
              <span class="font-semibold flex-1">${this.escHtml(e.displayName)}</span>
              <span class="text-sm text-muted" style="min-width:40px; text-align:right">=${t}</span>
              <input
                class="score-input"
                type="number"
                id="score-input-${e.id}"
                data-player-id="${e.id}"
                placeholder="+0"
                step="1"
                style="max-width: 90px; text-align:center"
                aria-label="${this.escHtml(e.displayName)} score to add"
              />
            </div>
          `}).join(``);u=`
          <div class="card mt-4">
            <div class="card-header">
              <div class="card-title">${t===`low`?`Add Scores (lower is better)`:`Add Scores`}</div>
              <span class="round-badge">${this.roundLabel(this.currentRound)}</span>
            </div>
            <div style="margin-bottom:0.5rem">
              ${e}
            </div>
            ${l}
            <div class="btn-group mt-2">
              <button class="btn btn-primary flex-1" id="add-round-btn" aria-label="Add scores">
                ✓ Add Scores
              </button>
              <button class="btn btn-secondary" id="undo-btn" ${this.entries.length===0?`disabled`:``} aria-label="Undo last round">
                ↩ Undo
              </button>
            </div>
          </div>
        `}u+=e?``:`
        <div class="btn-group mt-4">
          <button class="btn btn-success flex-1" id="finish-match-btn" aria-label="Finish this match">
            🏁 Finish Match
          </button>
        </div>
      `}let d=this.nightMatches.length>1?`<div class="match-switcher" role="navigation" aria-label="Switch match">
          ${this.nightMatches.map((e,t)=>{let n=e.id===this.matchId,r=e.status===`completed`,i=this.nightMatchGames.get(e.gameId)?.name??`Match ${t+1}`,a=n?`match-pill--active`:r?`match-pill--done`:`match-pill--idle`,o=r?`✓ ${i}`:i;return`<button class="match-pill ${a}" data-match-id="${e.id}"
              aria-label="Go to ${this.escHtml(i)}" aria-current="${n}"
              ${n?`disabled`:``}>${this.escHtml(o)}</button>`}).join(``)}
        </div>`:``;return`
      <main class="view match-view" aria-label="Active Match: ${this.escHtml(this.game.name)}">
        <header style="display:flex; align-items:center; gap:0.75rem; padding-top:1rem; margin-bottom:0.5rem;">
          <button class="btn btn-icon btn-sm" id="back-btn" aria-label="Go back">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <div class="match-header flex-1">
            <div class="match-game-name">${this.escHtml(this.game.name)}</div>
            <div class="match-night-name">${this.escHtml(this.night.title)}</div>
          </div>
          ${e?`<span class="badge badge-success">Done</span>`:`<span class="badge badge-primary">Live</span>`}
          <button class="btn btn-icon btn-sm" id="round-display-btn" aria-label="Show current round" title="Round Display">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
          </button>
          <button class="btn btn-icon btn-sm" id="scoreboard-btn" aria-label="Open scoreboard" title="Open Scoreboard">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
          </button>
        </header>

        ${d}

        <div class="match-body">
          <div class="match-col-left">
            <div class="view-toggle-bar">
              <button class="view-toggle-btn ${this.tableView?``:`active`}" id="toggle-cards" aria-pressed="${!this.tableView}" aria-label="Card view">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
                Cards
              </button>
              <button class="view-toggle-btn ${this.tableView?`active`:``}" id="toggle-table" aria-pressed="${this.tableView}" aria-label="Table view">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 3h18v18H3z"/><path d="M3 9h18M3 15h18M9 3v18"/></svg>
                Table
              </button>
            </div>

            ${e?``:(()=>{let e=o===null?null:this.players.find(e=>e.id===o);return`<div class="current-round-banner" aria-label="Current round">
                <span class="round-banner-label">Now scoring</span>
                ${this.escHtml(this.roundLabel(this.currentRound))}
                ${e?`<span class="dealer-pill">🃏 ${this.escHtml(e.displayName)}</span>`:``}
              </div>`})()}

            <section aria-label="Current scores">
              ${this.tableView?this.renderScoreTable():`<div class="score-grid" id="score-grid" style="grid-template-columns:repeat(${Math.min(this.playerScores.length,3)},1fr)">${c}</div>`}
            </section>
          </div>

          <div class="match-col-right">
            ${u}
          </div>
        </div>
      </main>
    `}afterRender(){document.getElementById(`toggle-cards`)?.addEventListener(`click`,()=>{this.tableView=!1,this.reRender()}),document.getElementById(`toggle-table`)?.addEventListener(`click`,()=>{this.tableView=!0,this.reRender()}),document.querySelectorAll(`.match-pill[data-match-id]`).forEach(e=>{e.addEventListener(`click`,()=>{let t=e.dataset.matchId;t&&d(`match`,{id:t})})}),document.getElementById(`back-to-dashboard`)?.addEventListener(`click`,()=>d(`dashboard`)),document.getElementById(`back-btn`)?.addEventListener(`click`,()=>d(`dashboard`)),document.getElementById(`back-to-night-btn`)?.addEventListener(`click`,()=>d(`dashboard`)),document.getElementById(`round-display-btn`)?.addEventListener(`click`,()=>{let e=window.location.href.replace(/#.*$/,``);window.open(`${e}#/round-display/${this.matchId}`,`_blank`)}),document.getElementById(`scoreboard-btn`)?.addEventListener(`click`,()=>{let e=window.location.href.replace(/#.*$/,``);window.open(`${e}#/scoreboard/${this.matchId}`,`_blank`)}),document.getElementById(`add-round-btn`)?.addEventListener(`click`,()=>{this.handleAddRound()}),document.getElementById(`undo-btn`)?.addEventListener(`click`,()=>{this.handleUndo()}),document.getElementById(`finish-match-btn`)?.addEventListener(`click`,()=>{this.handleFinishMatch()}),document.getElementById(`next-match-btn`)?.addEventListener(`click`,()=>{let e=this.nightMatches.findIndex(e=>e.id===this.matchId),t=this.nightMatches[e+1];t?.id!==void 0&&d(`match`,{id:String(t.id)})}),document.getElementById(`finish-night-btn`)?.addEventListener(`click`,()=>{d(`dashboard`),s(`Game night completed! 🎉`,`success`)}),document.querySelectorAll(`.score-cell-editable`).forEach(e=>{e.addEventListener(`click`,()=>{let t=parseInt(e.dataset.entryId??``,10),n=parseInt(e.dataset.playerId??``,10),r=parseInt(e.dataset.round??``,10);if(isNaN(t))return;let i=this.entries.find(e=>e.id===t),a=this.players.find(e=>e.id===n);!i||!a||this.showEditModal(t,i.value,a.displayName,this.roundLabel(r))})}),document.getElementById(`custom-stats-toggle`)?.addEventListener(`click`,()=>{this.customFieldsExpanded=!this.customFieldsExpanded;let e=document.getElementById(`custom-stats-body`),t=document.getElementById(`custom-stats-toggle`);e&&(e.style.display=this.customFieldsExpanded?``:`none`),t&&(t.innerHTML=t.innerHTML.replace(this.customFieldsExpanded?`<polyline points="6 9 12 15 18 9"/>`:`<polyline points="18 15 12 9 6 15"/>`,this.customFieldsExpanded?`<polyline points="18 15 12 9 6 15"/>`:`<polyline points="6 9 12 15 18 9"/>`))}),document.querySelectorAll(`.score-input`).forEach((e,t,n)=>{e.addEventListener(`keydown`,e=>{if(e.key===`Enter`){e.preventDefault();let r=n[t+1];r?r.focus():document.getElementById(`add-round-btn`)?.click()}})})}async handleAddRound(){if(!this.match||!this.game)return;let e=this.game.scoringMode,t=[];if(e===`phase10`){for(let e of this.players){let n=this.getPlayerCurrentPhase(e);if(n>10)continue;let r=document.getElementById(`score-input-${e.id}`),i=parseFloat(r?.value??`0`)||0,a=document.getElementById(`completed-${e.id}`)?.checked??!1,o=JSON.stringify({phase:n,completed:a});t.push({playerId:e.id,value:i,note:o})}if(t.length===0){s(`All players have completed all phases`,`info`);return}}else if(e===`finish-order`){let e=new Set;for(let n of this.players){let r=document.getElementById(`order-input-${n.id}`),i=parseInt(r?.value??``,10);if(!i||isNaN(i)){s(`Set position for ${n.displayName}`,`error`);return}if(e.has(i)){s(`Each player must have a unique position`,`error`);return}e.add(i);let a=this.players.length-i+1;t.push({playerId:n.id,value:a})}}else for(let e of this.players){let n=document.getElementById(`score-input-${e.id}`),r=parseFloat(n?.value??`0`)||0;t.push({playerId:e.id,value:r})}let n=Date.now();try{for(let e of t)await c({matchId:this.matchId,playerId:e.playerId,roundNumber:this.currentRound,value:e.value,...e.note===void 0?{}:{note:e.note},createdAt:n});if(await this._saveCustomStats(`per-round`,this.currentRound,n),s(`${this.roundLabel(this.currentRound)} saved`,`success`),await this.load(this.matchId),e===`phase10`&&this.players.some(e=>this.getPlayerCurrentPhase(e)>10)){await this.handleFinishMatch();return}this.reRender()}catch(e){console.error(`Failed to save scores:`,e),s(`Failed to save scores`,`error`)}}async handleUndo(){if(!this.match)return;let t=this.currentRound-1;if(!(t<1))try{await e(this.matchId)&&(s(`Removed ${this.roundLabel(t)}`,`info`),await this.load(this.matchId),this.reRender())}catch(e){console.error(`Failed to undo:`,e),s(`Failed to undo`,`error`)}}async _saveCustomStats(e,t,n){if(!this.match||!this.game)return;let r=(this.game.customFields??[]).filter(t=>t.trigger===e);for(let e of r)if(e.type===`pick-one`){let r=document.getElementById(`cstat-${e.id}`),i=r?.value?parseInt(r.value,10):null;i&&await u({matchId:this.matchId,gameId:this.match.gameId,fieldId:e.id,playerId:i,roundNumber:t,value:1,createdAt:n})}else if(e.scope===`player`)for(let r of this.players){let i=document.getElementById(`cstat-${e.id}-${r.id}`),a=parseFloat(i?.value??``)||0;a!==0&&await u({matchId:this.matchId,gameId:this.match.gameId,fieldId:e.id,playerId:r.id,roundNumber:t,value:a,createdAt:n})}else{let r=document.getElementById(`cstat-${e.id}`),i=parseFloat(r?.value??``)||0;i!==0&&await u({matchId:this.matchId,gameId:this.match.gameId,fieldId:e.id,roundNumber:t,value:i,createdAt:n})}}async handleFinishMatch(){if(!this.match||!this.game)return;if(this.playerScores.length===0){s(`Add at least one round before finishing`,`error`);return}let e=(this.game.customFields??[]).filter(e=>e.trigger===`per-match`);if(e.length>0&&!await this._collectPerMatchFields(e))return;let t=this.playerScores[0],r=t?.player.id;try{await n(this.matchId,{status:`completed`,winnerId:r}),s(`${t?.player.displayName??`Player`} wins! 🏆`,`success`),await this.load(this.matchId),this.reRender()}catch(e){console.error(`Failed to finish match:`,e),s(`Failed to finish match`,`error`)}}_collectPerMatchFields(e){return new Promise(t=>{document.getElementById(`per-match-fields-modal`)?.remove();let n=document.createElement(`div`);n.id=`per-match-fields-modal`,n.className=`modal-overlay`,n.innerHTML=`
        <div class="modal" role="dialog" aria-modal="true" aria-labelledby="pm-modal-title">
          <div class="modal-message">
            <div id="pm-modal-title" style="font-weight:600; margin-bottom:1rem">Match Stats</div>
            ${e.map(e=>e.type===`pick-one`?`<div class="form-group">
            <label class="form-label" style="font-size:0.85rem">${this.escHtml(e.label)}</label>
            <select class="form-select" id="pm-cstat-${e.id}">
              <option value="">— none —</option>
              ${this.players.map(e=>`<option value="${e.id}">${this.escHtml(e.displayName)}</option>`).join(``)}
            </select>
          </div>`:e.scope===`player`?`<div class="form-group">
            <label class="form-label" style="font-size:0.85rem">${this.escHtml(e.label)}</label>
            <div style="display:flex; flex-wrap:wrap; gap:0.5rem; margin-top:0.25rem">
              ${this.players.map(t=>`
                <div style="display:flex; flex-direction:column; align-items:center; gap:2px">
                  <span class="text-xs text-muted">${this.escHtml(t.displayName)}</span>
                  <input class="score-input" type="number" id="pm-cstat-${e.id}-${t.id}"
                    placeholder="0" step="1" style="max-width:70px; text-align:center" />
                </div>`).join(``)}
            </div>
          </div>`:`<div class="form-group">
          <label class="form-label" style="font-size:0.85rem">${this.escHtml(e.label)}</label>
          <input class="form-input" type="number" id="pm-cstat-${e.id}" placeholder="0" step="1" style="max-width:120px" />
        </div>`).join(``)}
          </div>
          <div class="modal-actions">
            <button class="btn btn-secondary" id="pm-cancel-btn">Skip</button>
            <button class="btn btn-primary" id="pm-save-btn">Save &amp; Finish</button>
          </div>
        </div>`,document.body.appendChild(n),n.querySelector(`#pm-cancel-btn`)?.addEventListener(`click`,()=>{n.remove(),t(!0)}),n.querySelector(`#pm-save-btn`)?.addEventListener(`click`,async()=>{let r=Date.now();for(let t of e)if(t.type===`pick-one`){let e=document.getElementById(`pm-cstat-${t.id}`),n=e?.value?parseInt(e.value,10):null;n&&await u({matchId:this.matchId,gameId:this.match.gameId,fieldId:t.id,playerId:n,value:1,createdAt:r})}else if(t.scope===`player`)for(let e of this.players){let n=document.getElementById(`pm-cstat-${t.id}-${e.id}`),i=parseFloat(n?.value??``)||0;i!==0&&await u({matchId:this.matchId,gameId:this.match.gameId,fieldId:t.id,playerId:e.id,value:i,createdAt:r})}else{let e=document.getElementById(`pm-cstat-${t.id}`),n=parseFloat(e?.value??``)||0;n!==0&&await u({matchId:this.matchId,gameId:this.match.gameId,fieldId:t.id,value:n,createdAt:r})}n.remove(),t(!0)})})}showEditModal(e,t,n,r){document.getElementById(`score-edit-modal`)?.remove();let i=document.createElement(`div`);i.id=`score-edit-modal`,i.className=`modal-overlay`,i.innerHTML=`
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="edit-modal-title">
        <div class="modal-message">
          <div id="edit-modal-title" style="font-weight:600; margin-bottom:0.75rem">
            ${this.escHtml(n)} — ${this.escHtml(r)}
          </div>
          <input class="form-input" type="number" id="edit-score-input"
            value="${t}" step="1"
            style="text-align:center; font-size:1.25rem; width:100%"
            aria-label="Score value" />
        </div>
        <div class="modal-actions">
          <button class="btn btn-secondary" id="edit-cancel-btn">Cancel</button>
          <button class="btn btn-primary" id="edit-save-btn">Save</button>
        </div>
      </div>
    `,document.body.appendChild(i);let a=i.querySelector(`#edit-score-input`);a.focus(),a.select();let c=()=>i.remove();i.addEventListener(`click`,e=>{e.target===i&&c()}),i.querySelector(`#edit-cancel-btn`)?.addEventListener(`click`,c);let l=async()=>{let t=parseFloat(a.value);if(isNaN(t)){s(`Invalid score`,`error`);return}try{await o.scoreEntries.update(e,{value:t}),c(),s(`Score updated`,`success`),await this.load(this.matchId),this.reRender()}catch(e){console.error(`Failed to update score:`,e),s(`Failed to update score`,`error`)}};i.querySelector(`#edit-save-btn`)?.addEventListener(`click`,l),a.addEventListener(`keydown`,e=>{e.key===`Enter`&&(e.preventDefault(),l()),e.key===`Escape`&&c()})}reRender(){let e=document.getElementById(`view-container`);e&&(e.innerHTML=this.render(),this.afterRender())}};export{f as ActiveMatch};