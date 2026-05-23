var S=Object.defineProperty;var M=(v,e,a)=>e in v?S(v,e,{enumerable:!0,configurable:!0,writable:!0,value:a}):v[e]=a;var y=(v,e,a)=>M(v,typeof e!="symbol"?e+"":e,a);import{f as E,h as w,i as P,j as R,k as C,n as x,s as g,l as H,m as L,u as B}from"./index-vUGePuu_.js";class j{constructor(){y(this,"matchId",0);y(this,"match",null);y(this,"game",null);y(this,"night",null);y(this,"players",[]);y(this,"entries",[]);y(this,"playerScores",[]);y(this,"currentRound",1);y(this,"nightMatches",[]);y(this,"tableView",!1)}roundLabel(e){var r;const a=(r=this.game)==null?void 0:r.roundLabels;return a&&a.length>=e?a[e-1]:`Round ${e}`}async load(e){if(this.matchId=e,this.match=await E(e)??null,!this.match)return;const[a,r,l,h,p]=await Promise.all([w.games.get(this.match.gameId),P(this.match.gameNightId),w.players.where("id").anyOf(this.match.playerIds).toArray(),R(e),C(this.match.gameNightId)]);this.game=a??null,this.night=r??null,this.entries=h,this.nightMatches=p,this.players=this.match.playerIds.map(n=>l.find(o=>o.id===n)).filter(n=>n!==void 0),this.computeScores(),this.currentRound=this.entries.length>0?Math.max(...this.entries.map(n=>n.roundNumber))+1:1}getPlayerCurrentPhase(e){const a=this.entries.filter(l=>l.playerId===e.id).sort((l,h)=>l.roundNumber-h.roundNumber);let r=1;for(const l of a)if(l.note)try{const h=JSON.parse(l.note);h.completed&&h.phase===r&&(r=Math.min(r+1,11))}catch{}return r}computeScores(){var a;this.playerScores=this.players.map(r=>{const l=this.entries.filter(p=>p.playerId===r.id),h=l.reduce((p,n)=>p+n.value,0);return{player:r,total:h,entries:l}});const e=(a=this.game)==null?void 0:a.scoringMode;e==="low"||e==="phase10"?e==="phase10"?this.playerScores.sort((r,l)=>{const h=this.getPlayerCurrentPhase(r.player),p=this.getPlayerCurrentPhase(l.player);return p!==h?p-h:r.total-l.total}):this.playerScores.sort((r,l)=>r.total-l.total):this.playerScores.sort((r,l)=>l.total-r.total)}rankIcon(e){return e===0?"🥇":e===1?"🥈":e===2?"🥉":""}rankClass(e){return e===0?"rank-1-card":e===1?"rank-2-card":e===2?"rank-3-card":""}escHtml(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}renderScoreTable(){var d,u;if(this.players.length===0||this.entries.length===0)return'<div class="text-sm text-muted" style="padding:1rem 0; text-align:center">No scores yet — add a round to see the table.</div>';const e=((d=this.game)==null?void 0:d.scoringMode)==="phase10",a=[...new Set(this.entries.map(t=>t.roundNumber))].sort((t,i)=>i-t),r=this.players.map(t=>`<th style="background:${t.color}22; border-bottom: 2px solid ${t.color}">
        <div class="flex items-center gap-1 justify-center">
          <span class="player-dot" style="background:${t.color}; flex-shrink:0"></span>
          <span>${this.escHtml(t.displayName)}</span>
        </div>
      </th>`).join(""),l=this.players.map(t=>{const i=this.playerScores.find(s=>s.player.id===t.id);return`<td class="score-table-footer">${(i==null?void 0:i.total)??0}</td>`}).join(""),h=[...a].sort((t,i)=>t-i),p=new Map,n=new Map(this.players.map(t=>[t.id,0]));for(const t of h){const i=this.entries.filter(s=>s.roundNumber===t);for(const s of this.players){const c=((u=i.find(m=>m.playerId===s.id))==null?void 0:u.value)??0;n.set(s.id,(n.get(s.id)??0)+c)}p.set(t,new Map(n))}let o="";for(const t of a){const i=this.entries.filter(m=>m.roundNumber===t),s=this.players.map(m=>{const b=i.find($=>$.playerId===m.id);if(!b)return'<td class="score-table-score">–</td>';const f=b.note==="first_out";if(e)try{const $=JSON.parse(b.note??"{}"),I=$.phase?`Ph.${$.phase}`:"",k=$.completed?" ✓":"",N=$.firstOut?" ⚡":"";return`<td class="score-table-score">${I}${k}${N}<br><small>${b.value}pts</small></td>`}catch{}return`<td class="score-table-score">${f?"⚡ ":""}${b.value}</td>`}).join(""),c=this.players.map(m=>{var f;return`<td class="score-table-total">= ${((f=p.get(t))==null?void 0:f.get(m.id))??0}</td>`}).join("");o+=`<tr class="score-table-round-row">
        <td class="score-table-label">${this.escHtml(this.roundLabel(t))}</td>
        ${s}
      </tr>
      <tr class="score-table-total-row">
        <td class="score-table-label-total">∑</td>
        ${c}
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
              ${l}
            </tr>
          </thead>
          <tbody>
            ${o}
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
      `;const e=this.match.status==="completed",a=this.game.scoringMode,r=this.nightMatches.findIndex(t=>t.id===this.matchId),l=this.nightMatches[r+1],h=this.nightMatches.every(t=>t.status==="completed"||t.id===this.matchId),p=a==="phase10",n=this.playerScores.map((t,i)=>{if(p){const s=this.getPlayerCurrentPhase(t.player),c=s>10;return`
          <div class="score-card ${this.rankClass(i)}" aria-label="${this.escHtml(t.player.displayName)}: Phase ${c?"10 done":s}, ${t.total} pts">
            ${i<3?`<span class="score-rank" aria-hidden="true">${this.rankIcon(i)}</span>`:""}
            <div class="player-avatar" style="background:${t.player.color}">
              ${t.player.displayName.charAt(0).toUpperCase()}
            </div>
            <div class="player-name">${this.escHtml(t.player.displayName)}</div>
            <div class="score-total" style="font-size:1.1rem">${c?"🏆 Done":`Ph.${s}`}</div>
            <div class="text-xs text-muted">${t.total} penalty pts</div>
          </div>
        `}return`
        <div class="score-card ${this.rankClass(i)}" aria-label="${this.escHtml(t.player.displayName)}: ${t.total} points">
          ${i<3?`<span class="score-rank" aria-hidden="true">${this.rankIcon(i)}</span>`:""}
          <div class="player-avatar" style="background:${t.player.color}">
            ${t.player.displayName.charAt(0).toUpperCase()}
          </div>
          <div class="player-name">${this.escHtml(t.player.displayName)}</div>
          <div class="score-total" aria-label="${t.total} points">${t.total}</div>
        </div>
      `}).join(""),o=`
      <div class="form-group" style="margin-top:0.75rem">
        <label class="form-label" for="first-out-select" style="font-size:0.8rem">Who went out first? <span class="text-muted">(optional)</span></label>
        <select class="form-select" id="first-out-select" style="min-height:38px">
          <option value="">— none / unknown —</option>
          ${this.players.map(t=>`<option value="${t.id}">${this.escHtml(t.displayName)}</option>`).join("")}
        </select>
      </div>
    `;let d="";if(e){const t=this.playerScores[0],i=l?'<button class="btn btn-primary btn-full mt-4" id="next-match-btn" aria-label="Go to next match">▶ Next Match</button>':h?'<button class="btn btn-success btn-full mt-4" id="finish-night-btn" aria-label="Finish the game night">🎉 Finish Night</button>':"";d=`
        <div class="card mt-4" style="text-align:center; padding:2rem 1rem;">
          <div style="font-size:3rem; margin-bottom:0.5rem">🏆</div>
          <div class="font-bold" style="font-size:1.25rem">${t?this.escHtml(t.player.displayName):"Draw"} wins!</div>
          <div class="text-muted text-sm mt-4">Final score: ${(t==null?void 0:t.total)??0}</div>
          ${i}
          <button class="btn btn-secondary btn-full mt-4" id="back-to-night-btn">Back to Dashboard</button>
        </div>
      `}else{if(a==="phase10"){const i=this.players.map(s=>{const c=this.getPlayerCurrentPhase(s);return c>10?`
              <div class="phase10-player-row" style="opacity:0.6">
                <div class="flex items-center gap-2">
                  <span class="player-dot" style="background:${s.color}"></span>
                  <span class="font-semibold">${this.escHtml(s.displayName)}</span>
                  <span class="phase10-badge phase10-done">All phases done 🏆</span>
                </div>
              </div>
            `:`
            <div class="phase10-player-row">
              <div class="flex items-center gap-2 mb-1">
                <span class="player-dot" style="background:${s.color}"></span>
                <span class="font-semibold">${this.escHtml(s.displayName)}</span>
                <span class="phase10-badge">Phase ${c}</span>
              </div>
              <div class="flex items-center gap-3 flex-wrap">
                <div style="display:flex; flex-direction:column; align-items:center; gap:2px">
                  <span class="text-xs text-muted">Penalty pts</span>
                  <input class="score-input" type="number" id="score-input-${s.id}" data-player-id="${s.id}"
                    placeholder="0" min="0" step="5" style="max-width:80px; text-align:center"
                    aria-label="${this.escHtml(s.displayName)} penalty points" />
                </div>
                <label class="flex items-center gap-2" style="cursor:pointer; padding: 4px 0">
                  <input type="checkbox" id="completed-${s.id}" style="width:18px; height:18px">
                  <span class="text-sm">Completed Phase ${c}</span>
                </label>
              </div>
            </div>
          `}).join("");d=`
          <div class="card mt-4">
            <div class="card-header">
              <div class="card-title">Round ${this.currentRound}</div>
              <span class="round-badge">Phase 10</span>
            </div>
            ${i}
            ${o}
            <div class="btn-group mt-3">
              <button class="btn btn-primary flex-1" id="add-round-btn" aria-label="Save round">
                ✓ Save Round
              </button>
              <button class="btn btn-secondary" id="undo-btn" ${this.entries.length===0?"disabled":""} aria-label="Undo last round">
                ↩ Undo
              </button>
            </div>
          </div>
        `}else if(a==="rounds"){const i=this.players.map(s=>`
          <div style="display:flex; flex-direction:column; align-items:center; gap:4px;">
            <div class="flex items-center gap-1">
              <span class="player-dot" style="background:${s.color}"></span>
              <span class="text-xs font-semibold">${this.escHtml(s.displayName)}</span>
            </div>
            <input
              class="score-input"
              type="number"
              id="score-input-${s.id}"
              data-player-id="${s.id}"
              placeholder="0"
              aria-label="${this.escHtml(s.displayName)} score"
              step="1"
              style="max-width: 90px;"
            />
          </div>
        `).join("");d=`
          <div class="card mt-4">
            <div class="card-header">
              <div class="card-title">${this.roundLabel(this.currentRound)}</div>
              <span class="round-badge">🎯 ${this.roundLabel(this.currentRound)}</span>
            </div>
            <div style="display:flex; flex-wrap:wrap; gap:0.75rem; justify-content:center; margin-bottom:0.5rem;">
              ${i}
            </div>
            ${o}
            <div class="btn-group mt-2">
              <button class="btn btn-primary flex-1" id="add-round-btn" aria-label="Save round scores">
                ✓ Add Round
              </button>
              <button class="btn btn-secondary" id="undo-btn" ${this.entries.length===0?"disabled":""} aria-label="Undo last round">
                ↩ Undo
              </button>
            </div>
          </div>
        `}else if(a==="finish-order")d=`
          <div class="card mt-4">
            <div class="card-header">
              <div class="card-title">Final Positions</div>
            </div>
            ${this.players.map(s=>`
          <div class="flex items-center gap-3 mb-2">
            <span class="player-dot player-dot-lg" style="background:${s.color}"></span>
            <span class="font-semibold flex-1">${this.escHtml(s.displayName)}</span>
            <select class="form-select" style="max-width:120px; min-height:42px"
              id="order-input-${s.id}" data-player-id="${s.id}" aria-label="${this.escHtml(s.displayName)} position">
              <option value="">Place</option>
              ${this.players.map((c,m)=>`<option value="${m+1}">${m+1}${["st","nd","rd"][m]||"th"}</option>`).join("")}
            </select>
          </div>
        `).join("")}
            <div class="btn-group mt-4">
              <button class="btn btn-primary flex-1" id="add-round-btn" aria-label="Save finish order">
                ✓ Save Positions
              </button>
              <button class="btn btn-secondary" id="undo-btn" ${this.entries.length===0?"disabled":""} aria-label="Undo">
                ↩ Undo
              </button>
            </div>
          </div>
        `;else{const i=this.players.map(c=>{var b;const m=((b=this.playerScores.find(f=>f.player.id===c.id))==null?void 0:b.total)??0;return`
            <div class="flex items-center gap-3 mb-2">
              <span class="player-dot player-dot-lg" style="background:${c.color}"></span>
              <span class="font-semibold flex-1">${this.escHtml(c.displayName)}</span>
              <span class="text-sm text-muted" style="min-width:40px; text-align:right">=${m}</span>
              <input
                class="score-input"
                type="number"
                id="score-input-${c.id}"
                data-player-id="${c.id}"
                placeholder="+0"
                step="1"
                style="max-width: 90px; text-align:center"
                aria-label="${this.escHtml(c.displayName)} score to add"
              />
            </div>
          `}).join("");d=`
          <div class="card mt-4">
            <div class="card-header">
              <div class="card-title">${a==="low"?"Add Scores (lower is better)":"Add Scores"}</div>
              <span class="round-badge">${this.roundLabel(this.currentRound)}</span>
            </div>
            <div style="margin-bottom:0.5rem">
              ${i}
            </div>
            ${o}
            <div class="btn-group mt-2">
              <button class="btn btn-primary flex-1" id="add-round-btn" aria-label="Add scores">
                ✓ Add Scores
              </button>
              <button class="btn btn-secondary" id="undo-btn" ${this.entries.length===0?"disabled":""} aria-label="Undo last round">
                ↩ Undo
              </button>
            </div>
          </div>
        `}d+=e?"":`
        <div class="btn-group mt-4">
          <button class="btn btn-success flex-1" id="finish-match-btn" aria-label="Finish this match">
            🏁 Finish Match
          </button>
        </div>
      `}const u=this.nightMatches.length>1?`<div class="flex gap-2 items-center justify-center mb-3">
          ${this.nightMatches.map(t=>{const i=t.id===this.matchId,s=t.status==="completed";return`<div style="width:8px; height:8px; border-radius:50%; background:${i?"var(--primary)":s?"var(--success)":"var(--border)"}"></div>`}).join("")}
        </div>`:"";return`
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
          ${e?'<span class="badge badge-success">Done</span>':'<span class="badge badge-primary">Live</span>'}
        </header>

        ${u}

        <div class="match-body">
          <div class="match-col-left">
            <div class="view-toggle-bar">
              <button class="view-toggle-btn ${this.tableView?"":"active"}" id="toggle-cards" aria-pressed="${!this.tableView}" aria-label="Card view">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
                Cards
              </button>
              <button class="view-toggle-btn ${this.tableView?"active":""}" id="toggle-table" aria-pressed="${this.tableView}" aria-label="Table view">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 3h18v18H3z"/><path d="M3 9h18M3 15h18M9 3v18"/></svg>
                Table
              </button>
            </div>

            ${e?"":`<div class="current-round-banner" aria-label="Current round">
              <span class="round-banner-label">Now scoring</span>
              ${this.escHtml(this.roundLabel(this.currentRound))}
            </div>`}

            <section aria-label="Current scores">
              ${this.tableView?this.renderScoreTable():`<div class="score-grid" id="score-grid" style="grid-template-columns:repeat(${Math.min(this.playerScores.length,3)},1fr)">${n}</div>`}
            </section>
          </div>

          <div class="match-col-right">
            ${d}
          </div>
        </div>
      </main>
    `}afterRender(){var e,a,r,l,h,p,n,o,d,u;(e=document.getElementById("toggle-cards"))==null||e.addEventListener("click",()=>{this.tableView=!1,this.reRender()}),(a=document.getElementById("toggle-table"))==null||a.addEventListener("click",()=>{this.tableView=!0,this.reRender()}),(r=document.getElementById("back-to-dashboard"))==null||r.addEventListener("click",()=>x("dashboard")),(l=document.getElementById("back-btn"))==null||l.addEventListener("click",()=>x("dashboard")),(h=document.getElementById("back-to-night-btn"))==null||h.addEventListener("click",()=>x("dashboard")),(p=document.getElementById("add-round-btn"))==null||p.addEventListener("click",()=>{this.handleAddRound()}),(n=document.getElementById("undo-btn"))==null||n.addEventListener("click",()=>{this.handleUndo()}),(o=document.getElementById("finish-match-btn"))==null||o.addEventListener("click",()=>{this.handleFinishMatch()}),(d=document.getElementById("next-match-btn"))==null||d.addEventListener("click",()=>{const t=this.nightMatches.findIndex(s=>s.id===this.matchId),i=this.nightMatches[t+1];(i==null?void 0:i.id)!==void 0&&x("match",{id:String(i.id)})}),(u=document.getElementById("finish-night-btn"))==null||u.addEventListener("click",()=>{x("dashboard"),g("Game night completed! 🎉","success")}),document.querySelectorAll(".score-input").forEach((t,i,s)=>{t.addEventListener("keydown",c=>{var m;if(c.key==="Enter"){c.preventDefault();const b=s[i+1];b?b.focus():(m=document.getElementById("add-round-btn"))==null||m.click()}})})}async handleAddRound(){var l,h,p;if(!this.match||!this.game)return;const e=this.game.scoringMode,a=[];if(e==="phase10"){const n=((l=document.getElementById("first-out-select"))==null?void 0:l.value)??"";for(const o of this.players){const d=this.getPlayerCurrentPhase(o);if(d>10)continue;const u=document.getElementById(`score-input-${o.id}`),t=parseFloat((u==null?void 0:u.value)??"0")||0,i=((h=document.getElementById(`completed-${o.id}`))==null?void 0:h.checked)??!1,s=n===String(o.id),c=JSON.stringify({phase:d,completed:i,...s?{firstOut:!0}:{}});a.push({playerId:o.id,value:t,note:c})}if(a.length===0){g("All players have completed all phases","info");return}}else if(e==="finish-order"){const n=new Set;for(const o of this.players){const d=document.getElementById(`order-input-${o.id}`),u=parseInt((d==null?void 0:d.value)??"",10);if(!u||isNaN(u)){g(`Set position for ${o.displayName}`,"error");return}if(n.has(u)){g("Each player must have a unique position","error");return}n.add(u);const t=this.players.length-u+1;a.push({playerId:o.id,value:t})}}else{const n=((p=document.getElementById("first-out-select"))==null?void 0:p.value)??"";for(const o of this.players){const d=document.getElementById(`score-input-${o.id}`),u=parseFloat((d==null?void 0:d.value)??"0")||0,t=n===String(o.id);a.push({playerId:o.id,value:u,...t?{note:"first_out"}:{}})}}const r=Date.now();try{for(const n of a)await H({matchId:this.matchId,playerId:n.playerId,roundNumber:this.currentRound,value:n.value,...n.note!==void 0?{note:n.note}:{},createdAt:r});if(g(`${this.roundLabel(this.currentRound)} saved`,"success"),await this.load(this.matchId),e==="phase10"&&this.players.some(o=>this.getPlayerCurrentPhase(o)>10)){await this.handleFinishMatch();return}this.reRender()}catch(n){console.error("Failed to save scores:",n),g("Failed to save scores","error")}}async handleUndo(){if(!this.match)return;const e=this.currentRound-1;if(!(e<1))try{await L(this.matchId)&&(g(`Removed ${this.roundLabel(e)}`,"info"),await this.load(this.matchId),this.reRender())}catch(a){console.error("Failed to undo:",a),g("Failed to undo","error")}}async handleFinishMatch(){if(!this.match||!this.game)return;if(this.playerScores.length===0){g("Add at least one round before finishing","error");return}const e=this.playerScores[0],a=e==null?void 0:e.player.id;try{await B(this.matchId,{status:"completed",winnerId:a}),g(`${(e==null?void 0:e.player.displayName)??"Player"} wins! 🏆`,"success"),await this.load(this.matchId),this.reRender()}catch(r){console.error("Failed to finish match:",r),g("Failed to finish match","error")}}reRender(){const e=document.getElementById("view-container");e&&(e.innerHTML=this.render(),this.afterRender())}}export{j as ActiveMatch};
