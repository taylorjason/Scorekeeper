import type { SyncConfig, AppData } from './types';
import { exportAll, importAll } from './db';

const STORAGE_KEY = 'scorekeeper_sync_config';

export function getSyncConfig(): SyncConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SyncConfig;
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

interface GitHubFileResponse {
  content: string;
  sha: string;
  name: string;
  path: string;
}

function buildApiUrl(config: SyncConfig): string {
  return `https://api.github.com/repos/${config.username}/${config.repo}/contents/${config.filePath}`;
}

function buildHeaders(config: SyncConfig): HeadersInit {
  return {
    Authorization: `token ${config.pat}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  };
}

function getErrorMessage(status: number): string {
  switch (status) {
    case 401: return 'Unauthorized – check your Personal Access Token';
    case 403: return 'Forbidden – token may lack repo write permissions';
    case 404: return 'Not Found – check username, repo name, and file path';
    case 409: return 'Conflict – file was modified remotely; try syncing from GitHub first';
    case 422: return 'Unprocessable – invalid request data';
    case 429: return 'Rate Limited – too many requests, try again in a minute';
    default: return `GitHub API error (HTTP ${status})`;
  }
}

export async function testConnection(config: SyncConfig): Promise<{ ok: boolean; message: string }> {
  try {
    const url = `https://api.github.com/repos/${config.username}/${config.repo}`;
    const resp = await fetch(url, {
      headers: buildHeaders(config),
    });

    if (resp.ok) {
      const data = await resp.json() as { full_name: string };
      return { ok: true, message: `Connected to ${data.full_name}` };
    }

    return { ok: false, message: getErrorMessage(resp.status) };
  } catch (err) {
    return { ok: false, message: `Network error: ${err instanceof Error ? err.message : String(err)}` };
  }
}

export async function syncToGitHub(config: SyncConfig): Promise<{ ok: boolean; message: string }> {
  try {
    const data = await exportAll();
    const jsonContent = JSON.stringify(data, null, 2);
    const encoded = btoa(unescape(encodeURIComponent(jsonContent)));

    const url = buildApiUrl(config);
    const headers = buildHeaders(config);

    // Try to get existing file SHA
    let sha: string | undefined;
    const getResp = await fetch(`${url}?ref=${encodeURIComponent(config.branch)}`, { headers });
    if (getResp.ok) {
      const existing = await getResp.json() as GitHubFileResponse;
      sha = existing.sha;
    } else if (getResp.status !== 404) {
      return { ok: false, message: getErrorMessage(getResp.status) };
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
      const updated: SyncConfig = { ...config, lastSync: Date.now() };
      saveSyncConfig(updated);
      return { ok: true, message: 'Synced to GitHub successfully' };
    }

    return { ok: false, message: getErrorMessage(putResp.status) };
  } catch (err) {
    return { ok: false, message: `Sync error: ${err instanceof Error ? err.message : String(err)}` };
  }
}

export async function syncFromGitHub(
  config: SyncConfig,
  onConflict: () => Promise<boolean>
): Promise<{ ok: boolean; message: string }> {
  try {
    const url = `${buildApiUrl(config)}?ref=${encodeURIComponent(config.branch)}`;
    const headers = buildHeaders(config);

    const resp = await fetch(url, { headers });
    if (!resp.ok) {
      return { ok: false, message: getErrorMessage(resp.status) };
    }

    const fileData = await resp.json() as GitHubFileResponse;
    const decoded = decodeURIComponent(escape(atob(fileData.content.replace(/\n/g, ''))));
    const remoteData = JSON.parse(decoded) as AppData;

    // Check if we have local data that would be overwritten
    const localData = await exportAll();
    const hasLocalData =
      localData.players.length > 0 ||
      localData.gameNights.length > 0 ||
      localData.matches.length > 0;

    if (hasLocalData) {
      const proceed = await onConflict();
      if (!proceed) {
        return { ok: false, message: 'Sync cancelled' };
      }
    }

    await importAll(remoteData);
    const updated: SyncConfig = { ...config, lastSync: Date.now() };
    saveSyncConfig(updated);
    return { ok: true, message: 'Synced from GitHub successfully' };
  } catch (err) {
    return { ok: false, message: `Sync error: ${err instanceof Error ? err.message : String(err)}` };
  }
}
