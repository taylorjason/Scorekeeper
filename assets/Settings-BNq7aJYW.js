import{C as e,I as t,N as n,O as r,P as i,a,b as o,c as s,d as c,f as l,h as u,i as d,j as f,l as p,n as m,o as h,r as g,s as _,t as v,u as y,v as b,w as x,y as S}from"./index-xa6lYevC.js";var C=Object.create,w=Object.defineProperty,T=Object.getOwnPropertyDescriptor,E=Object.getOwnPropertyNames,D=Object.getPrototypeOf,O=Object.prototype.hasOwnProperty,k=(e,t)=>()=>(t||(e((t={exports:{}}).exports,t),e=null),t.exports),A=(e,t,n,r)=>{if(t&&typeof t==`object`||typeof t==`function`)for(var i=E(t),a=0,o=i.length,s;a<o;a++)s=i[a],!O.call(e,s)&&s!==n&&w(e,s,{get:(e=>t[e]).bind(null,s),enumerable:!(r=T(t,s))||r.enumerable});return e},j=(e,t,n)=>(n=e==null?{}:C(D(e)),A(t||!e||!e.__esModule?w(n,`default`,{value:e,enumerable:!0}):n,e)),M=`scorekeeper_sync_config`;function N(){try{let e=localStorage.getItem(M);if(!e)return null;let t=JSON.parse(e);return t.provider||=`github`,t}catch{return null}}function P(e){localStorage.setItem(M,JSON.stringify(e))}function F(e){return(e.baseUrl??``).replace(/\/+$/,``)}function I(e){return e.provider===`gitea`?`${F(e)}/api/v1/repos/${e.username}/${e.repo}/contents/${e.filePath}`:`https://api.github.com/repos/${e.username}/${e.repo}/contents/${e.filePath}`}function L(e){return e.provider===`gitea`?`${F(e)}/api/v1/repos/${e.username}/${e.repo}`:`https://api.github.com/repos/${e.username}/${e.repo}`}function R(e){let t={Authorization:`token ${e.pat}`,"Content-Type":`application/json`};return e.provider===`github`&&(t.Accept=`application/vnd.github.v3+json`),t}function z(e){return e.provider===`gitea`?`Gitea`:`GitHub`}function B(e,t){let n=t===`gitea`?`Gitea`:`GitHub`;switch(e){case 401:return`Unauthorized – check your ${t===`gitea`?`API key`:`Personal Access Token`}`;case 403:return`Forbidden – token may lack repo write permissions`;case 404:return`Not Found – check username, repo name, and file path`;case 409:return`Conflict – file was modified remotely; try syncing from ${n} first`;case 422:return`Unprocessable – invalid request data`;case 429:return`Rate Limited – too many requests, try again in a minute`;default:return`${n} API error (HTTP ${e})`}}function V(e){return e.username?e.repo?e.pat?e.provider===`gitea`&&!e.baseUrl?`Base URL is required for Gitea`:null:e.provider===`gitea`?`API key is required`:`Personal Access Token is required`:`Repository name is required`:`Username is required`}async function H(e){try{let t=await fetch(L(e),{headers:R(e)});if(t.ok){let n=await t.json();return{ok:!0,message:`Connected to ${n.full_name??`${e.username}/${n.name??e.repo}`} on ${z(e)}`}}return{ok:!1,message:B(t.status,e.provider)}}catch(e){return{ok:!1,message:`Network error: ${e instanceof Error?e.message:String(e)}`}}}async function U(e){try{let t=await x(),n=JSON.stringify(t,null,2),r=btoa(unescape(encodeURIComponent(n))),i=I(e),a=R(e),o,s=await fetch(`${i}?ref=${encodeURIComponent(e.branch)}`,{headers:a});if(s.ok)o=(await s.json()).sha;else if(s.status!==404)return{ok:!1,message:B(s.status,e.provider)};let c={message:`Scorekeeper sync ${new Date().toISOString()}`,content:r,branch:e.branch};o&&(c.sha=o);let l=await fetch(i,{method:`PUT`,headers:a,body:JSON.stringify(c)});return l.ok?(P({...e,lastSync:Date.now()}),{ok:!0,message:`Synced to ${z(e)} successfully`}):{ok:!1,message:B(l.status,e.provider)}}catch(e){return{ok:!1,message:`Sync error: ${e instanceof Error?e.message:String(e)}`}}}async function W(e,t){try{let r=`${I(e)}?ref=${encodeURIComponent(e.branch)}`,i=await fetch(r,{headers:R(e)});if(!i.ok)return{ok:!1,message:B(i.status,e.provider)};let a=await i.json(),o=decodeURIComponent(escape(atob(a.content.replace(/\n/g,``)))),s=JSON.parse(o),c=await x();return(c.players.length>0||c.gameNights.length>0||c.matches.length>0)&&!await t()?{ok:!1,message:`Sync cancelled`}:(await n(s),P({...e,lastSync:Date.now()}),{ok:!0,message:`Synced from ${z(e)} successfully`})}catch(e){return{ok:!1,message:`Sync error: ${e instanceof Error?e.message:String(e)}`}}}var G=[`#ef4444`,`#f97316`,`#f59e0b`,`#eab308`,`#10b981`,`#14b8a6`,`#3b82f6`,`#6366f1`,`#8b5cf6`,`#ec4899`,`#64748b`,`#d97706`],K=class{players=[];games=[];syncConfig=null;roomConfig=null;editingPlayerId=null;editingGameId=null;async load(){let[e,t]=await Promise.all([f(),r()]);this.players=e,this.games=t,this.syncConfig=N(),this.roomConfig=d()}escHtml(e){return e.replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`)}formatTimestamp(e){return e?new Date(e).toLocaleString():`Never`}render(){let e=(document.documentElement.getAttribute(`data-theme`)??`dark`)!==`light`;return`
      <main class="view" aria-label="Settings">
        <header class="page-header">
          <h1 class="page-title">Settings</h1>
        </header>

        <!-- Players Section -->
        <section class="settings-section" aria-labelledby="players-section-heading">
          <h2 class="settings-section-title" id="players-section-heading">
            <span>👥</span> Players
          </h2>
          <div id="players-list">
            ${this.renderPlayersList()}
          </div>
          <div class="card mt-4" id="add-player-form-container">
            <h3 class="card-title mb-3">${this.editingPlayerId===null?`Add Player`:`Edit Player`}</h3>
            ${this.renderPlayerForm()}
          </div>
        </section>

        <!-- Games Section -->
        <section class="settings-section" aria-labelledby="games-section-heading">
          <h2 class="settings-section-title" id="games-section-heading">
            <span>🎯</span> Games
          </h2>
          <div id="games-list">
            ${this.renderGamesList()}
          </div>
          <div class="card mt-4" id="add-game-form-container">
            <h3 class="card-title mb-3">${this.editingGameId===null?`Add Game`:`Edit Game`}</h3>
            ${this.renderGameForm()}
          </div>
        </section>

        <!-- Live Sync Section -->
        <section class="settings-section" aria-labelledby="live-sync-section-heading">
          <h2 class="settings-section-title" id="live-sync-section-heading">
            <span>⚡</span> Live Sync
            ${h()?`<span class="sync-live-badge">● Live</span>`:``}
          </h2>
          ${this.renderFirebaseSection()}
        </section>

        <!-- Git Sync Section -->
        <section class="settings-section" aria-labelledby="sync-section-heading">
          <h2 class="settings-section-title" id="sync-section-heading">
            <span>☁️</span> Git Backup
          </h2>

          <div class="alert alert-warning mb-3">
            <span>⚠️</span>
            <span>Your API key / token is stored in localStorage. Never share it or use it on untrusted devices.</span>
          </div>

          <div class="card">
            <form id="sync-form" novalidate>

              <!-- Provider picker -->
              <div class="form-group">
                <label class="form-label">Provider</label>
                <div class="provider-toggle" role="group" aria-label="Sync provider">
                  <button type="button" class="provider-btn ${(this.syncConfig?.provider??`github`)===`github`?`active`:``}"
                    id="provider-github" data-provider="github" aria-pressed="${(this.syncConfig?.provider??`github`)===`github`}">
                    GitHub
                  </button>
                  <button type="button" class="provider-btn ${this.syncConfig?.provider===`gitea`?`active`:``}"
                    id="provider-gitea" data-provider="gitea" aria-pressed="${this.syncConfig?.provider===`gitea`}">
                    Gitea
                  </button>
                </div>
              </div>

              <!-- Gitea-only: base URL -->
              <div class="form-group" id="sync-baseurl-group" style="display:${this.syncConfig?.provider===`gitea`?`block`:`none`}">
                <label class="form-label" for="sync-baseurl">Gitea Base URL</label>
                <input class="form-input" type="url" id="sync-baseurl"
                  placeholder="https://gitea.example.com" autocomplete="off"
                  value="${this.syncConfig?.baseUrl?this.escHtml(this.syncConfig.baseUrl):``}" />
                <span class="form-hint">Your Gitea instance URL, no trailing slash</span>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label" for="sync-username">Username</label>
                  <input class="form-input" type="text" id="sync-username"
                    placeholder="octocat" autocomplete="off"
                    value="${this.syncConfig?this.escHtml(this.syncConfig.username):``}" />
                </div>
                <div class="form-group">
                  <label class="form-label" for="sync-repo">Repository</label>
                  <input class="form-input" type="text" id="sync-repo"
                    placeholder="my-scores" autocomplete="off"
                    value="${this.syncConfig?this.escHtml(this.syncConfig.repo):``}" />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label" for="sync-pat" id="sync-pat-label">
                  ${this.syncConfig?.provider===`gitea`?`API Key`:`Personal Access Token`}
                </label>
                <input class="form-input" type="password" id="sync-pat"
                  placeholder="${this.syncConfig?.provider===`gitea`?`your-api-key`:`ghp_xxxxxxxxxxxxxxxxxxxx`}"
                  autocomplete="off"
                  value="${this.syncConfig?this.escHtml(this.syncConfig.pat):``}" />
                <span class="form-hint" id="sync-pat-hint">
                  ${this.syncConfig?.provider===`gitea`?`Settings → Applications → Generate Token (needs repository read/write)`:`Needs <code>repo</code> scope`}
                </span>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label" for="sync-filepath">File Path</label>
                  <input class="form-input" type="text" id="sync-filepath"
                    placeholder="scorekeeper.json"
                    value="${this.syncConfig?this.escHtml(this.syncConfig.filePath):`scorekeeper.json`}" />
                </div>
                <div class="form-group">
                  <label class="form-label" for="sync-branch">Branch</label>
                  <input class="form-input" type="text" id="sync-branch"
                    placeholder="main"
                    value="${this.syncConfig?this.escHtml(this.syncConfig.branch):`main`}" />
                </div>
              </div>

              <div class="text-sm text-muted mb-3">
                Last sync: <strong id="last-sync-time">${this.formatTimestamp(this.syncConfig?.lastSync)}</strong>
              </div>
              <div class="btn-group">
                <button type="button" class="btn btn-secondary" id="test-connection-btn">Test</button>
                <button type="button" class="btn btn-primary flex-1" id="sync-to-github-btn">↑ Push</button>
                <button type="button" class="btn btn-secondary flex-1" id="sync-from-github-btn">↓ Pull</button>
              </div>
            </form>
          </div>
        </section>

        <!-- Data Section -->
        <section class="settings-section" aria-labelledby="data-section-heading">
          <h2 class="settings-section-title" id="data-section-heading">
            <span>💾</span> Data
          </h2>
          <div class="card">
            <div class="btn-group" style="flex-direction:column; gap:0.625rem">
              <button class="btn btn-secondary btn-full" id="export-btn">
                📤 Export All Data (JSON)
              </button>
              <button class="btn btn-secondary btn-full" id="import-btn">
                📥 Import Data (JSON)
              </button>
              <input type="file" id="import-file-input" accept=".json" style="display:none" aria-label="Import JSON file" />
              <div class="divider" style="margin: 0.25rem 0"></div>
              <button class="btn btn-danger btn-full" id="clear-data-btn">
                🗑️ Clear All Data
              </button>
            </div>
          </div>
        </section>

        <!-- Appearance Section -->
        <section class="settings-section" aria-labelledby="appearance-section-heading">
          <h2 class="settings-section-title" id="appearance-section-heading">
            <span>🎨</span> Appearance
          </h2>
          <div class="card">
            <div class="toggle-row">
              <div>
                <div class="font-semibold">Dark Mode</div>
                <div class="text-sm text-muted">Use dark theme</div>
              </div>
              <label class="toggle" aria-label="Toggle dark mode">
                <input type="checkbox" id="theme-toggle" ${e?`checked`:``} role="switch" aria-checked="${e}" />
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>
        </section>

        <div style="height: 1rem"></div>
      </main>
    `}renderFirebaseSection(){let e=this.roomConfig,t=h();if(e&&t){let t=v(e);return`
        <div class="card">
          <div class="toggle-row mb-3">
            <div>
              <div class="font-semibold">Room ID</div>
              <div class="text-sm text-muted font-mono">${this.escHtml(e.roomId)}</div>
            </div>
            <span class="badge badge-success">Connected</span>
          </div>

          <div class="text-sm text-muted mb-3">
            Last sync: <strong id="fb-last-sync">${this.formatTimestamp(e.lastSync)}</strong>
          </div>

          <div class="form-group">
            <label class="form-label">Share with friends</label>
            <div class="input-group">
              <input class="form-input" type="text" id="fb-share-url"
                readonly value="${this.escHtml(t)}" aria-label="Shareable room link" />
              <button class="btn btn-secondary" id="fb-copy-url-btn" type="button">Copy</button>
            </div>
            <span class="form-hint">Anyone who opens this link joins your room automatically.</span>
          </div>

          <div id="fb-qr-container" class="mb-3" style="text-align:center"></div>
          <button class="btn btn-secondary btn-full mb-2" id="fb-show-qr-btn" type="button">
            Show QR Code
          </button>

          <div class="btn-group mb-2">
            <button class="btn btn-primary flex-1" id="fb-push-btn" type="button">↑ Push Now</button>
            <button class="btn btn-secondary flex-1" id="fb-pull-btn" type="button">↓ Pull Now</button>
          </div>
          <button class="btn btn-danger btn-full" id="fb-disconnect-btn" type="button">
            Disconnect
          </button>
        </div>
      `}let n=e?.roomId??g();return`
      <div class="alert alert-info mb-3">
        <span>ℹ️</span>
        <span>Real-time sync for your friend group — no login needed. Create a room or enter one someone shared with you.</span>
      </div>

      <div class="card">
        <form id="fb-config-form" novalidate>
          <div class="form-group">
            <label class="form-label" for="fb-room-id">Room ID</label>
            <div class="input-group">
              <input class="form-input font-mono" type="text" id="fb-room-id"
                value="${this.escHtml(n)}" autocomplete="off"
                placeholder="Enter a room ID or generate one" />
              <button class="btn btn-secondary" type="button" id="fb-new-room-btn">New</button>
            </div>
            <span class="form-hint">Share this ID with friends so you all sync to the same room.</span>
          </div>
          <button class="btn btn-primary btn-full" type="submit" id="fb-connect-btn">
            Connect &amp; Sync
          </button>
        </form>
      </div>
    `}renderPlayersList(){return this.players.length===0?`<p class="text-sm text-muted">No players yet. Add one below.</p>`:this.players.map(e=>`
      <div class="player-list-item" data-player-id="${e.id}">
        <div class="player-avatar player-avatar-sm" style="background:${e.color}">
          ${e.displayName.charAt(0).toUpperCase()}
        </div>
        <div class="flex-1">
          <div class="font-semibold text-sm">${this.escHtml(e.displayName)}</div>
          <div class="text-xs text-muted">${e.active?`Active`:`Inactive`}</div>
        </div>
        <div class="actions">
          <button class="btn btn-icon btn-sm edit-player-btn" data-player-id="${e.id}" aria-label="Edit ${this.escHtml(e.displayName)}">
            ✏️
          </button>
          <button class="btn btn-icon btn-sm delete-player-btn" data-player-id="${e.id}" aria-label="Delete ${this.escHtml(e.displayName)}">
            🗑️
          </button>
        </div>
      </div>
    `).join(``)}renderPlayerForm(e){let t=e?.displayName??``,n=e?.color??G[0],r=e?.active??!0,i=G.map(e=>`
      <div class="color-swatch ${e===n?`selected`:``}"
        style="background:${e}" data-color="${e}" role="option" aria-label="Color ${e}"
        aria-selected="${e===n}" tabindex="0"></div>
    `).join(``);return`
      <form id="player-form" novalidate>
        <input type="hidden" id="player-editing-id" value="${e?.id??``}" />
        <div class="form-group">
          <label class="form-label" for="player-name">Name <span aria-hidden="true">*</span></label>
          <input class="form-input" type="text" id="player-name" placeholder="e.g. Alice"
            value="${this.escHtml(t)}" required maxlength="30" autocomplete="off" />
          <span class="form-error" id="player-name-error" role="alert" aria-live="polite"></span>
        </div>
        <div class="form-group">
          <label class="form-label">Color</label>
          <input type="hidden" id="player-color" value="${n}" />
          <div class="color-options" role="listbox" aria-label="Player color">
            ${i}
          </div>
        </div>
        <div class="form-group">
          <label class="checkbox-item" for="player-active">
            <input type="checkbox" id="player-active" ${r?`checked`:``} />
            <span>Active player</span>
          </label>
        </div>
        <div class="btn-group">
          <button type="submit" class="btn btn-primary flex-1" id="save-player-btn">
            ${e?`Update Player`:`Add Player`}
          </button>
          ${e?`<button type="button" class="btn btn-secondary" id="cancel-edit-player-btn">Cancel</button>`:``}
        </div>
      </form>
    `}renderGamesList(){return this.games.length===0?`<p class="text-sm text-muted">No games yet. Add one below.</p>`:this.games.map(e=>`
      <div class="game-list-item" data-game-id="${e.id}">
        <span style="font-size:1.25rem">🎯</span>
        <div class="flex-1">
          <div class="font-semibold text-sm">${this.escHtml(e.name)}</div>
          <div class="text-xs text-muted">${e.scoringMode} scoring${e.roundLabels?.length?` · ${e.roundLabels.length} round labels`:``}${e.rules?` · `+this.escHtml(e.rules.substring(0,40)):``}</div>
        </div>
        <div class="actions">
          <button class="btn btn-icon btn-sm edit-game-btn" data-game-id="${e.id}" aria-label="Edit ${this.escHtml(e.name)}">
            ✏️
          </button>
          <button class="btn btn-icon btn-sm delete-game-btn" data-game-id="${e.id}" aria-label="Delete ${this.escHtml(e.name)}">
            🗑️
          </button>
        </div>
      </div>
    `).join(``)}renderGameForm(e){let t=e?.name??``,n=e?.scoringMode??`high`,r=e?.rules??``,i=e?.targetScore??``,a=(e?.roundLabels??[]).join(`
`);return`
      <form id="game-form" novalidate>
        <input type="hidden" id="game-editing-id" value="${e?.id??``}" />
        <div class="form-group">
          <label class="form-label" for="game-name">Game Name <span aria-hidden="true">*</span></label>
          <input class="form-input" type="text" id="game-name" placeholder="e.g. Five Crowns"
            value="${this.escHtml(t)}" required maxlength="50" autocomplete="off" />
          <span class="form-error" id="game-name-error" role="alert" aria-live="polite"></span>
        </div>
        <div class="form-group">
          <label class="form-label" for="game-mode">Scoring Mode</label>
          <select class="form-select" id="game-mode">
            <option value="high" ${n===`high`?`selected`:``}>High score wins</option>
            <option value="low" ${n===`low`?`selected`:``}>Low score wins</option>
            <option value="rounds" ${n===`rounds`?`selected`:``}>Rounds (per-round input)</option>
            <option value="finish-order" ${n===`finish-order`?`selected`:``}>Finish order (1st, 2nd...)</option>
            <option value="custom" ${n===`custom`?`selected`:``}>Custom</option>
            <option value="phase10" ${n===`phase10`?`selected`:``}>Phase 10 (track phases + penalty points)</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="game-round-labels">Round Labels (optional)</label>
          <textarea class="form-textarea" id="game-round-labels"
            placeholder="One label per line, e.g.&#10;Phase 1&#10;Phase 2&#10;Phase 3"
            rows="4">${this.escHtml(a)}</textarea>
          <span class="form-hint">Names each round — great for Phase 10, Five Crowns, etc. Leave blank to use "Round 1, Round 2…"</span>
        </div>
        <div class="form-group">
          <label class="form-label" for="game-rules">Rules / Notes (optional)</label>
          <textarea class="form-textarea" id="game-rules" placeholder="Any rule notes..."
            maxlength="200" rows="2">${this.escHtml(r)}</textarea>
        </div>
        <div class="form-group">
          <label class="form-label" for="game-target">Target Score (optional)</label>
          <input class="form-input" type="number" id="game-target"
            placeholder="e.g. 10" value="${i}" min="1" />
          <span class="form-hint">Win condition score, if applicable</span>
        </div>
        <div class="btn-group">
          <button type="submit" class="btn btn-primary flex-1" id="save-game-btn">
            ${e?`Update Game`:`Add Game`}
          </button>
          ${e?`<button type="button" class="btn btn-secondary" id="cancel-edit-game-btn">Cancel</button>`:``}
        </div>
      </form>
    `}afterRender(){this.bindPlayerForm(),this.bindGameForm(),this.bindFirebaseSection(),this.bindSyncForm(),this.bindDataButtons(),this.bindThemeToggle(),this.bindColorSwatches()}bindFirebaseSection(){let e=this.roomConfig,t=h();if(e&&t){document.getElementById(`fb-copy-url-btn`)?.addEventListener(`click`,()=>{let e=document.getElementById(`fb-share-url`);navigator.clipboard.writeText(e.value).then(()=>{l(`Link copied!`,`success`)}).catch(()=>{e.select(),document.execCommand(`copy`),l(`Link copied!`,`success`)})}),document.getElementById(`fb-show-qr-btn`)?.addEventListener(`click`,async()=>{let t=document.getElementById(`fb-show-qr-btn`),n=document.getElementById(`fb-qr-container`);if(n){if(n.innerHTML){n.innerHTML=``,t.textContent=`Show QR Code`;return}t.textContent=`Generating…`;try{let{default:r}=await c(async()=>{let{default:e}=await import(`./browser-DO4MgJLB.js`).then(e=>j(e.default,1));return{default:e}},[],import.meta.url),i=v(e);n.innerHTML=await r.toString(i,{type:`svg`,margin:1,width:220}),t.textContent=`Hide QR Code`}catch(e){console.error(`QR generation failed:`,e),t.textContent=`Show QR Code`,l(`QR generation failed`,`error`)}}}),document.getElementById(`fb-push-btn`)?.addEventListener(`click`,async()=>{let e=document.getElementById(`fb-push-btn`);e.disabled=!0,e.textContent=`Pushing…`;try{let e=await s();if(l(e.message,e.ok?`success`:`error`),e.ok){this.roomConfig=d();let e=document.getElementById(`fb-last-sync`);e&&(e.textContent=this.formatTimestamp(this.roomConfig?.lastSync))}}finally{e.disabled=!1,e.textContent=`↑ Push Now`}}),document.getElementById(`fb-pull-btn`)?.addEventListener(`click`,async()=>{let e=document.getElementById(`fb-pull-btn`);e.disabled=!0,e.textContent=`Pulling…`;try{let e=await _();if(l(e.message,e.ok?`success`:`error`),e.ok){this.roomConfig=d();let e=document.getElementById(`fb-last-sync`);e&&(e.textContent=this.formatTimestamp(this.roomConfig?.lastSync))}}finally{e.disabled=!1,e.textContent=`↓ Pull Now`}}),document.getElementById(`fb-disconnect-btn`)?.addEventListener(`click`,()=>{if(!confirm(`Disconnect from live sync? Local data is kept, sync stops.`))return;y(),m(),this.roomConfig=null;let e=document.getElementById(`view-container`);e&&(e.innerHTML=this.render(),this.afterRender()),l(`Disconnected from live sync`,`info`)});return}document.getElementById(`fb-new-room-btn`)?.addEventListener(`click`,()=>{let e=document.getElementById(`fb-room-id`);e&&(e.value=g())});let n=document.getElementById(`fb-config-form`);n&&n.addEventListener(`submit`,async e=>{e.preventDefault();let t=document.getElementById(`fb-room-id`).value.trim();if(!t){l(`Room ID is required`,`error`);return}let n={roomId:t};p(n),this.roomConfig=n;let r=document.getElementById(`fb-connect-btn`);r.disabled=!0,r.textContent=`Connecting…`;try{let e=await a(n,()=>{let e=document.getElementById(`view-container`);e&&(e.innerHTML=this.render(),this.afterRender())});if(e.ok){l(e.message,`success`),this.roomConfig=d();let t=document.getElementById(`view-container`);t&&(t.innerHTML=this.render(),this.afterRender())}else l(e.message,`error`),r.disabled=!1,r.textContent=`Connect & Sync`}catch(e){l(`Connection error: ${e instanceof Error?e.message:String(e)}`,`error`),r.disabled=!1,r.textContent=`Connect & Sync`}})}bindColorSwatches(){document.querySelectorAll(`.color-swatch`).forEach(e=>{let t=()=>{let t=e.dataset.color??``;document.querySelectorAll(`.color-swatch`).forEach(e=>{e.classList.remove(`selected`),e.setAttribute(`aria-selected`,`false`)}),e.classList.add(`selected`),e.setAttribute(`aria-selected`,`true`);let n=document.getElementById(`player-color`);n&&(n.value=t)};e.addEventListener(`click`,t),e.addEventListener(`keydown`,e=>{(e.key===`Enter`||e.key===` `)&&(e.preventDefault(),t())})})}bindPlayerForm(){document.querySelectorAll(`.edit-player-btn`).forEach(e=>{e.addEventListener(`click`,e=>{let t=parseInt(e.currentTarget.dataset.playerId??``,10);this.editingPlayerId=t;let n=this.players.find(e=>e.id===t),r=document.getElementById(`add-player-form-container`);if(r&&n){let e=r.querySelector(`h3`);e&&(e.textContent=`Edit Player`);let t=r.querySelector(`#player-form`);t&&(t.outerHTML=this.renderPlayerForm(n)),r.innerHTML=`<h3 class="card-title mb-3">Edit Player</h3>${this.renderPlayerForm(n)}`,this.bindColorSwatches(),this.bindPlayerFormSubmit(),document.getElementById(`cancel-edit-player-btn`)?.addEventListener(`click`,()=>{this.editingPlayerId=null,r.innerHTML=`<h3 class="card-title mb-3">Add Player</h3>${this.renderPlayerForm()}`,this.bindColorSwatches(),this.bindPlayerFormSubmit()}),r.scrollIntoView({behavior:`smooth`,block:`nearest`})}})}),document.querySelectorAll(`.delete-player-btn`).forEach(t=>{t.addEventListener(`click`,async t=>{let n=parseInt(t.currentTarget.dataset.playerId??``,10),r=this.players.find(e=>e.id===n);if(r&&confirm(`Delete player "${r.displayName}"? This will not affect existing match records.`))try{await e(n),this.players=this.players.filter(e=>e.id!==n);let t=document.getElementById(`players-list`);t&&(t.innerHTML=this.renderPlayersList()),this.bindPlayerForm(),l(`Player deleted`,`info`)}catch{l(`Failed to delete player`,`error`)}})}),this.bindPlayerFormSubmit()}bindPlayerFormSubmit(){let e=document.getElementById(`player-form`);if(!e)return;let n=e.cloneNode(!0);e.replaceWith(n),this.bindColorSwatches(),n.addEventListener(`submit`,async e=>{e.preventDefault();let n=document.getElementById(`player-name`),r=document.getElementById(`player-color`),i=document.getElementById(`player-active`),a=document.getElementById(`player-editing-id`)?.value,o=document.getElementById(`player-name-error`),s=n.value.trim();if(!s){o&&(o.textContent=`Name is required`),n.focus();return}o&&(o.textContent=``);let c={displayName:s,color:r.value||G[0],active:i.checked,createdAt:Date.now()};try{a?(await t(parseInt(a,10),{displayName:c.displayName,color:c.color,active:c.active}),l(`Player updated`,`success`)):(await b(c),l(`${s} added!`,`success`)),this.players=await f(),this.editingPlayerId=null;let e=document.getElementById(`players-list`);e&&(e.innerHTML=this.renderPlayersList());let n=document.getElementById(`add-player-form-container`);n&&(n.innerHTML=`<h3 class="card-title mb-3">Add Player</h3>${this.renderPlayerForm()}`),this.bindColorSwatches(),this.bindPlayerFormSubmit(),this.bindPlayerForm()}catch(e){console.error(e),l(`Failed to save player`,`error`)}})}bindGameForm(){document.querySelectorAll(`.edit-game-btn`).forEach(e=>{e.addEventListener(`click`,e=>{let t=parseInt(e.currentTarget.dataset.gameId??``,10);this.editingGameId=t;let n=this.games.find(e=>e.id===t),r=document.getElementById(`add-game-form-container`);r&&n&&(r.innerHTML=`<h3 class="card-title mb-3">Edit Game</h3>${this.renderGameForm(n)}`,this.bindGameFormSubmit(),document.getElementById(`cancel-edit-game-btn`)?.addEventListener(`click`,()=>{this.editingGameId=null,r.innerHTML=`<h3 class="card-title mb-3">Add Game</h3>${this.renderGameForm()}`,this.bindGameFormSubmit()}),r.scrollIntoView({behavior:`smooth`,block:`nearest`}))})}),document.querySelectorAll(`.delete-game-btn`).forEach(e=>{e.addEventListener(`click`,async e=>{let t=parseInt(e.currentTarget.dataset.gameId??``,10),n=this.games.find(e=>e.id===t);if(n&&confirm(`Delete game "${n.name}"? This will not affect existing match records.`))try{await o(t),this.games=this.games.filter(e=>e.id!==t);let e=document.getElementById(`games-list`);e&&(e.innerHTML=this.renderGamesList()),this.bindGameForm(),l(`Game deleted`,`info`)}catch{l(`Failed to delete game`,`error`)}})}),this.bindGameFormSubmit()}bindGameFormSubmit(){let e=document.getElementById(`game-form`);if(!e)return;let t=e.cloneNode(!0);e.replaceWith(t),t.addEventListener(`submit`,async e=>{e.preventDefault();let t=document.getElementById(`game-name`),n=document.getElementById(`game-mode`),a=document.getElementById(`game-rules`),o=document.getElementById(`game-target`),s=document.getElementById(`game-round-labels`),c=document.getElementById(`game-editing-id`)?.value,d=document.getElementById(`game-name-error`),f=t.value.trim();if(!f){d&&(d.textContent=`Game name is required`),t.focus();return}d&&(d.textContent=``);let p=s.value.split(`
`).map(e=>e.trim()).filter(e=>e.length>0),m={name:f,scoringMode:n.value,rules:a.value.trim()||void 0,targetScore:o.value?parseInt(o.value,10):void 0,roundLabels:p.length>0?p:void 0,createdAt:Date.now()};try{c?(await i(parseInt(c,10),{name:m.name,scoringMode:m.scoringMode,rules:m.rules,targetScore:m.targetScore,roundLabels:m.roundLabels}),l(`Game updated`,`success`)):(await u(m),l(`${f} added!`,`success`)),this.games=await r(),this.editingGameId=null;let e=document.getElementById(`games-list`);e&&(e.innerHTML=this.renderGamesList());let t=document.getElementById(`add-game-form-container`);t&&(t.innerHTML=`<h3 class="card-title mb-3">Add Game</h3>${this.renderGameForm()}`),this.bindGameFormSubmit(),this.bindGameForm()}catch(e){console.error(e),l(`Failed to save game`,`error`)}})}bindSyncForm(){let e=this.syncConfig?.provider??`github`,t=t=>{e=t,document.querySelectorAll(`.provider-btn`).forEach(e=>{let n=e.dataset.provider===t;e.classList.toggle(`active`,n),e.setAttribute(`aria-pressed`,String(n))});let n=document.getElementById(`sync-baseurl-group`);n&&(n.style.display=t===`gitea`?`block`:`none`);let r=document.getElementById(`sync-pat-label`),i=document.getElementById(`sync-pat`),a=document.getElementById(`sync-pat-hint`);r&&(r.textContent=t===`gitea`?`API Key`:`Personal Access Token`),i&&(i.placeholder=t===`gitea`?`your-api-key`:`ghp_xxxxxxxxxxxxxxxxxxxx`),a&&(a.innerHTML=t===`gitea`?`Settings → Applications → Generate Token (needs repository read/write)`:`Needs <code>repo</code> scope`)};document.querySelectorAll(`.provider-btn`).forEach(e=>{e.addEventListener(`click`,()=>{t(e.dataset.provider)})});let n=()=>({provider:e,baseUrl:e===`gitea`?document.getElementById(`sync-baseurl`).value.trim().replace(/\/+$/,``):void 0,username:document.getElementById(`sync-username`).value.trim(),repo:document.getElementById(`sync-repo`).value.trim(),pat:document.getElementById(`sync-pat`).value.trim(),filePath:document.getElementById(`sync-filepath`).value.trim()||`scorekeeper.json`,branch:document.getElementById(`sync-branch`).value.trim()||`main`,lastSync:this.syncConfig?.lastSync}),r=e=>{let t=V(e);return t?(l(t,`error`),!1):!0};document.getElementById(`test-connection-btn`)?.addEventListener(`click`,async()=>{let e=n();if(!r(e))return;let t=document.getElementById(`test-connection-btn`);t.disabled=!0,t.textContent=`Testing…`;try{P(e),this.syncConfig=e;let t=await H(e);l(t.message,t.ok?`success`:`error`)}finally{t.disabled=!1,t.textContent=`Test`}}),document.getElementById(`sync-to-github-btn`)?.addEventListener(`click`,async()=>{let e=n();if(!r(e))return;let t=document.getElementById(`sync-to-github-btn`);t.disabled=!0,t.textContent=`Pushing…`;try{P(e),this.syncConfig=e;let t=await U(e);if(l(t.message,t.ok?`success`:`error`),t.ok){this.syncConfig=N();let e=document.getElementById(`last-sync-time`);e&&(e.textContent=this.formatTimestamp(this.syncConfig?.lastSync))}}finally{t.disabled=!1,t.textContent=`↑ Push`}}),document.getElementById(`sync-from-github-btn`)?.addEventListener(`click`,async()=>{let e=n();if(!r(e))return;let t=document.getElementById(`sync-from-github-btn`);t.disabled=!0,t.textContent=`Pulling…`;try{P(e),this.syncConfig=e;let t=e.provider===`gitea`?`Gitea`:`GitHub`,n=await W(e,async()=>confirm(`Local data exists. Overwrite with ${t} data? This cannot be undone.`));if(l(n.message,n.ok?`success`:`error`),n.ok){this.syncConfig=N();let e=document.getElementById(`last-sync-time`);e&&(e.textContent=this.formatTimestamp(this.syncConfig?.lastSync)),await this.load();let t=document.getElementById(`players-list`);t&&(t.innerHTML=this.renderPlayersList());let n=document.getElementById(`games-list`);n&&(n.innerHTML=this.renderGamesList()),this.bindPlayerForm(),this.bindGameForm()}}finally{t.disabled=!1,t.textContent=`↓ Pull`}})}bindDataButtons(){document.getElementById(`export-btn`)?.addEventListener(`click`,async()=>{try{let e=await x(),t=JSON.stringify(e,null,2),n=new Blob([t],{type:`application/json`}),r=URL.createObjectURL(n),i=document.createElement(`a`);i.href=r,i.download=`scorekeeper-export-${new Date().toISOString().split(`T`)[0]}.json`,i.click(),URL.revokeObjectURL(r),l(`Data exported!`,`success`)}catch{l(`Export failed`,`error`)}}),document.getElementById(`import-btn`)?.addEventListener(`click`,()=>{document.getElementById(`import-file-input`)?.click()}),document.getElementById(`import-file-input`)?.addEventListener(`change`,async e=>{let t=e.target.files?.[0];if(t&&confirm(`Import will replace ALL current data. Continue?`))try{let e=await t.text();await n(JSON.parse(e)),l(`Data imported successfully!`,`success`),await this.load();let r=document.getElementById(`view-container`);r&&(r.innerHTML=this.render(),this.afterRender())}catch(e){console.error(e),l(`Import failed — invalid JSON`,`error`)}}),document.getElementById(`clear-data-btn`)?.addEventListener(`click`,async()=>{if(confirm(`Clear ALL data? This permanently deletes all players, games, nights, and scores. This CANNOT be undone.`)&&confirm(`Are you absolutely sure? All data will be lost forever.`))try{await S.transaction(`rw`,[S.players,S.games,S.gameNights,S.matches,S.scoreEntries],async()=>{await S.players.clear(),await S.games.clear(),await S.gameNights.clear(),await S.matches.clear(),await S.scoreEntries.clear()}),l(`All data cleared`,`info`),window.location.reload()}catch{l(`Failed to clear data`,`error`)}})}bindThemeToggle(){let e=document.getElementById(`theme-toggle`);e?.addEventListener(`change`,()=>{let t=e.checked,n=t?`dark`:`light`;document.documentElement.setAttribute(`data-theme`,n),localStorage.setItem(`theme`,n),e.setAttribute(`aria-checked`,String(t))})}};export{K as Settings,k as t};