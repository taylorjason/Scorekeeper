import type { FirebaseRoomConfig, AppData } from './types';
import { exportAll, importAll } from './db';

const ROOM_CONFIG_KEY = 'scorekeeper_firebase_room';
const DEVICE_ID_KEY = 'scorekeeper_device_id';

// Hardcoded — Firebase API keys are public identifiers, not secrets.
// Security is enforced by Firestore Rules (auth required).
const DEFAULT_FIREBASE_CONFIG = {
  apiKey: 'AIzaSyBbZi_h_jLEi3ioJ1IBpGq2x4Uk7XN1mKA',
  projectId: 'scorekeeper-c9b39',
  appId: '1:762963882089:web:68bafeb234d5d05f5d32f8',
};

// ─── Device ID ───────────────────────────────────────────────────────────────

function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

// ─── Config persistence ───────────────────────────────────────────────────────

export function getRoomConfig(): FirebaseRoomConfig | null {
  try {
    const raw = localStorage.getItem(ROOM_CONFIG_KEY);
    return raw ? (JSON.parse(raw) as FirebaseRoomConfig) : null;
  } catch {
    return null;
  }
}

export function saveRoomConfig(config: FirebaseRoomConfig): void {
  localStorage.setItem(ROOM_CONFIG_KEY, JSON.stringify(config));
}

export function clearRoomConfig(): void {
  localStorage.removeItem(ROOM_CONFIG_KEY);
}

// ─── Room ID generation ───────────────────────────────────────────────────────

export function generateRoomId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return Array.from(bytes, b => b.toString(36).padStart(2, '0')).join('').slice(0, 10);
}

// ─── Shareable URL ────────────────────────────────────────────────────────────

export function buildShareableUrl(config: FirebaseRoomConfig): string {
  const base = window.location.origin + window.location.pathname.replace(/\/+$/, '');
  return `${base}#room=${encodeURIComponent(config.roomId)}`;
}

export function parseRoomFromHash(): Omit<FirebaseRoomConfig, 'lastSync'> | null {
  try {
    const hash = window.location.hash;
    if (!hash.startsWith('#room=')) return null;
    const value = hash.slice('#room='.length);

    // Backward compat: old links encoded the full config as base64 JSON
    try {
      const payload = JSON.parse(decodeURIComponent(escape(atob(value)))) as FirebaseRoomConfig;
      if (payload.roomId) return { roomId: payload.roomId };
    } catch { /* not base64 JSON — fall through to plain room ID */ }

    const roomId = decodeURIComponent(value);
    return roomId ? { roomId } : null;
  } catch {
    return null;
  }
}

// ─── Firebase runtime state ───────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _firestoreDb: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _roomDocRef: any = null;
let _unsubscribeSnapshot: (() => void) | null = null;
let _pushTimer: ReturnType<typeof setTimeout> | null = null;
let _isSyncing = false;
let _currentConfig: FirebaseRoomConfig | null = null;
let _onRemoteUpdate: (() => void) | null = null;

export function isFirebaseSyncActive(): boolean {
  return _unsubscribeSnapshot !== null;
}

// ─── Push / Pull ─────────────────────────────────────────────────────────────

async function doPush(): Promise<void> {
  if (!_roomDocRef || !_currentConfig) return;
  const { setDoc } = await import('firebase/firestore');
  const appData = await exportAll();
  // Firestore rejects `undefined` field values; JSON roundtrip strips them cleanly.
  const sanitized = JSON.parse(JSON.stringify(appData));
  await setDoc(_roomDocRef, {
    appData: sanitized,
    updatedAt: Date.now(),
    updatedByDevice: getDeviceId(),
  });
  if (_currentConfig) saveRoomConfig({ ..._currentConfig, lastSync: Date.now() });
}

function schedulePush(): void {
  if (_pushTimer) clearTimeout(_pushTimer);
  _pushTimer = setTimeout(() => {
    if (_isSyncing) return;
    doPush().catch(err => console.error('[Firebase] Auto-push failed:', err));
  }, 1500);
}

function handleDataChanged(): void {
  if (_isSyncing) return;
  schedulePush();
}

// ─── Init / Teardown ─────────────────────────────────────────────────────────

export async function initFirebaseSync(
  config: FirebaseRoomConfig,
  onRemoteUpdate: () => void,
): Promise<{ ok: boolean; message: string }> {
  teardownFirebaseSync();

  try {
    const { initializeApp, getApps, getApp } = await import('firebase/app');
    const { getFirestore, initializeFirestore, doc, onSnapshot, setDoc, getDoc } = await import('firebase/firestore');
    const { getAuth, signInAnonymously } = await import('firebase/auth');

    const projectId = config.projectId ?? DEFAULT_FIREBASE_CONFIG.projectId;
    const firebaseConfig = {
      apiKey: config.apiKey ?? DEFAULT_FIREBASE_CONFIG.apiKey,
      projectId,
      appId: config.appId ?? DEFAULT_FIREBASE_CONFIG.appId,
      authDomain: `${projectId}.firebaseapp.com`,
    };

    const appAlreadyExists = getApps().length > 0;
    const app = appAlreadyExists ? getApp() : initializeApp(firebaseConfig);
    _firestoreDb = appAlreadyExists
      ? getFirestore(app)
      : initializeFirestore(app, { experimentalAutoDetectLongPolling: true });
    const auth = getAuth(app);
    await signInAnonymously(auth);

    const deviceId = getDeviceId();
    _roomDocRef = doc(_firestoreDb, 'rooms', config.roomId);
    _currentConfig = config;
    _onRemoteUpdate = onRemoteUpdate;

    window.addEventListener('scorekeeper:datachanged', handleDataChanged);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _unsubscribeSnapshot = onSnapshot(_roomDocRef, async (snapshot: any) => {
      if (!snapshot.exists()) return;
      const remote = snapshot.data() as { appData: AppData; updatedAt: number; updatedByDevice: string };
      if (remote.updatedByDevice === deviceId) return;

      _isSyncing = true;
      try {
        await importAll(remote.appData, true);
        if (_currentConfig) saveRoomConfig({ ..._currentConfig, lastSync: Date.now() });
        _onRemoteUpdate?.();
      } finally {
        _isSyncing = false;
      }
    });

    // Initial sync
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const snapshot = await getDoc(_roomDocRef) as any;
    if (snapshot.exists()) {
      const remote = snapshot.data() as { appData: AppData; updatedAt: number };
      _isSyncing = true;
      try {
        await importAll(remote.appData, true);
        saveRoomConfig({ ...config, lastSync: Date.now() });
      } finally {
        _isSyncing = false;
      }
    } else {
      // New room — push local data to seed it
      const appData = JSON.parse(JSON.stringify(await exportAll()));
      await setDoc(_roomDocRef, { appData, updatedAt: Date.now(), updatedByDevice: deviceId });
      saveRoomConfig({ ...config, lastSync: Date.now() });
    }

    return { ok: true, message: 'Connected to room!' };
  } catch (err) {
    teardownFirebaseSync();
    return {
      ok: false,
      message: `Connection failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

export function teardownFirebaseSync(): void {
  if (_unsubscribeSnapshot) {
    _unsubscribeSnapshot();
    _unsubscribeSnapshot = null;
  }
  if (_pushTimer) {
    clearTimeout(_pushTimer);
    _pushTimer = null;
  }
  window.removeEventListener('scorekeeper:datachanged', handleDataChanged);
  _firestoreDb = null;
  _roomDocRef = null;
  _currentConfig = null;
  _onRemoteUpdate = null;
  _isSyncing = false;
}

export async function pushNow(): Promise<{ ok: boolean; message: string }> {
  if (!_roomDocRef || !_currentConfig) {
    return { ok: false, message: 'Not connected to a room' };
  }
  try {
    await doPush();
    return { ok: true, message: 'Synced to room' };
  } catch (err) {
    return { ok: false, message: `Push failed: ${err instanceof Error ? err.message : String(err)}` };
  }
}

export async function pullNow(): Promise<{ ok: boolean; message: string }> {
  if (!_roomDocRef || !_currentConfig) {
    return { ok: false, message: 'Not connected to a room' };
  }
  try {
    const { getDoc } = await import('firebase/firestore');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const snapshot = await getDoc(_roomDocRef) as any;
    if (!snapshot.exists()) return { ok: false, message: 'Room has no data yet' };

    const remote = snapshot.data() as { appData: AppData; updatedAt: number };
    _isSyncing = true;
    try {
      await importAll(remote.appData, true);
      if (_currentConfig) saveRoomConfig({ ..._currentConfig, lastSync: Date.now() });
      _onRemoteUpdate?.();
    } finally {
      _isSyncing = false;
    }
    return { ok: true, message: 'Pulled from room' };
  } catch (err) {
    return { ok: false, message: `Pull failed: ${err instanceof Error ? err.message : String(err)}` };
  }
}
