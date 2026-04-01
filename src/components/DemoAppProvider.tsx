"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createDemoAuthSeedSnapshot } from "@/lib/auth/demoService";
import { createAuthService } from "@/lib/auth/service";
import type { AuthService } from "@/lib/auth/service";
import type { AuthStoreSnapshot } from "@/lib/auth/types";
import {
  DEMO_WORKSPACE_STORAGE_KEY,
  restoreDemoWorkspace,
  type DemoWorkspaceState,
} from "@/lib/demoWorkspace";
import {
  mapDormToAuthDorm,
  reconcileWorkspaceInvitationLifecycle,
  syncWorkspaceState,
} from "@/lib/domain/workspaceActions";
import {
  attachLocalSessionToAuthSnapshot,
  createAppStateSyncAdapter,
  createSyncSourceId,
  persistLocalSession,
  persistSharedAppStateSnapshot,
  readSharedAppStateSnapshot,
  restoreLegacyAuthState,
  restoreLocalSession,
  stripSessionFromAuthSnapshot,
  type SharedAppStateSnapshot,
} from "@/lib/sync/appStateSync";

interface DemoAppContextValue {
  authService: AuthService;
  authState: AuthStoreSnapshot | null;
  isHydrated: boolean;
  workspaceState: DemoWorkspaceState;
  commitAuthState: (nextAuthState: AuthStoreSnapshot) => void;
  commitWorkspaceState: (nextWorkspaceState: DemoWorkspaceState) => void;
  commitState: (nextState: {
    authState?: AuthStoreSnapshot;
    workspaceState?: DemoWorkspaceState;
  }) => void;
}

const DemoAppContext = createContext<DemoAppContextValue | undefined>(
  undefined,
);

export default function DemoAppProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const authService = useMemo(() => createAuthService(), []);
  const syncAdapter = useMemo(
    () => createAppStateSyncAdapter(authService.mode),
    [authService.mode],
  );
  const [workspaceState, setWorkspaceState] = useState<DemoWorkspaceState>(
    restoreDemoWorkspace(null),
  );
  const [authState, setAuthState] = useState<AuthStoreSnapshot | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const latestWorkspaceStateRef = useRef<DemoWorkspaceState>(
    restoreDemoWorkspace(null),
  );
  const latestAuthStateRef = useRef<AuthStoreSnapshot | null>(null);
  const latestSharedSnapshotRef = useRef<SharedAppStateSnapshot | null>(null);
  const syncSourceIdRef = useRef<string>(createSyncSourceId());

  function buildSeedAuthState(nextWorkspaceState: DemoWorkspaceState) {
    return createDemoAuthSeedSnapshot({
      dorms: nextWorkspaceState.dorms.map(mapDormToAuthDorm),
      tenants: nextWorkspaceState.tenants,
      chefs: nextWorkspaceState.chefs,
    });
  }

  function resolveAuthState(
    sharedAuthStore: AuthStoreSnapshot | null,
    localSession: AuthStoreSnapshot["session"],
    nextWorkspaceState: DemoWorkspaceState,
  ) {
    return authService.initialize(
      attachLocalSessionToAuthSnapshot(sharedAuthStore, localSession ?? null),
      buildSeedAuthState(nextWorkspaceState),
    );
  }

  function applyResolvedState(params: {
    nextAuthState: AuthStoreSnapshot | null;
    nextWorkspaceState: DemoWorkspaceState;
    nextSharedSnapshot: SharedAppStateSnapshot | null;
  }) {
    const { nextAuthState, nextWorkspaceState, nextSharedSnapshot } = params;
    latestWorkspaceStateRef.current = nextWorkspaceState;
    latestAuthStateRef.current = nextAuthState;
    latestSharedSnapshotRef.current = nextSharedSnapshot;
    setWorkspaceState(nextWorkspaceState);
    setAuthState(nextAuthState);
  }

  function commitState(nextState: {
    authState?: AuthStoreSnapshot;
    workspaceState?: DemoWorkspaceState;
  }) {
    const nextWorkspaceState = syncWorkspaceState(
      nextState.workspaceState ?? latestWorkspaceStateRef.current,
    );
    const nextAuthSource = nextState.authState ?? latestAuthStateRef.current;
    if (!nextAuthSource) {
      const nextSharedSnapshot: SharedAppStateSnapshot = {
        revision: (latestSharedSnapshotRef.current?.revision ?? 0) + 1,
        sourceId: syncSourceIdRef.current,
        updatedAt: new Date().toISOString(),
        authStore: null,
        workspaceState: nextWorkspaceState,
      };

      applyResolvedState({
        nextAuthState: null,
        nextWorkspaceState,
        nextSharedSnapshot,
      });
      persistLocalSession(null);
      syncAdapter.publish(nextSharedSnapshot);
      return;
    }

    const syncedAuthState = authService.syncDorms(
      nextAuthSource,
      nextWorkspaceState.dorms.map(mapDormToAuthDorm),
    );
    const reconciledWorkspaceState = reconcileWorkspaceInvitationLifecycle(
      nextWorkspaceState,
      syncedAuthState,
    );
    const nextSharedSnapshot: SharedAppStateSnapshot = {
      revision: (latestSharedSnapshotRef.current?.revision ?? 0) + 1,
      sourceId: syncSourceIdRef.current,
      updatedAt: new Date().toISOString(),
      authStore: stripSessionFromAuthSnapshot(syncedAuthState),
      workspaceState: reconciledWorkspaceState,
    };

    applyResolvedState({
      nextAuthState: syncedAuthState,
      nextWorkspaceState: reconciledWorkspaceState,
      nextSharedSnapshot,
    });
    persistLocalSession(syncedAuthState.session);
    syncAdapter.publish(nextSharedSnapshot);
  }

  useEffect(() => {
    const restoredSharedSnapshot = readSharedAppStateSnapshot();
    const legacyAuthState = restoredSharedSnapshot
      ? null
      : restoreLegacyAuthState();
    const restoredWorkspaceState = syncWorkspaceState(
      restoreDemoWorkspace(
        restoredSharedSnapshot
          ? JSON.stringify(restoredSharedSnapshot.workspaceState)
          : window.localStorage.getItem(DEMO_WORKSPACE_STORAGE_KEY),
      ),
    );
    const restoredLocalSession =
      restoreLocalSession() ?? legacyAuthState?.session ?? null;
    const initialAuthState = resolveAuthState(
      restoredSharedSnapshot?.authStore ??
        stripSessionFromAuthSnapshot(legacyAuthState),
      restoredLocalSession,
      restoredWorkspaceState,
    );
    const reconciledWorkspaceState = reconcileWorkspaceInvitationLifecycle(
      restoredWorkspaceState,
      initialAuthState,
    );
    const initialSharedSnapshot: SharedAppStateSnapshot = {
      revision: restoredSharedSnapshot?.revision ?? 0,
      sourceId: restoredSharedSnapshot?.sourceId ?? syncSourceIdRef.current,
      updatedAt: restoredSharedSnapshot?.updatedAt ?? new Date().toISOString(),
      authStore: stripSessionFromAuthSnapshot(initialAuthState),
      workspaceState: reconciledWorkspaceState,
    };

    applyResolvedState({
      nextAuthState: initialAuthState,
      nextWorkspaceState: reconciledWorkspaceState,
      nextSharedSnapshot: initialSharedSnapshot,
    });
    if (!restoredSharedSnapshot) {
      persistSharedAppStateSnapshot(initialSharedSnapshot);
    }
    persistLocalSession(initialAuthState.session);
    setIsHydrated(true);
  }, [authService]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    // Cross-tab sync applies only snapshots with a newer shared revision. We
    // replace the full shared store instead of deep-merging it so every tab
    // converges on one authoritative workspace/auth view without duplicate
    // merges or partial stale updates.
    return syncAdapter.subscribe((incomingSnapshot) => {
      if (incomingSnapshot.sourceId === syncSourceIdRef.current) {
        return;
      }

      if (
        incomingSnapshot.revision <=
        (latestSharedSnapshotRef.current?.revision ?? 0)
      ) {
        return;
      }

      const nextWorkspaceState = syncWorkspaceState(
        restoreDemoWorkspace(JSON.stringify(incomingSnapshot.workspaceState)),
      );
      const nextAuthState = resolveAuthState(
        incomingSnapshot.authStore,
        latestAuthStateRef.current?.session ?? null,
        nextWorkspaceState,
      );
      const reconciledWorkspaceState = reconcileWorkspaceInvitationLifecycle(
        nextWorkspaceState,
        nextAuthState,
      );
      const normalizedSharedSnapshot: SharedAppStateSnapshot = {
        ...incomingSnapshot,
        authStore: stripSessionFromAuthSnapshot(nextAuthState),
        workspaceState: reconciledWorkspaceState,
      };

      applyResolvedState({
        nextAuthState,
        nextWorkspaceState: reconciledWorkspaceState,
        nextSharedSnapshot: normalizedSharedSnapshot,
      });
      persistLocalSession(nextAuthState.session);
    });
  }, [authService, isHydrated, syncAdapter]);

  useEffect(() => {
    if (!isHydrated || !authState) {
      return;
    }

    const nextExpirationAt = authState.invitations
      .filter((invitation) => invitation.status === "pending")
      .map((invitation) => new Date(invitation.expiresAt).getTime())
      .filter((timestamp) => Number.isFinite(timestamp) && timestamp > Date.now())
      .sort((left, right) => left - right)[0];

    if (!nextExpirationAt) {
      return;
    }

    const delay = Math.min(
      Math.max(0, nextExpirationAt - Date.now()) + 1000,
      2_147_483_647,
    );

    // Invitations can expire while the tab is open, so we re-run the auth
    // lifecycle at the next known expiry and let commitState reconcile the
    // linked workspace placeholders from that authoritative auth snapshot.
    const timeoutId = window.setTimeout(() => {
      const refreshedAuthState = authService.initialize(
        latestAuthStateRef.current,
        buildSeedAuthState(latestWorkspaceStateRef.current),
      );
      commitState({ authState: refreshedAuthState });
    }, delay);

    return () => window.clearTimeout(timeoutId);
  }, [authService, authState, isHydrated]);

  const value = useMemo<DemoAppContextValue>(
    () => ({
      authService,
      authState,
      isHydrated,
      workspaceState,
      commitAuthState: (nextAuthState) =>
        commitState({ authState: nextAuthState }),
      commitWorkspaceState: (nextWorkspaceState) =>
        commitState({ workspaceState: nextWorkspaceState }),
      commitState,
    }),
    [authService, authState, isHydrated, workspaceState],
  );

  return (
    <DemoAppContext.Provider value={value}>{children}</DemoAppContext.Provider>
  );
}

export function useDemoAppState() {
  const context = useContext(DemoAppContext);
  if (!context) {
    throw new Error("useDemoAppState must be used within DemoAppProvider");
  }

  return context;
}
