import './styles/main.css';
import { seedDemoData } from './demo';
import { initRouter, onRouteChange, getCurrentRoute, navigate } from './router';
import type { ParsedRoute } from './router';
export { showToast } from './toast';
import { showToast } from './toast';

async function loadView(parsed: ParsedRoute): Promise<void> {
  const container = document.getElementById('view-container');
  if (!container) return;

  container.innerHTML = '<div class="loading-view"><div class="spinner"></div></div>';

  try {
  switch (parsed.route) {
    case 'dashboard': {
      const { Dashboard } = await import('./views/Dashboard');
      const view = new Dashboard();
      await view.load();
      container.innerHTML = view.render();
      view.afterRender();
      break;
    }
    case 'new-night': {
      const { NewNight } = await import('./views/NewNight');
      const view = new NewNight();
      await view.load();
      container.innerHTML = view.render();
      view.afterRender();
      break;
    }
    case 'match': {
      const { ActiveMatch } = await import('./views/ActiveMatch');
      const view = new ActiveMatch();
      await view.load(Number(parsed.params.id));
      container.innerHTML = view.render();
      view.afterRender();
      break;
    }
    case 'history': {
      const { History } = await import('./views/History');
      const view = new History();
      await view.load();
      container.innerHTML = view.render();
      view.afterRender();
      break;
    }
    case 'stats': {
      const { Stats } = await import('./views/Stats');
      const view = new Stats();
      await view.load();
      container.innerHTML = view.render();
      view.afterRender();
      break;
    }
    case 'settings': {
      const { Settings } = await import('./views/Settings');
      const view = new Settings();
      await view.load();
      container.innerHTML = view.render();
      view.afterRender();
      break;
    }
  }
  } catch (err) {
    console.error('View load error:', err);
    container.innerHTML = `
      <div style="padding:2rem;text-align:center;color:var(--danger)">
        <p style="font-size:1.5rem;margin-bottom:0.5rem">⚠️</p>
        <strong>Failed to load view</strong>
        <p style="margin-top:0.5rem;color:var(--text-muted);font-size:0.875rem">${err instanceof Error ? err.message : String(err)}</p>
      </div>`;
  }

  updateNav(parsed.route);
}

function updateNav(route: string): void {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('nav-item--active', item.getAttribute('data-route') === route);
  });
}

function renderAppShell(): void {
  const app = document.getElementById('app');
  if (!app) return;

  app.innerHTML = `
    <header class="app-header">
      <span class="app-logo" aria-hidden="true">🎲</span>
      <h1 class="app-title">Scorekeeper</h1>
      <button class="btn-icon theme-toggle" id="theme-toggle" aria-label="Toggle theme">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="5"/>
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
        </svg>
      </button>
    </header>

    <main id="view-container" class="main-content" role="main"></main>

    <nav class="bottom-nav" role="navigation" aria-label="Main navigation">
      <button class="nav-item" data-route="dashboard" aria-label="Dashboard">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
        <span>Home</span>
      </button>
      <button class="nav-item" data-route="new-night" aria-label="New game night">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="16"/>
          <line x1="8" y1="12" x2="16" y2="12"/>
        </svg>
        <span>New Night</span>
      </button>
      <button class="nav-item" data-route="history" aria-label="History">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="12 8 12 12 14 14"/>
          <path d="M3.05 11a9 9 0 1 1 .5 4M3 16v-5h5"/>
        </svg>
        <span>History</span>
      </button>
      <button class="nav-item" data-route="stats" aria-label="Stats">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="20" x2="18" y2="10"/>
          <line x1="12" y1="20" x2="12" y2="4"/>
          <line x1="6" y1="20" x2="6" y2="14"/>
        </svg>
        <span>Stats</span>
      </button>
      <button class="nav-item" data-route="settings" aria-label="Settings">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
        <span>Settings</span>
      </button>
    </nav>
  `;

  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const route = btn.getAttribute('data-route');
      if (route) navigate(route as Parameters<typeof navigate>[0]);
    });
  });

  document.getElementById('theme-toggle')?.addEventListener('click', () => {
    const html = document.documentElement;
    const isDark = html.getAttribute('data-theme') === 'dark';
    const next = isDark ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem('scorekeeper_theme', next);
    showToast(`Switched to ${next} mode`, 'info');
  });
}

async function init(): Promise<void> {
  const savedTheme = localStorage.getItem('scorekeeper_theme') ?? 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);

  // Render the shell immediately so the user never stares at a spinner
  renderAppShell();
  initRouter();
  onRouteChange(loadView);

  // Seed demo data in the background — non-fatal if it fails or is slow
  seedDemoData().catch(err => console.warn('[Demo] Seed failed (non-fatal):', err));

  await loadView(getCurrentRoute());
}

init().catch(err => {
  console.error('App init failed:', err);
  const app = document.getElementById('app');
  if (app) {
    app.innerHTML = `<div style="padding:2rem;color:#ef4444;text-align:center">
      <h2>Failed to load app</h2><p>${err instanceof Error ? err.message : String(err)}</p>
    </div>`;
  }
});
