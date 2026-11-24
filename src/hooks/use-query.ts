import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import {
  fetchQuery,
  getQueryState,
  isQueryFresh,
  type QueryState,
  subscribeQuery,
} from "@/services/query-cache";

const IDLE_STATE: QueryState<never> = {
  data: undefined,
  error: undefined,
  updatedAt: 0,
  fetching: false,
};

const noopUnsubscribe = () => {};

export type UseQueryOptions = {
  // How long a cached result counts as fresh. Within this window, showing
  // the screen again reuses it without a request; after it, the cached
  // result is shown immediately and refreshed in the background.
  staleTimeMs?: number;
};

export type UseQueryResult<T> = {
  data: T | undefined;
  error: string | null;
  // True only when there is nothing to show yet for the current key.
  loading: boolean;
  // Pull-to-refresh in progress.
  refreshing: boolean;
  refresh: () => Promise<void>;
};

const DEFAULT_STALE_TIME_MS = 30_000;

// Loads `key` through the shared query cache. Pass `null` as the key to skip
// loading (e.g. while the page permission check is pending). The key must
// encode every parameter the fetcher uses.
export function useQuery<T>(
  key: string | null,
  fetcher: (signal: AbortSignal) => Promise<T>,
  { staleTimeMs = DEFAULT_STALE_TIME_MS }: UseQueryOptions = {},
): UseQueryResult<T> {
  const fetcherRef = useRef(fetcher);
  useLayoutEffect(() => {
    fetcherRef.current = fetcher;
  });

  const subscribe = useCallback(
    (listener: () => void) =>
      key === null ? noopUnsubscribe : subscribeQuery(key, listener),
    [key],
  );
  const getSnapshot = useCallback(
    () => (key === null ? IDLE_STATE : getQueryState<T>(key)),
    [key],
  );
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    if (key === null || isQueryFresh(key, staleTimeMs)) return;
    const controller = new AbortController();
    fetchQuery(key, (signal) => fetcherRef.current(signal), {
      signal: controller.signal,
    }).catch(() => {
      // Errors are surfaced through the cache state.
    });
    return () => controller.abort();
  }, [key, staleTimeMs]);

  const [refreshing, setRefreshing] = useState(false);
  const refresh = useCallback(async () => {
    if (key === null) return;
    setRefreshing(true);
    try {
      await fetchQuery(key, (signal) => fetcherRef.current(signal), {
        force: true,
      });
    } catch {
      // Errors are surfaced through the cache state.
    } finally {
      setRefreshing(false);
    }
  }, [key]);

  return {
    data: state.data,
    error: state.error ?? null,
    loading:
      key !== null && state.data === undefined && state.error === undefined,
    refreshing,
    refresh,
  };
}
