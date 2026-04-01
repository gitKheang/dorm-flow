import type {
  AuthMode,
  AuthSession,
  AuthStoreSnapshot,
} from "@/lib/auth/types";
import type { DemoWorkspaceState } from "@/lib/demoWorkspace";
import { DEMO_WORKSPACE_STORAGE_KEY } from "@/lib/demoWorkspace";
import { SESSION_STORAGE_KEY } from "@/lib/demoSession";

export const DEMO_APP_SYNC_STORAGE_KEY = "dormflow-demo-app-sync-v1";
const DEMO_APP_SYNC_CHANNEL_NAME = "dormflow-demo-app-sync";

export interface SharedAppStateSnapshot {
  revision: number;
  sourceId: string;
  updatedAt: string;
  // Shared auth data excludes the active session so different tabs can stay
  // signed in as different roles while still receiving the same dorm updates.
  authStore: AuthStoreSnapshot | null;
  workspaceState: DemoWorkspaceState;
}

export interface AppStateSyncAdapter {
  publish: (snapshot: SharedAppStateSnapshot) => void;
  subscribe: (
    onSnapshot: (snapshot: SharedAppStateSnapshot) => void,
  ) => () => void;
}

function hasWindow() {
  return typeof window !== "undefined";
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function coerceSharedAppStateSnapshot(
  value: unknown,
): SharedAppStateSnapshot | null {
  if (!isObject(value)) {
    return null;
  }

  const parsed = value as Partial<SharedAppStateSnapshot>;
  if (
    typeof parsed.revision !== "number" ||
    typeof parsed.sourceId !== "string" ||
    typeof parsed.updatedAt !== "string" ||
    !isObject(parsed.workspaceState)
  ) {
    return null;
  }

  return {
    revision: parsed.revision,
    sourceId: parsed.sourceId,
    updatedAt: parsed.updatedAt,
    authStore: isObject(parsed.authStore)
      ? (parsed.authStore as AuthStoreSnapshot)
      : null,
    workspaceState: parsed.workspaceState as DemoWorkspaceState,
  };
}

export function createSyncSourceId() {
  if (hasWindow() && typeof window.crypto?.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return `sync-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function stripSessionFromAuthSnapshot(
  authState: AuthStoreSnapshot | null,
): AuthStoreSnapshot | null {
  if (!authState) {
    return null;
  }

  return {
    ...authState,
    session: null,
  };
}

export function attachLocalSessionToAuthSnapshot(
  authStore: AuthStoreSnapshot | null,
  session: AuthSession | null,
): AuthStoreSnapshot | null {
  if (!authStore) {
    return null;
  }

  return {
    ...authStore,
    session,
  };
}

export function persistLocalSession(session: AuthSession | null) {
  if (!hasWindow()) {
    return;
  }

  if (!session) {
    window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
    return;
  }

  window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function restoreLocalSession(): AuthSession | null {
  if (!hasWindow()) {
    return null;
  }

  try {
    const rawValue = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!rawValue) {
      return null;
    }

    return JSON.parse(rawValue) as AuthSession;
  } catch {
    return null;
  }
}

export function restoreLegacyAuthState(): AuthStoreSnapshot | null {
  if (!hasWindow()) {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!rawValue) {
      return null;
    }

    return JSON.parse(rawValue) as AuthStoreSnapshot;
  } catch {
    return null;
  }
}

export function readSharedAppStateSnapshot(): SharedAppStateSnapshot | null {
  if (!hasWindow()) {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(DEMO_APP_SYNC_STORAGE_KEY);
    if (!rawValue) {
      return null;
    }

    return coerceSharedAppStateSnapshot(JSON.parse(rawValue));
  } catch {
    return null;
  }
}

export function persistSharedAppStateSnapshot(
  snapshot: SharedAppStateSnapshot,
) {
  if (!hasWindow()) {
    return;
  }

  // The sync envelope is the authoritative shared state. We still mirror the
  // workspace key so older restore paths and manual debugging stay usable.
  window.localStorage.setItem(
    DEMO_APP_SYNC_STORAGE_KEY,
    JSON.stringify(snapshot),
  );
  window.localStorage.setItem(
    DEMO_WORKSPACE_STORAGE_KEY,
    JSON.stringify(snapshot.workspaceState),
  );
}

function createDemoAppStateSyncAdapter(): AppStateSyncAdapter {
  return {
    publish: (snapshot) => {
      if (!hasWindow()) {
        return;
      }

      persistSharedAppStateSnapshot(snapshot);

      if (typeof BroadcastChannel === "undefined") {
        return;
      }

      const channel = new BroadcastChannel(DEMO_APP_SYNC_CHANNEL_NAME);
      channel.postMessage(snapshot);
      channel.close();
    },
    subscribe: (onSnapshot) => {
      if (!hasWindow()) {
        return () => undefined;
      }

      let channel: BroadcastChannel | null = null;

      if (typeof BroadcastChannel !== "undefined") {
        channel = new BroadcastChannel(DEMO_APP_SYNC_CHANNEL_NAME);
        channel.addEventListener("message", (event: MessageEvent<unknown>) => {
          const snapshot = coerceSharedAppStateSnapshot(event.data);
          if (!snapshot) {
            return;
          }

          onSnapshot(snapshot);
        });
      }

      const handleStorage = (event: StorageEvent) => {
        if (event.key !== DEMO_APP_SYNC_STORAGE_KEY || !event.newValue) {
          return;
        }

        try {
          const snapshot = coerceSharedAppStateSnapshot(
            JSON.parse(event.newValue),
          );
          if (!snapshot) {
            // Ignore malformed sync payloads and wait for the next valid one.
            return;
          }

          onSnapshot(snapshot);
        } catch {
          // Ignore malformed sync payloads and wait for the next valid one.
        }
      };

      window.addEventListener("storage", handleStorage);

      return () => {
        window.removeEventListener("storage", handleStorage);
        channel?.close();
      };
    },
  };
}

function createNoopAppStateSyncAdapter(): AppStateSyncAdapter {
  return {
    publish: () => undefined,
    subscribe: () => () => undefined,
  };
}

export function createAppStateSyncAdapter(mode: AuthMode): AppStateSyncAdapter {
  if (mode === "demo") {
    return createDemoAppStateSyncAdapter();
  }

  // The provider only depends on this adapter contract, so replacing the demo
  // transport with Supabase realtime or websockets later does not require any
  // feature-level state code to change.
  return createNoopAppStateSyncAdapter();
}
