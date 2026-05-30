export type Route =
  | 'dashboard'
  | 'new-night'
  | 'match'
  | 'history'
  | 'stats'
  | 'settings'
  | 'scoreboard'
  | 'round-display'
  | 'score-input';

export interface ParsedRoute {
  route: Route;
  params: Record<string, string>;
}

type RouteChangeCallback = (parsed: ParsedRoute) => void;

let _listener: RouteChangeCallback | null = null;

export function onRouteChange(cb: RouteChangeCallback): void {
  _listener = cb;
}

export function parseRoute(hash: string): ParsedRoute {
  const clean = hash.replace(/^#\/?/, '');
  const parts = clean.split('/');
  const base = parts[0] || 'dashboard';

  switch (base) {
    case 'new-night':
      return { route: 'new-night', params: {} };
    case 'match':
      return { route: 'match', params: { id: parts[1] ?? '' } };
    case 'history':
      return { route: 'history', params: {} };
    case 'stats':
      return { route: 'stats', params: {} };
    case 'settings':
      return { route: 'settings', params: {} };
    case 'scoreboard':
      return { route: 'scoreboard', params: { id: parts[1] ?? '' } };
    case 'round-display':
      return { route: 'round-display', params: { id: parts[1] ?? '' } };
    case 'score-input':
      return { route: 'score-input', params: { id: parts[1] ?? '' } };
    default:
      return { route: 'dashboard', params: {} };
  }
}

export function getCurrentRoute(): ParsedRoute {
  return parseRoute(window.location.hash);
}

export function navigate(route: Route, params?: Record<string, string>): void {
  let hash = `#/${route}`;
  if (params?.id) hash += `/${params.id}`;
  window.location.hash = hash;
}

export function initRouter(): void {
  window.addEventListener('hashchange', () => {
    if (_listener) _listener(getCurrentRoute());
  });
}
