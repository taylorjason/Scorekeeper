var I=Object.defineProperty;var k=(v,t,i)=>t in v?I(v,t,{enumerable:!0,configurable:!0,writable:!0,value:i}):v[t]=i;var b=(v,t,i)=>k(v,typeof t!="symbol"?t+"":t,i);import{f as S,h as x,i as N,j as E,k as M,n as f,s as y,l as P,m as R,u as C}from"./index-CiAI0UP5.js";class L{constructor(){b(this,"matchId",0);b(this,"match",null);b(this,"game",null);b(this,"night",null);b(this,"players",[]);b(this,"entries",[]);b(this,"playerScores",[]);b(this,"currentRound",1);b(this,"nightMatches",[]);b(this,"tableView",!1)}roundLabel(t){var l;const i=(l=this.game)==null?void 0:l.roundLabels;return i&&i.length>=t?i[t-1]:`Round ${t}`}async load(t){if(this.matchId=t,this.match=await S(t)??null,!this.match)return;const[i,l,o,h,p]=await Promise.all([x.games.get(this.match.gameId),N(this.match.gameNightId),x.players.where("id").anyOf(this.match.playerIds).toArray(),E(t),M(this.match.gameNightId)]);this.game=i??null,this.night=l??null,this.entries=h,this.nightMatches=p,this.players=this.match.playerIds.map(a=>o.find(r=>r.id===a)).filter(a=>a!==void 0),this.computeScores(),this.currentRound=this.entries.length>0?Math.max(...this.entries.map(a=>a.roundNumber))+1:1}getPlayerCurrentPhase(t){const i=this.entries.filter(o=>o.playerId===t.id).sort((o,h)=>o.roundNumber-h.roundNumber);let l=1;for(const o of i)if(o.note)try{const h=JSON.parse(o.note);h.completed&&h.phase===l&&(l=Math.min(l+1,11))}catch{}return l}computeScores(){var i;this.playerScores=this.players.map(l=>{const o=this.entries.filter(p=>p.playerId===l.id),h=o.reduce((p,a)=>p+a.value,0);return{player:l,total:h,entries:o}});const t=(i=this.game)==null?void 0:i.scoringMode;t==="low"||t==="phase10"?t==="phase10"?this.playerScores.sort((l,o)=>{const h=this.getPlayerCurrentPhase(l.player),p=this.getPlayerCurrentPhase(o.player);return p!==h?p-h:l.total-o.total}):this.playerScores.sort((l,o)=>l.total-o.total):this.playerScores.sort((l,o)=>o.total-l.total)}rankIcon(t){return t===0?"🥇":t===1?"🥈":t===2?"🥉":""}rankClass(t){return t===0?"rank-1-card":t===1?"rank-2-card":t===2?"rank-3-card":""}escHtml(t){return t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}renderScoreTable(){var p;if(this.players.length===0||this.entries.length===0)return'<div class="text-sm text-muted" style="padding:1rem 0; text-align:center">No scores yet — add a round to see the table.</div>';const t=[...new Set(this.entries.map(a=>a.roundNumber))].sort((a,r)=>a-r),i=new Map;for(const a of this.players)i.set(a.id,0);const l=this.players.map(a=>`<th style="background:${a.color}22; border-bottom: 2px solid ${a.color}">
        <div class="flex items-center gap-1 justify-center">
          <span class="player-dot" style="background:${a.color}; flex-shrink:0"></span>
          <span>${this.escHtml(a.displayName)}</span>
        </div>
      </th>`).join("");let o="";for(const a of t){const r=this.entries.filter(n=>n.roundNumber===a),d=((p=this.game)==null?void 0:p.scoringMode)==="phase10",m=this.players.map(n=>{const s=r.find(u=>u.playerId===n.id);if(!s)return'<td class="score-table-score">–</td>';const c=s.note==="first_out";if(d)try{const u=JSON.parse(s.note??"{}"),g=u.phase?`Ph.${u.phase}`:"",$=u.completed?" ✓":"",w=u.firstOut?" ⚡":"";return`<td class="score-table-score">${g}${$}${w}<br><small>${s.value}pts</small></td>`}catch{}return`<td class="score-table-score">${c?"⚡ ":""}${s.value}</td>`}).join("");o+=`<tr class="score-table-round-row">
        <td class="score-table-label">${this.escHtml(this.roundLabel(a))}</td>
        ${m}
      </tr>`;const e=this.players.map(n=>{const s=r.find(g=>g.playerId===n.id),u=(i.get(n.id)??0)+((s==null?void 0:s.value)??0);return i.set(n.id,u),`<td class="score-table-total">= ${u}</td>`}).join("");o+=`<tr class="score-table-total-row">
        <td class="score-table-label-total">∑</td>
        ${e}
      </tr>`}const h=this.players.map(a=>{const r=this.playerScores.find(d=>d.player.id===a.id);return`<td class="score-table-footer">${(r==null?void 0:r.total)??0}</td>`}).join("");return`
      <div class="score-table-wrapper" role="region" aria-label="Score table">
        <table class="score-table" aria-label="Scores by round">
          <thead>
            <tr>
              <th class="score-table-corner">Round</th>
              ${l}
            </tr>
          </thead>
          <tbody>
            ${o}
          </tbody>
          <tfoot>
            <tr class="score-table-totals-row">
              <td class="score-table-label-total">Total</td>
              ${h}
            </tr>
          </tfoot>
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
      `;const t=this.match.status==="completed",i=this.game.scoringMode,l=this.nightMatches.findIndex(e=>e.id===this.matchId),o=this.nightMatches[l+1],h=this.nightMatches.every(e=>e.status==="completed"||e.id===this.matchId),p=i==="phase10",a=this.playerScores.map((e,n)=>{if(p){const s=this.getPlayerCurrentPhase(e.player),c=s>10;return`
          <div class="score-card ${this.rankClass(n)}" aria-label="${this.escHtml(e.player.displayName)}: Phase ${c?"10 done":s}, ${e.total} pts">
            ${n<3?`<span class="score-rank" aria-hidden="true">${this.rankIcon(n)}</span>`:""}
            <div class="player-avatar" style="background:${e.player.color}">
              ${e.player.displayName.charAt(0).toUpperCase()}
            </div>
            <div class="player-name">${this.escHtml(e.player.displayName)}</div>
            <div class="score-total" style="font-size:1.1rem">${c?"🏆 Done":`Ph.${s}`}</div>
            <div class="text-xs text-muted">${e.total} penalty pts</div>
          </div>
        `}return`
        <div class="score-card ${this.rankClass(n)}" aria-label="${this.escHtml(e.player.displayName)}: ${e.total} points">
          ${n<3?`<span class="score-rank" aria-hidden="true">${this.rankIcon(n)}</span>`:""}
          <div class="player-avatar" style="background:${e.player.color}">
            ${e.player.displayName.charAt(0).toUpperCase()}
          </div>
          <div class="player-name">${this.escHtml(e.player.displayName)}</div>
          <div class="score-total" aria-label="${e.total} points">${e.total}</div>
        </div>
      `}).join(""),r=`
      <div class="form-group" style="margin-top:0.75rem">
        <label class="form-label" for="first-out-select" style="font-size:0.8rem">Who went out first? <span class="text-muted">(optional)</span></label>
        <select class="form-select" id="first-out-select" style="min-height:38px">
          <option value="">— none / unknown —</option>
          ${this.players.map(e=>`<option value="${e.id}">${this.escHtml(e.displayName)}</option>`).join("")}
        </select>
      </div>
    `;let d="";if(t){const e=this.playerScores[0],n=o?'<button class="btn btn-primary btn-full mt-4" id="next-match-btn" aria-label="Go to next match">▶ Next Match</button>':h?'<button class="btn btn-success btn-full mt-4" id="finish-night-btn" aria-label="Finish the game night">🎉 Finish Night</button>':"";d=`
        <div class="card mt-4" style="text-align:center; padding:2rem 1rem;">
          <div style="font-size:3rem; margin-bottom:0.5rem">🏆</div>
          <div class="font-bold" style="font-size:1.25rem">${e?this.escHtml(e.player.displayName):"Draw"} wins!</div>
          <div class="text-muted text-sm mt-4">Final score: ${(e==null?void 0:e.total)??0}</div>
          ${n}
          <button class="btn btn-secondary btn-full mt-4" id="back-to-night-btn">Back to Dashboard</button>
        </div>
      `}else{if(i==="phase10"){const n=this.players.map(s=>{const c=this.getPlayerCurrentPhase(s);return c>10?`
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
            ${n}
            ${r}
            <div class="btn-group mt-3">
              <button class="btn btn-primary flex-1" id="add-round-btn" aria-label="Save round">
                ✓ Save Round
              </button>
              <button class="btn btn-secondary" id="undo-btn" ${this.entries.length===0?"disabled":""} aria-label="Undo last round">
                ↩ Undo
              </button>
            </div>
          </div>
        `}else if(i==="rounds"){const n=this.players.map(s=>`
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
              ${n}
            </div>
            ${r}
            <div class="btn-group mt-2">
              <button class="btn btn-primary flex-1" id="add-round-btn" aria-label="Save round scores">
                ✓ Add Round
              </button>
              <button class="btn btn-secondary" id="undo-btn" ${this.entries.length===0?"disabled":""} aria-label="Undo last round">
                ↩ Undo
              </button>
            </div>
          </div>
        `}else if(i==="finish-order")d=`
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
              ${this.players.map((c,u)=>`<option value="${u+1}">${u+1}${["st","nd","rd"][u]||"th"}</option>`).join("")}
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
        `;else{const n=this.players.map(c=>{var g;const u=((g=this.playerScores.find($=>$.player.id===c.id))==null?void 0:g.total)??0;return`
            <div class="flex items-center gap-3 mb-2">
              <span class="player-dot player-dot-lg" style="background:${c.color}"></span>
              <span class="font-semibold flex-1">${this.escHtml(c.displayName)}</span>
              <span class="text-sm text-muted" style="min-width:40px; text-align:right">=${u}</span>
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
              <div class="card-title">${i==="low"?"Add Scores (lower is better)":"Add Scores"}</div>
              <span class="round-badge">${this.roundLabel(this.currentRound)}</span>
            </div>
            <div style="margin-bottom:0.5rem">
              ${n}
            </div>
            ${r}
            <div class="btn-group mt-2">
              <button class="btn btn-primary flex-1" id="add-round-btn" aria-label="Add scores">
                ✓ Add Scores
              </button>
              <button class="btn btn-secondary" id="undo-btn" ${this.entries.length===0?"disabled":""} aria-label="Undo last round">
                ↩ Undo
              </button>
            </div>
          </div>
        `}d+=t?"":`
        <div class="btn-group mt-4">
          <button class="btn btn-success flex-1" id="finish-match-btn" aria-label="Finish this match">
            🏁 Finish Match
          </button>
        </div>
      `}const m=this.nightMatches.length>1?`<div class="flex gap-2 items-center justify-center mb-3">
          ${this.nightMatches.map(e=>{const n=e.id===this.matchId,s=e.status==="completed";return`<div style="width:8px; height:8px; border-radius:50%; background:${n?"var(--primary)":s?"var(--success)":"var(--border)"}"></div>`}).join("")}
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
          ${t?'<span class="badge badge-success">Done</span>':'<span class="badge badge-primary">Live</span>'}
        </header>

        ${m}

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

            <section aria-label="Current scores">
              ${this.tableView?this.renderScoreTable():`<div class="score-grid" id="score-grid">${a}</div>`}
            </section>
          </div>

          <div class="match-col-right">
            ${d}
          </div>
        </div>
      </main>
    `}afterRender(){var t,i,l,o,h,p,a,r,d,m;(t=document.getElementById("toggle-cards"))==null||t.addEventListener("click",()=>{this.tableView=!1,this.reRender()}),(i=document.getElementById("toggle-table"))==null||i.addEventListener("click",()=>{this.tableView=!0,this.reRender()}),(l=document.getElementById("back-to-dashboard"))==null||l.addEventListener("click",()=>f("dashboard")),(o=document.getElementById("back-btn"))==null||o.addEventListener("click",()=>f("dashboard")),(h=document.getElementById("back-to-night-btn"))==null||h.addEventListener("click",()=>f("dashboard")),(p=document.getElementById("add-round-btn"))==null||p.addEventListener("click",()=>{this.handleAddRound()}),(a=document.getElementById("undo-btn"))==null||a.addEventListener("click",()=>{this.handleUndo()}),(r=document.getElementById("finish-match-btn"))==null||r.addEventListener("click",()=>{this.handleFinishMatch()}),(d=document.getElementById("next-match-btn"))==null||d.addEventListener("click",()=>{const e=this.nightMatches.findIndex(s=>s.id===this.matchId),n=this.nightMatches[e+1];(n==null?void 0:n.id)!==void 0&&f("match",{id:String(n.id)})}),(m=document.getElementById("finish-night-btn"))==null||m.addEventListener("click",()=>{f("dashboard"),y("Game night completed! 🎉","success")}),document.querySelectorAll(".score-input").forEach((e,n,s)=>{e.addEventListener("keydown",c=>{var u;if(c.key==="Enter"){c.preventDefault();const g=s[n+1];g?g.focus():(u=document.getElementById("add-round-btn"))==null||u.click()}})})}async handleAddRound(){var o,h,p;if(!this.match||!this.game)return;const t=this.game.scoringMode,i=[];if(t==="phase10"){const a=((o=document.getElementById("first-out-select"))==null?void 0:o.value)??"";for(const r of this.players){const d=this.getPlayerCurrentPhase(r);if(d>10)continue;const m=document.getElementById(`score-input-${r.id}`),e=parseFloat((m==null?void 0:m.value)??"0")||0,n=((h=document.getElementById(`completed-${r.id}`))==null?void 0:h.checked)??!1,s=a===String(r.id),c=JSON.stringify({phase:d,completed:n,...s?{firstOut:!0}:{}});i.push({playerId:r.id,value:e,note:c})}if(i.length===0){y("All players have completed all phases","info");return}}else if(t==="finish-order"){const a=new Set;for(const r of this.players){const d=document.getElementById(`order-input-${r.id}`),m=parseInt((d==null?void 0:d.value)??"",10);if(!m||isNaN(m)){y(`Set position for ${r.displayName}`,"error");return}if(a.has(m)){y("Each player must have a unique position","error");return}a.add(m);const e=this.players.length-m+1;i.push({playerId:r.id,value:e})}}else{const a=((p=document.getElementById("first-out-select"))==null?void 0:p.value)??"";for(const r of this.players){const d=document.getElementById(`score-input-${r.id}`),m=parseFloat((d==null?void 0:d.value)??"0")||0,e=a===String(r.id);i.push({playerId:r.id,value:m,...e?{note:"first_out"}:{}})}}const l=Date.now();try{for(const a of i)await P({matchId:this.matchId,playerId:a.playerId,roundNumber:this.currentRound,value:a.value,...a.note!==void 0?{note:a.note}:{},createdAt:l});if(y(`${this.roundLabel(this.currentRound)} saved`,"success"),await this.load(this.matchId),t==="phase10"&&this.players.some(r=>this.getPlayerCurrentPhase(r)>10)){await this.handleFinishMatch();return}this.reRender()}catch(a){console.error("Failed to save scores:",a),y("Failed to save scores","error")}}async handleUndo(){if(!this.match)return;const t=this.currentRound-1;if(!(t<1))try{await R(this.matchId)&&(y(`Removed ${this.roundLabel(t)}`,"info"),await this.load(this.matchId),this.reRender())}catch(i){console.error("Failed to undo:",i),y("Failed to undo","error")}}async handleFinishMatch(){if(!this.match||!this.game)return;if(this.playerScores.length===0){y("Add at least one round before finishing","error");return}const t=this.playerScores[0],i=t==null?void 0:t.player.id;try{await C(this.matchId,{status:"completed",winnerId:i}),y(`${(t==null?void 0:t.player.displayName)??"Player"} wins! 🏆`,"success"),await this.load(this.matchId),this.reRender()}catch(l){console.error("Failed to finish match:",l),y("Failed to finish match","error")}}reRender(){const t=document.getElementById("view-container");t&&(t.innerHTML=this.render(),this.afterRender())}}export{L as ActiveMatch};
