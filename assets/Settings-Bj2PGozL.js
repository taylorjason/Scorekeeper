var U=Object.defineProperty;var j=(t,e,s)=>e in t?U(t,e,{enumerable:!0,configurable:!0,writable:!0,value:s}):t[e]=s;var I=(t,e,s)=>j(t,typeof e!="symbol"?e+"":e,s);import{p as L,q as F,b as A,c as G,r as w,t as $,v as T,w as H,s as p,_ as q,x as M,y as O,z as _,A as J,B as K,C as Q,D as z,E as Y,F as W,G as V,H as X,I as Z,h as g}from"./index-DvFUg3xa.js";const R="scorekeeper_sync_config";function S(){try{const t=localStorage.getItem(R);if(!t)return null;const e=JSON.parse(t);return e.provider||(e.provider="github"),e}catch{return null}}function x(t){localStorage.setItem(R,JSON.stringify(t))}function N(t){return(t.baseUrl??"").replace(/\/+$/,"")}function D(t){return t.provider==="gitea"?`${N(t)}/api/v1/repos/${t.username}/${t.repo}/contents/${t.filePath}`:`https://api.github.com/repos/${t.username}/${t.repo}/contents/${t.filePath}`}function ee(t){return t.provider==="gitea"?`${N(t)}/api/v1/repos/${t.username}/${t.repo}`:`https://api.github.com/repos/${t.username}/${t.repo}`}function P(t){const e={Authorization:`token ${t.pat}`,"Content-Type":"application/json"};return t.provider==="github"&&(e.Accept="application/vnd.github.v3+json"),e}function B(t){return t.provider==="gitea"?"Gitea":"GitHub"}function C(t,e){const s=e==="gitea"?"Gitea":"GitHub";switch(t){case 401:return`Unauthorized – check your ${e==="gitea"?"API key":"Personal Access Token"}`;case 403:return"Forbidden – token may lack repo write permissions";case 404:return"Not Found – check username, repo name, and file path";case 409:return`Conflict – file was modified remotely; try syncing from ${s} first`;case 422:return"Unprocessable – invalid request data";case 429:return"Rate Limited – too many requests, try again in a minute";default:return`${s} API error (HTTP ${t})`}}function te(t){return t.username?t.repo?t.pat?t.provider==="gitea"&&!t.baseUrl?"Base URL is required for Gitea":null:t.provider==="gitea"?"API key is required":"Personal Access Token is required":"Repository name is required":"Username is required"}async function ne(t){try{const e=await fetch(ee(t),{headers:P(t)});if(e.ok){const s=await e.json();return{ok:!0,message:`Connected to ${s.full_name??`${t.username}/${s.name??t.repo}`} on ${B(t)}`}}return{ok:!1,message:C(e.status,t.provider)}}catch(e){return{ok:!1,message:`Network error: ${e instanceof Error?e.message:String(e)}`}}}async function se(t){try{const e=await L(),s=JSON.stringify(e,null,2),a=btoa(unescape(encodeURIComponent(s))),o=D(t),i=P(t);let l;const c=await fetch(`${o}?ref=${encodeURIComponent(t.branch)}`,{headers:i});if(c.ok)l=(await c.json()).sha;else if(c.status!==404)return{ok:!1,message:C(c.status,t.provider)};const b={message:`Scorekeeper sync ${new Date().toISOString()}`,content:a,branch:t.branch};l&&(b.sha=l);const r=await fetch(o,{method:"PUT",headers:i,body:JSON.stringify(b)});return r.ok?(x({...t,lastSync:Date.now()}),{ok:!0,message:`Synced to ${B(t)} successfully`}):{ok:!1,message:C(r.status,t.provider)}}catch(e){return{ok:!1,message:`Sync error: ${e instanceof Error?e.message:String(e)}`}}}async function ae(t,e){try{const s=`${D(t)}?ref=${encodeURIComponent(t.branch)}`,a=await fetch(s,{headers:P(t)});if(!a.ok)return{ok:!1,message:C(a.status,t.provider)};const o=await a.json(),i=decodeURIComponent(escape(atob(o.content.replace(/\n/g,"")))),l=JSON.parse(i),c=await L();return(c.players.length>0||c.gameNights.length>0||c.matches.length>0)&&!await e()?{ok:!1,message:"Sync cancelled"}:(await F(l),x({...t,lastSync:Date.now()}),{ok:!0,message:`Synced from ${B(t)} successfully`})}catch(s){return{ok:!1,message:`Sync error: ${s instanceof Error?s.message:String(s)}`}}}const k=["#ef4444","#f97316","#f59e0b","#eab308","#10b981","#14b8a6","#3b82f6","#6366f1","#8b5cf6","#ec4899","#64748b","#d97706"];class oe{constructor(){I(this,"players",[]);I(this,"games",[]);I(this,"syncConfig",null);I(this,"roomConfig",null);I(this,"editingPlayerId",null);I(this,"editingGameId",null)}async load(){const[e,s]=await Promise.all([A(),G()]);this.players=e,this.games=s,this.syncConfig=S(),this.roomConfig=w()}escHtml(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}formatTimestamp(e){return e?new Date(e).toLocaleString():"Never"}render(){var a,o,i,l,c,b,r,n,d,m;const s=(document.documentElement.getAttribute("data-theme")??"dark")!=="light";return`
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
            <h3 class="card-title mb-3">${this.editingPlayerId!==null?"Edit Player":"Add Player"}</h3>
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
            <h3 class="card-title mb-3">${this.editingGameId!==null?"Edit Game":"Add Game"}</h3>
            ${this.renderGameForm()}
          </div>
        </section>

        <!-- Live Sync Section -->
        <section class="settings-section" aria-labelledby="live-sync-section-heading">
          <h2 class="settings-section-title" id="live-sync-section-heading">
            <span>⚡</span> Live Sync
            ${$()?'<span class="sync-live-badge">● Live</span>':""}
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
                  <button type="button" class="provider-btn ${(((a=this.syncConfig)==null?void 0:a.provider)??"github")==="github"?"active":""}"
                    id="provider-github" data-provider="github" aria-pressed="${(((o=this.syncConfig)==null?void 0:o.provider)??"github")==="github"}">
                    GitHub
                  </button>
                  <button type="button" class="provider-btn ${((i=this.syncConfig)==null?void 0:i.provider)==="gitea"?"active":""}"
                    id="provider-gitea" data-provider="gitea" aria-pressed="${((l=this.syncConfig)==null?void 0:l.provider)==="gitea"}">
                    Gitea
                  </button>
                </div>
              </div>

              <!-- Gitea-only: base URL -->
              <div class="form-group" id="sync-baseurl-group" style="display:${((c=this.syncConfig)==null?void 0:c.provider)==="gitea"?"block":"none"}">
                <label class="form-label" for="sync-baseurl">Gitea Base URL</label>
                <input class="form-input" type="url" id="sync-baseurl"
                  placeholder="https://gitea.example.com" autocomplete="off"
                  value="${(b=this.syncConfig)!=null&&b.baseUrl?this.escHtml(this.syncConfig.baseUrl):""}" />
                <span class="form-hint">Your Gitea instance URL, no trailing slash</span>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label" for="sync-username">Username</label>
                  <input class="form-input" type="text" id="sync-username"
                    placeholder="octocat" autocomplete="off"
                    value="${this.syncConfig?this.escHtml(this.syncConfig.username):""}" />
                </div>
                <div class="form-group">
                  <label class="form-label" for="sync-repo">Repository</label>
                  <input class="form-input" type="text" id="sync-repo"
                    placeholder="my-scores" autocomplete="off"
                    value="${this.syncConfig?this.escHtml(this.syncConfig.repo):""}" />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label" for="sync-pat" id="sync-pat-label">
                  ${((r=this.syncConfig)==null?void 0:r.provider)==="gitea"?"API Key":"Personal Access Token"}
                </label>
                <input class="form-input" type="password" id="sync-pat"
                  placeholder="${((n=this.syncConfig)==null?void 0:n.provider)==="gitea"?"your-api-key":"ghp_xxxxxxxxxxxxxxxxxxxx"}"
                  autocomplete="off"
                  value="${this.syncConfig?this.escHtml(this.syncConfig.pat):""}" />
                <span class="form-hint" id="sync-pat-hint">
                  ${((d=this.syncConfig)==null?void 0:d.provider)==="gitea"?"Settings → Applications → Generate Token (needs repository read/write)":"Needs <code>repo</code> scope"}
                </span>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label" for="sync-filepath">File Path</label>
                  <input class="form-input" type="text" id="sync-filepath"
                    placeholder="scorekeeper.json"
                    value="${this.syncConfig?this.escHtml(this.syncConfig.filePath):"scorekeeper.json"}" />
                </div>
                <div class="form-group">
                  <label class="form-label" for="sync-branch">Branch</label>
                  <input class="form-input" type="text" id="sync-branch"
                    placeholder="main"
                    value="${this.syncConfig?this.escHtml(this.syncConfig.branch):"main"}" />
                </div>
              </div>

              <div class="text-sm text-muted mb-3">
                Last sync: <strong id="last-sync-time">${this.formatTimestamp((m=this.syncConfig)==null?void 0:m.lastSync)}</strong>
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
                <input type="checkbox" id="theme-toggle" ${s?"checked":""} role="switch" aria-checked="${s}" />
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>
        </section>

        <div style="height: 1rem"></div>
      </main>
    `}renderFirebaseSection(){const e=this.roomConfig,s=$();if(e&&s){const c=T(e);return`
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
                readonly value="${this.escHtml(c)}" aria-label="Shareable room link" />
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
      `}const a=(e==null?void 0:e.apiKey)??"",o=(e==null?void 0:e.projectId)??"",i=(e==null?void 0:e.appId)??"",l=(e==null?void 0:e.roomId)??H();return`
      <div class="alert alert-info mb-3">
        <span>ℹ️</span>
        <span>Real-time sync for your friend group — no login needed. Everyone shares one room.</span>
      </div>

      <details class="card mb-3" id="fb-setup-instructions">
        <summary class="font-semibold" style="cursor:pointer;padding:0.5rem 0">
          How to set up Firebase (one-time, free)
        </summary>
        <ol class="text-sm" style="margin:0.75rem 0 0 1.25rem;line-height:1.8">
          <li>Go to <strong>console.firebase.google.com</strong> → Create a project</li>
          <li>In the project: <strong>Build → Firestore Database</strong> → Create database → Start in <em>test mode</em></li>
          <li><strong>Build → Authentication</strong> → Get started → Anonymous → Enable</li>
          <li><strong>Project Settings</strong> (gear icon) → <em>Your apps</em> → Add app → Web → Register</li>
          <li>Copy the <code>apiKey</code>, <code>projectId</code>, and <code>appId</code> from the config snippet below</li>
        </ol>
        <div class="alert alert-warning mt-2 text-sm">
          <span>⚠️</span>
          <span>After setup, go to Firestore → Rules and set: <code>allow read, write: if request.auth != null;</code> to keep your data private to authenticated sessions only.</span>
        </div>
      </details>

      <div class="card">
        <form id="fb-config-form" novalidate>
          <div class="form-group">
            <label class="form-label" for="fb-api-key">API Key</label>
            <input class="form-input" type="text" id="fb-api-key"
              placeholder="AIzaSy..." autocomplete="off"
              value="${this.escHtml(a)}" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="fb-project-id">Project ID</label>
              <input class="form-input" type="text" id="fb-project-id"
                placeholder="my-scorekeeper" autocomplete="off"
                value="${this.escHtml(o)}" />
            </div>
            <div class="form-group">
              <label class="form-label" for="fb-app-id">App ID</label>
              <input class="form-input" type="text" id="fb-app-id"
                placeholder="1:123:web:abc" autocomplete="off"
                value="${this.escHtml(i)}" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label" for="fb-room-id">Room ID</label>
            <div class="input-group">
              <input class="form-input font-mono" type="text" id="fb-room-id"
                value="${this.escHtml(l)}" autocomplete="off" />
              <button class="btn btn-secondary" type="button" id="fb-new-room-btn">New</button>
            </div>
            <span class="form-hint">A random ID shared with your group. Click New to generate a fresh one.</span>
          </div>
          <button class="btn btn-primary btn-full" type="submit" id="fb-connect-btn">
            Connect &amp; Sync
          </button>
        </form>
      </div>
    `}renderPlayersList(){return this.players.length===0?'<p class="text-sm text-muted">No players yet. Add one below.</p>':this.players.map(e=>`
      <div class="player-list-item" data-player-id="${e.id}">
        <div class="player-avatar player-avatar-sm" style="background:${e.color}">
          ${e.displayName.charAt(0).toUpperCase()}
        </div>
        <div class="flex-1">
          <div class="font-semibold text-sm">${this.escHtml(e.displayName)}</div>
          <div class="text-xs text-muted">${e.active?"Active":"Inactive"}</div>
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
    `).join("")}renderPlayerForm(e){const s=(e==null?void 0:e.displayName)??"",a=(e==null?void 0:e.color)??k[0],o=(e==null?void 0:e.active)??!0,i=k.map(l=>`
      <div class="color-swatch ${l===a?"selected":""}"
        style="background:${l}" data-color="${l}" role="option" aria-label="Color ${l}"
        aria-selected="${l===a}" tabindex="0"></div>
    `).join("");return`
      <form id="player-form" novalidate>
        <input type="hidden" id="player-editing-id" value="${(e==null?void 0:e.id)??""}" />
        <div class="form-group">
          <label class="form-label" for="player-name">Name <span aria-hidden="true">*</span></label>
          <input class="form-input" type="text" id="player-name" placeholder="e.g. Alice"
            value="${this.escHtml(s)}" required maxlength="30" autocomplete="off" />
          <span class="form-error" id="player-name-error" role="alert" aria-live="polite"></span>
        </div>
        <div class="form-group">
          <label class="form-label">Color</label>
          <input type="hidden" id="player-color" value="${a}" />
          <div class="color-options" role="listbox" aria-label="Player color">
            ${i}
          </div>
        </div>
        <div class="form-group">
          <label class="checkbox-item" for="player-active">
            <input type="checkbox" id="player-active" ${o?"checked":""} />
            <span>Active player</span>
          </label>
        </div>
        <div class="btn-group">
          <button type="submit" class="btn btn-primary flex-1" id="save-player-btn">
            ${e?"Update Player":"Add Player"}
          </button>
          ${e?'<button type="button" class="btn btn-secondary" id="cancel-edit-player-btn">Cancel</button>':""}
        </div>
      </form>
    `}renderGamesList(){return this.games.length===0?'<p class="text-sm text-muted">No games yet. Add one below.</p>':this.games.map(e=>{var s;return`
      <div class="game-list-item" data-game-id="${e.id}">
        <span style="font-size:1.25rem">🎯</span>
        <div class="flex-1">
          <div class="font-semibold text-sm">${this.escHtml(e.name)}</div>
          <div class="text-xs text-muted">${e.scoringMode} scoring${(s=e.roundLabels)!=null&&s.length?` · ${e.roundLabels.length} round labels`:""}${e.rules?" · "+this.escHtml(e.rules.substring(0,40)):""}</div>
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
    `}).join("")}renderGameForm(e){const s=(e==null?void 0:e.name)??"",a=(e==null?void 0:e.scoringMode)??"high",o=(e==null?void 0:e.rules)??"",i=(e==null?void 0:e.targetScore)??"",l=((e==null?void 0:e.roundLabels)??[]).join(`
`);return`
      <form id="game-form" novalidate>
        <input type="hidden" id="game-editing-id" value="${(e==null?void 0:e.id)??""}" />
        <div class="form-group">
          <label class="form-label" for="game-name">Game Name <span aria-hidden="true">*</span></label>
          <input class="form-input" type="text" id="game-name" placeholder="e.g. Five Crowns"
            value="${this.escHtml(s)}" required maxlength="50" autocomplete="off" />
          <span class="form-error" id="game-name-error" role="alert" aria-live="polite"></span>
        </div>
        <div class="form-group">
          <label class="form-label" for="game-mode">Scoring Mode</label>
          <select class="form-select" id="game-mode">
            <option value="high" ${a==="high"?"selected":""}>High score wins</option>
            <option value="low" ${a==="low"?"selected":""}>Low score wins</option>
            <option value="rounds" ${a==="rounds"?"selected":""}>Rounds (per-round input)</option>
            <option value="finish-order" ${a==="finish-order"?"selected":""}>Finish order (1st, 2nd...)</option>
            <option value="custom" ${a==="custom"?"selected":""}>Custom</option>
            <option value="phase10" ${a==="phase10"?"selected":""}>Phase 10 (track phases + penalty points)</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="game-round-labels">Round Labels (optional)</label>
          <textarea class="form-textarea" id="game-round-labels"
            placeholder="One label per line, e.g.&#10;Phase 1&#10;Phase 2&#10;Phase 3"
            rows="4">${this.escHtml(l)}</textarea>
          <span class="form-hint">Names each round — great for Phase 10, Five Crowns, etc. Leave blank to use "Round 1, Round 2…"</span>
        </div>
        <div class="form-group">
          <label class="form-label" for="game-rules">Rules / Notes (optional)</label>
          <textarea class="form-textarea" id="game-rules" placeholder="Any rule notes..."
            maxlength="200" rows="2">${this.escHtml(o)}</textarea>
        </div>
        <div class="form-group">
          <label class="form-label" for="game-target">Target Score (optional)</label>
          <input class="form-input" type="number" id="game-target"
            placeholder="e.g. 10" value="${i}" min="1" />
          <span class="form-hint">Win condition score, if applicable</span>
        </div>
        <div class="btn-group">
          <button type="submit" class="btn btn-primary flex-1" id="save-game-btn">
            ${e?"Update Game":"Add Game"}
          </button>
          ${e?'<button type="button" class="btn btn-secondary" id="cancel-edit-game-btn">Cancel</button>':""}
        </div>
      </form>
    `}afterRender(){this.bindPlayerForm(),this.bindGameForm(),this.bindFirebaseSection(),this.bindSyncForm(),this.bindDataButtons(),this.bindThemeToggle(),this.bindColorSwatches()}bindFirebaseSection(){var o,i,l,c,b,r;const e=this.roomConfig,s=$();if(e&&s){(o=document.getElementById("fb-copy-url-btn"))==null||o.addEventListener("click",()=>{const n=document.getElementById("fb-share-url");navigator.clipboard.writeText(n.value).then(()=>{p("Link copied!","success")}).catch(()=>{n.select(),document.execCommand("copy"),p("Link copied!","success")})}),(i=document.getElementById("fb-show-qr-btn"))==null||i.addEventListener("click",async()=>{const n=document.getElementById("fb-show-qr-btn"),d=document.getElementById("fb-qr-container");if(d){if(d.innerHTML){d.innerHTML="",n.textContent="Show QR Code";return}n.textContent="Generating…";try{const{default:m}=await q(async()=>{const{default:y}=await import("./browser-CTB2jwNe.js").then(h=>h.b);return{default:y}},[],import.meta.url),u=T(e),f=await m.toString(u,{type:"svg",margin:1,width:220});d.innerHTML=f,n.textContent="Hide QR Code"}catch(m){console.error("QR generation failed:",m),n.textContent="Show QR Code",p("QR generation failed","error")}}}),(l=document.getElementById("fb-push-btn"))==null||l.addEventListener("click",async()=>{var d;const n=document.getElementById("fb-push-btn");n.disabled=!0,n.textContent="Pushing…";try{const m=await M();if(p(m.message,m.ok?"success":"error"),m.ok){this.roomConfig=w();const u=document.getElementById("fb-last-sync");u&&(u.textContent=this.formatTimestamp((d=this.roomConfig)==null?void 0:d.lastSync))}}finally{n.disabled=!1,n.textContent="↑ Push Now"}}),(c=document.getElementById("fb-pull-btn"))==null||c.addEventListener("click",async()=>{var d;const n=document.getElementById("fb-pull-btn");n.disabled=!0,n.textContent="Pulling…";try{const m=await O();if(p(m.message,m.ok?"success":"error"),m.ok){this.roomConfig=w();const u=document.getElementById("fb-last-sync");u&&(u.textContent=this.formatTimestamp((d=this.roomConfig)==null?void 0:d.lastSync))}}finally{n.disabled=!1,n.textContent="↓ Pull Now"}}),(b=document.getElementById("fb-disconnect-btn"))==null||b.addEventListener("click",()=>{if(!confirm("Disconnect from live sync? Local data is kept, sync stops."))return;_(),J(),this.roomConfig=null;const n=document.getElementById("view-container");n&&(n.innerHTML=this.render(),this.afterRender()),p("Disconnected from live sync","info")});return}(r=document.getElementById("fb-new-room-btn"))==null||r.addEventListener("click",()=>{const n=document.getElementById("fb-room-id");n&&(n.value=H())});const a=document.getElementById("fb-config-form");a&&a.addEventListener("submit",async n=>{n.preventDefault();const d=document.getElementById("fb-api-key").value.trim(),m=document.getElementById("fb-project-id").value.trim(),u=document.getElementById("fb-app-id").value.trim(),f=document.getElementById("fb-room-id").value.trim();if(!d||!m||!u||!f){p("All fields are required","error");return}const y={apiKey:d,projectId:m,appId:u,roomId:f};K(y),this.roomConfig=y;const h=document.getElementById("fb-connect-btn");h.disabled=!0,h.textContent="Connecting…";try{const v=await Q(y,()=>{const E=document.getElementById("view-container");E&&(E.innerHTML=this.render(),this.afterRender())});if(v.ok){p(v.message,"success"),this.roomConfig=w();const E=document.getElementById("view-container");E&&(E.innerHTML=this.render(),this.afterRender())}else p(v.message,"error"),h.disabled=!1,h.textContent="Connect & Sync"}catch(v){p(`Connection error: ${v instanceof Error?v.message:String(v)}`,"error"),h.disabled=!1,h.textContent="Connect & Sync"}})}bindColorSwatches(){document.querySelectorAll(".color-swatch").forEach(e=>{const s=()=>{const a=e.dataset.color??"";document.querySelectorAll(".color-swatch").forEach(i=>{i.classList.remove("selected"),i.setAttribute("aria-selected","false")}),e.classList.add("selected"),e.setAttribute("aria-selected","true");const o=document.getElementById("player-color");o&&(o.value=a)};e.addEventListener("click",s),e.addEventListener("keydown",a=>{(a.key==="Enter"||a.key===" ")&&(a.preventDefault(),s())})})}bindPlayerForm(){document.querySelectorAll(".edit-player-btn").forEach(e=>{e.addEventListener("click",s=>{var l;const a=parseInt(s.currentTarget.dataset.playerId??"",10);this.editingPlayerId=a;const o=this.players.find(c=>c.id===a),i=document.getElementById("add-player-form-container");if(i&&o){const c=i.querySelector("h3");c&&(c.textContent="Edit Player");const b=i.querySelector("#player-form");b&&(b.outerHTML=this.renderPlayerForm(o)),i.innerHTML=`<h3 class="card-title mb-3">Edit Player</h3>${this.renderPlayerForm(o)}`,this.bindColorSwatches(),this.bindPlayerFormSubmit(),(l=document.getElementById("cancel-edit-player-btn"))==null||l.addEventListener("click",()=>{this.editingPlayerId=null,i.innerHTML=`<h3 class="card-title mb-3">Add Player</h3>${this.renderPlayerForm()}`,this.bindColorSwatches(),this.bindPlayerFormSubmit()}),i.scrollIntoView({behavior:"smooth",block:"nearest"})}})}),document.querySelectorAll(".delete-player-btn").forEach(e=>{e.addEventListener("click",async s=>{const a=parseInt(s.currentTarget.dataset.playerId??"",10),o=this.players.find(i=>i.id===a);if(o&&confirm(`Delete player "${o.displayName}"? This will not affect existing match records.`))try{await z(a),this.players=this.players.filter(l=>l.id!==a);const i=document.getElementById("players-list");i&&(i.innerHTML=this.renderPlayersList()),this.bindPlayerForm(),p("Player deleted","info")}catch{p("Failed to delete player","error")}})}),this.bindPlayerFormSubmit()}bindPlayerFormSubmit(){const e=document.getElementById("player-form");if(!e)return;const s=e.cloneNode(!0);e.replaceWith(s),this.bindColorSwatches(),s.addEventListener("submit",async a=>{var d;a.preventDefault();const o=document.getElementById("player-name"),i=document.getElementById("player-color"),l=document.getElementById("player-active"),c=(d=document.getElementById("player-editing-id"))==null?void 0:d.value,b=document.getElementById("player-name-error"),r=o.value.trim();if(!r){b&&(b.textContent="Name is required"),o.focus();return}b&&(b.textContent="");const n={displayName:r,color:i.value||k[0],active:l.checked,createdAt:Date.now()};try{c?(await Y(parseInt(c,10),{displayName:n.displayName,color:n.color,active:n.active}),p("Player updated","success")):(await W(n),p(`${r} added!`,"success")),this.players=await A(),this.editingPlayerId=null;const m=document.getElementById("players-list");m&&(m.innerHTML=this.renderPlayersList());const u=document.getElementById("add-player-form-container");u&&(u.innerHTML=`<h3 class="card-title mb-3">Add Player</h3>${this.renderPlayerForm()}`),this.bindColorSwatches(),this.bindPlayerFormSubmit(),this.bindPlayerForm()}catch(m){console.error(m),p("Failed to save player","error")}})}bindGameForm(){document.querySelectorAll(".edit-game-btn").forEach(e=>{e.addEventListener("click",s=>{var l;const a=parseInt(s.currentTarget.dataset.gameId??"",10);this.editingGameId=a;const o=this.games.find(c=>c.id===a),i=document.getElementById("add-game-form-container");i&&o&&(i.innerHTML=`<h3 class="card-title mb-3">Edit Game</h3>${this.renderGameForm(o)}`,this.bindGameFormSubmit(),(l=document.getElementById("cancel-edit-game-btn"))==null||l.addEventListener("click",()=>{this.editingGameId=null,i.innerHTML=`<h3 class="card-title mb-3">Add Game</h3>${this.renderGameForm()}`,this.bindGameFormSubmit()}),i.scrollIntoView({behavior:"smooth",block:"nearest"}))})}),document.querySelectorAll(".delete-game-btn").forEach(e=>{e.addEventListener("click",async s=>{const a=parseInt(s.currentTarget.dataset.gameId??"",10),o=this.games.find(i=>i.id===a);if(o&&confirm(`Delete game "${o.name}"? This will not affect existing match records.`))try{await V(a),this.games=this.games.filter(l=>l.id!==a);const i=document.getElementById("games-list");i&&(i.innerHTML=this.renderGamesList()),this.bindGameForm(),p("Game deleted","info")}catch{p("Failed to delete game","error")}})}),this.bindGameFormSubmit()}bindGameFormSubmit(){const e=document.getElementById("game-form");if(!e)return;const s=e.cloneNode(!0);e.replaceWith(s),s.addEventListener("submit",async a=>{var f;a.preventDefault();const o=document.getElementById("game-name"),i=document.getElementById("game-mode"),l=document.getElementById("game-rules"),c=document.getElementById("game-target"),b=document.getElementById("game-round-labels"),r=(f=document.getElementById("game-editing-id"))==null?void 0:f.value,n=document.getElementById("game-name-error"),d=o.value.trim();if(!d){n&&(n.textContent="Game name is required"),o.focus();return}n&&(n.textContent="");const m=b.value.split(`
`).map(y=>y.trim()).filter(y=>y.length>0),u={name:d,scoringMode:i.value,rules:l.value.trim()||void 0,targetScore:c.value?parseInt(c.value,10):void 0,roundLabels:m.length>0?m:void 0,createdAt:Date.now()};try{r?(await X(parseInt(r,10),{name:u.name,scoringMode:u.scoringMode,rules:u.rules,targetScore:u.targetScore,roundLabels:u.roundLabels}),p("Game updated","success")):(await Z(u),p(`${d} added!`,"success")),this.games=await G(),this.editingGameId=null;const y=document.getElementById("games-list");y&&(y.innerHTML=this.renderGamesList());const h=document.getElementById("add-game-form-container");h&&(h.innerHTML=`<h3 class="card-title mb-3">Add Game</h3>${this.renderGameForm()}`),this.bindGameFormSubmit(),this.bindGameForm()}catch(y){console.error(y),p("Failed to save game","error")}})}bindSyncForm(){var i,l,c,b;let e=((i=this.syncConfig)==null?void 0:i.provider)??"github";const s=r=>{e=r,document.querySelectorAll(".provider-btn").forEach(f=>{const y=f.dataset.provider===r;f.classList.toggle("active",y),f.setAttribute("aria-pressed",String(y))});const n=document.getElementById("sync-baseurl-group");n&&(n.style.display=r==="gitea"?"block":"none");const d=document.getElementById("sync-pat-label"),m=document.getElementById("sync-pat"),u=document.getElementById("sync-pat-hint");d&&(d.textContent=r==="gitea"?"API Key":"Personal Access Token"),m&&(m.placeholder=r==="gitea"?"your-api-key":"ghp_xxxxxxxxxxxxxxxxxxxx"),u&&(u.innerHTML=r==="gitea"?"Settings → Applications → Generate Token (needs repository read/write)":"Needs <code>repo</code> scope")};document.querySelectorAll(".provider-btn").forEach(r=>{r.addEventListener("click",()=>{s(r.dataset.provider)})});const a=()=>{var r;return{provider:e,baseUrl:e==="gitea"?document.getElementById("sync-baseurl").value.trim().replace(/\/+$/,""):void 0,username:document.getElementById("sync-username").value.trim(),repo:document.getElementById("sync-repo").value.trim(),pat:document.getElementById("sync-pat").value.trim(),filePath:document.getElementById("sync-filepath").value.trim()||"scorekeeper.json",branch:document.getElementById("sync-branch").value.trim()||"main",lastSync:(r=this.syncConfig)==null?void 0:r.lastSync}},o=r=>{const n=te(r);return n?(p(n,"error"),!1):!0};(l=document.getElementById("test-connection-btn"))==null||l.addEventListener("click",async()=>{const r=a();if(!o(r))return;const n=document.getElementById("test-connection-btn");n.disabled=!0,n.textContent="Testing…";try{x(r),this.syncConfig=r;const d=await ne(r);p(d.message,d.ok?"success":"error")}finally{n.disabled=!1,n.textContent="Test"}}),(c=document.getElementById("sync-to-github-btn"))==null||c.addEventListener("click",async()=>{var d;const r=a();if(!o(r))return;const n=document.getElementById("sync-to-github-btn");n.disabled=!0,n.textContent="Pushing…";try{x(r),this.syncConfig=r;const m=await se(r);if(p(m.message,m.ok?"success":"error"),m.ok){this.syncConfig=S();const u=document.getElementById("last-sync-time");u&&(u.textContent=this.formatTimestamp((d=this.syncConfig)==null?void 0:d.lastSync))}}finally{n.disabled=!1,n.textContent="↑ Push"}}),(b=document.getElementById("sync-from-github-btn"))==null||b.addEventListener("click",async()=>{var d;const r=a();if(!o(r))return;const n=document.getElementById("sync-from-github-btn");n.disabled=!0,n.textContent="Pulling…";try{x(r),this.syncConfig=r;const m=r.provider==="gitea"?"Gitea":"GitHub",u=await ae(r,async()=>confirm(`Local data exists. Overwrite with ${m} data? This cannot be undone.`));if(p(u.message,u.ok?"success":"error"),u.ok){this.syncConfig=S();const f=document.getElementById("last-sync-time");f&&(f.textContent=this.formatTimestamp((d=this.syncConfig)==null?void 0:d.lastSync)),await this.load();const y=document.getElementById("players-list");y&&(y.innerHTML=this.renderPlayersList());const h=document.getElementById("games-list");h&&(h.innerHTML=this.renderGamesList()),this.bindPlayerForm(),this.bindGameForm()}}finally{n.disabled=!1,n.textContent="↓ Pull"}})}bindDataButtons(){var e,s,a,o;(e=document.getElementById("export-btn"))==null||e.addEventListener("click",async()=>{try{const i=await L(),l=JSON.stringify(i,null,2),c=new Blob([l],{type:"application/json"}),b=URL.createObjectURL(c),r=document.createElement("a");r.href=b,r.download=`scorekeeper-export-${new Date().toISOString().split("T")[0]}.json`,r.click(),URL.revokeObjectURL(b),p("Data exported!","success")}catch{p("Export failed","error")}}),(s=document.getElementById("import-btn"))==null||s.addEventListener("click",()=>{var i;(i=document.getElementById("import-file-input"))==null||i.click()}),(a=document.getElementById("import-file-input"))==null||a.addEventListener("change",async i=>{var c;const l=(c=i.target.files)==null?void 0:c[0];if(l&&confirm("Import will replace ALL current data. Continue?"))try{const b=await l.text(),r=JSON.parse(b);await F(r),p("Data imported successfully!","success"),await this.load();const n=document.getElementById("view-container");n&&(n.innerHTML=this.render(),this.afterRender())}catch(b){console.error(b),p("Import failed — invalid JSON","error")}}),(o=document.getElementById("clear-data-btn"))==null||o.addEventListener("click",async()=>{if(confirm("Clear ALL data? This permanently deletes all players, games, nights, and scores. This CANNOT be undone.")&&confirm("Are you absolutely sure? All data will be lost forever."))try{await g.transaction("rw",[g.players,g.games,g.gameNights,g.matches,g.scoreEntries],async()=>{await g.players.clear(),await g.games.clear(),await g.gameNights.clear(),await g.matches.clear(),await g.scoreEntries.clear()}),p("All data cleared","info"),window.location.reload()}catch{p("Failed to clear data","error")}})}bindThemeToggle(){const e=document.getElementById("theme-toggle");e==null||e.addEventListener("change",()=>{const s=e.checked,a=s?"dark":"light";document.documentElement.setAttribute("data-theme",a),localStorage.setItem("theme",a),e.setAttribute("aria-checked",String(s))})}}export{oe as Settings};
