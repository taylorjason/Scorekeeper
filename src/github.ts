import type { SyncConfig, AppData } from './types';
import { exportAll, importAll } from './db';

const STORAGE_KEY = 'scorekeeper_sync_config';

// ─── Config persistence ───────────────────────────────────────────────────────

export function getSyncConfig(): SyncConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const cfg = JSON.parse(raw) as SyncConfig;
    // Backfill provider for configs saved before multi-provider support
    if (!cfg.provider) cfg.provider = 'github';
    return cfg;
  } catch {
    return null;
  }
}

export function saveSyncConfig(config: SyncConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function clearSyncConfig(): void {
  localStorage.removeItem(STORAGE_KEY);
}

// ─── Provider adapter ─────────────────────────────────────────────────────────

interface FileResponse {
  content: string; // base64
  sha: string;
}

/** Normalise the Gitea base URL: strip trailing slash, ensure no /api/v1 yet. */
function giteaBase(config: SyncConfig): string {
  return (config.baseUrl ?? '').replace(/\/+$/, '');
}

function buildContentsUrl(config: SyncConfig): string {
  if (config.provider === 'gitea') {
    return `${giteaBase(config)}/api/v1/repos/${config.username}/${config.repo}/contents/${config.filePath}`;
  }
  return `https://api.github.com/repos/${config.username}/${config.repo}/contents/${config.filePath}`;
}

function buildRepoUrl(config: SyncConfig): string {
  if (config.provider === 'gitea') {
    return `${giteaBase(config)}/api/v1/repos/${config.username}/${config.repo}`;
  }
  return `https://api.github.com/repos/${config.username}/${config.repo}`;
}

function buildHeaders(config: SyncConfig): HeadersInit {
  const headers: Record<string, string> = {
    'Authorization': `token ${config.pat}`,
    'Content-Type': 'application/json',
  };
  // GitHub requires this Accept header; Gitea ignores it harmlessly
  if (config.provider === 'github') {
    headers['Accept'] = 'application/vnd.github.v3+json';
  }
  return headers;
}

function providerLabel(config: SyncConfig): string {
  return config.provider === 'gitea' ? 'Gitea' : 'GitHub';
}

function getErrorMessage(status: number, provider: SyncConfig['provider']): string {
  const label = provider === 'gitea' ? 'Gitea' : 'GitHub';
  switch (status) {
    case 401: return `Unauthorized – check your ${provider === 'gitea' ? 'API key' : 'Personal Access Token'}`;
    case 403: return `Forbidden – token may lack repo write permissions`;
    case 404: return `Not Found – check username, repo name, and file path`;
    case 409: return `Conflict – file was modified remotely; try syncing from ${label} first`;
    case 422: return `Unprocessable – invalid request data`;
    case 429: return `Rate Limited – too many requests, try again in a minute`;
    default:  return `${label} API error (HTTP ${status})`;
  }
}

// ─── Validate config completeness ────────────────────────────────────────────

export function validateSyncConfig(config: SyncConfig): string | null {
  if (!config.username) return 'Username is required';
  if (!config.repo)     return 'Repository name is required';
  if (!config.pat)      return config.provider === 'gitea' ? 'API key is required' : 'Personal Access Token is required';
  if (config.provider === 'gitea' && !config.baseUrl) return 'Base URL is required for Gitea';
  return null;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function testConnection(config: SyncConfig): Promise<{ ok: boolean; message: string }> {
  try {
    const resp = await fetch(buildRepoUrl(config), { headers: buildHeaders(config) });
    if (resp.ok) {
      const data = await resp.json() as { full_name?: string; name?: string };
      const name = data.full_name ?? `${config.username}/${data.name ?? config.repo}`;
      return { ok: true, message: `Connected to ${name} on ${providerLabel(config)}` };
    }
    return { ok: false, message: getErrorMessage(resp.status, config.provider) };
  } catch (err) {
    return { ok: false, message: `Network error: ${err instanceof Error ? err.message : String(err)}` };
  }
}

export async function syncToGitHub(config: SyncConfig): Promise<{ ok: boolean; message: string }> {
  try {
    const data = await exportAll();
    const jsonContent = JSON.stringify(data, null, 2);
    const encoded = btoa(unescape(encodeURIComponent(jsonContent)));

    const url = buildContentsUrl(config);
    const headers = buildHeaders(config);

    // Fetch existing file SHA (needed for updates on both GitHub and Gitea)
    let sha: string | undefined;
    const getResp = await fetch(`${url}?ref=${encodeURIComponent(config.branch)}`, { headers });
    if (getResp.ok) {
      const existing = await getResp.json() as FileResponse;
      sha = existing.sha;
    } else if (getResp.status !== 404) {
      return { ok: false, message: getErrorMessage(getResp.status, config.provider) };
    }

    const body: Record<string, unknown> = {
      message: `Scorekeeper sync ${new Date().toISOString()}`,
      content: encoded,
      branch: config.branch,
    };
    if (sha) body['sha'] = sha;

    const putResp = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    });

    if (putResp.ok) {
      saveSyncConfig({ ...config, lastSync: Date.now() });
      return { ok: true, message: `Synced to ${providerLabel(config)} successfully` };
    }
    return { ok: false, message: getErrorMessage(putResp.status, config.provider) };
  } catch (err) {
    return { ok: false, message: `Sync error: ${err instanceof Error ? err.message : String(err)}` };
  }
}

export async function syncFromGitHub(
  config: SyncConfig,
  onConflict: () => Promise<boolean>,
): Promise<{ ok: boolean; message: string }> {
  try {
    const url = `${buildContentsUrl(config)}?ref=${encodeURIComponent(config.branch)}`;
    const resp = await fetch(url, { headers: buildHeaders(config) });
    if (!resp.ok) {
      return { ok: false, message: getErrorMessage(resp.status, config.provider) };
    }

    const fileData = await resp.json() as FileResponse;
    const decoded = decodeURIComponent(escape(atob(fileData.content.replace(/\n/g, ''))));
    const remoteData = JSON.parse(decoded) as AppData;

    const localData = await exportAll();
    const hasLocalData =
      localData.players.length > 0 ||
      localData.gameNights.length > 0 ||
      localData.matches.length > 0;

    if (hasLocalData) {
      const proceed = await onConflict();
      if (!proceed) return { ok: false, message: 'Sync cancelled' };
    }

    await importAll(remoteData);
    saveSyncConfig({ ...config, lastSync: Date.now() });
    return { ok: true, message: `Synced from ${providerLabel(config)} successfully` };
  } catch (err) {
    return { ok: false, message: `Sync error: ${err instanceof Error ? err.message : String(err)}` };
  }
}
