import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";

import { type AccessKey, getAccessId } from "@/constants/access";
import { useAuth } from "@/contexts/auth-context";
import {
  checkPageAccess,
  PAGE_ACCESS_STALE_TIME_MS,
  pageAccessQueryKey,
} from "@/services/access-api";
import {
  fetchQuery,
  getQueryState,
  isQueryFresh,
  subscribeQuery,
} from "@/services/query-cache";

// One character per key: "1" allowed, "0" denied (or the check failed),
// "?" not known yet. A string keeps the useSyncExternalStore snapshot stable.
function readAccessSnapshot(queryKeys: string[]): string {
  return queryKeys
    .map((queryKey) => {
      const state = getQueryState<boolean>(queryKey);
      if (state.data !== undefined) return state.data ? "1" : "0";
      return state.error !== undefined ? "0" : "?";
    })
    .join("");
}

// Page permissions are served from the shared query cache (prefetched at
// login), so a screen can usually start loading its data on first render.
export function usePageAccess<K extends AccessKey>(keys: K[]) {
  const { user } = useAuth();
  const userId = user?.userId ?? null;
  const keysSignature = keys.join(",");

  const activeKeys = useMemo(
    () => keysSignature.split(",").filter(Boolean) as K[],
    [keysSignature],
  );
  const queryKeys = useMemo(
    () =>
      userId === null
        ? []
        : activeKeys.map((key) => pageAccessQueryKey(userId, getAccessId(key))),
    [activeKeys, userId],
  );

  const subscribe = useCallback(
    (listener: () => void) => {
      const unsubscribes = queryKeys.map((queryKey) =>
        subscribeQuery(queryKey, listener),
      );
      return () => unsubscribes.forEach((unsubscribe) => unsubscribe());
    },
    [queryKeys],
  );
  const getSnapshot = useCallback(
    () => readAccessSnapshot(queryKeys),
    [queryKeys],
  );
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    if (userId === null) return;
    const controller = new AbortController();
    activeKeys.forEach((key, index) => {
      const queryKey = queryKeys[index];
      if (isQueryFresh(queryKey, PAGE_ACCESS_STALE_TIME_MS)) return;
      const accessId = getAccessId(key);
      fetchQuery(
        queryKey,
        (signal) => checkPageAccess({ userId, accessId }, signal),
        { signal: controller.signal },
      ).catch(() => {
        // A failed check reads as "no access" via the snapshot.
      });
    });
    return () => controller.abort();
  }, [activeKeys, queryKeys, userId]);

  const access = useMemo(
    () =>
      Object.fromEntries(
        activeKeys.map((key, index) => [key, snapshot[index] === "1"]),
      ) as Record<K, boolean>,
    [activeKeys, snapshot],
  );

  return {
    loading: userId !== null && snapshot.includes("?"),
    access,
  };
}
