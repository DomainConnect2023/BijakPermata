// Small in-memory query cache shared by every screen.
//
// - Results are kept per key, so going back to a screen (or drilling into a
//   screen that needs the same data, e.g. Sales Detail -> Transactions) shows
//   the last result immediately while a fresh copy loads in the background.
// - Concurrent requests for the same key share one network call.
// - A request is aborted once nobody is waiting for it any more (the screen
//   switched filters or was closed), which also cancels the SQL query on the
//   server through the request's CancellationToken.

export type QueryState<T> = {
  data: T | undefined;
  error: string | undefined;
  // Date.now() of the last successful load; 0 = never / invalidated.
  updatedAt: number;
  fetching: boolean;
};

type Run<T> = {
  id: number;
  promise: Promise<T>;
  controller: AbortController;
  refs: number;
  settled: boolean;
};

type Entry = {
  state: QueryState<unknown>;
  listeners: Set<() => void>;
  inflight: Run<unknown> | undefined;
  // id of the run whose result `state.data` currently holds, so a slow older
  // request can't overwrite a newer forced refresh.
  dataRunId: number;
};

const IDLE: QueryState<never> = Object.freeze({
  data: undefined,
  error: undefined,
  updatedAt: 0,
  fetching: false,
});

// Report results can be a few thousand rows; keep the cache bounded. Entries
// a mounted screen is subscribed to are never evicted.
const MAX_ENTRIES = 40;

const entries = new Map<string, Entry>();
let nextRunId = 1;

function getEntry(key: string): Entry {
  let entry = entries.get(key);
  if (!entry) {
    entry = {
      state: IDLE,
      listeners: new Set(),
      inflight: undefined,
      dataRunId: 0,
    };
    entries.set(key, entry);
  }
  return entry;
}

function setState(entry: Entry, patch: Partial<QueryState<unknown>>) {
  entry.state = { ...entry.state, ...patch };
  entry.listeners.forEach((listener) => listener());
}

function touch(key: string, entry: Entry) {
  // Map keeps insertion order: re-inserting marks the key most recently used.
  entries.delete(key);
  entries.set(key, entry);

  if (entries.size <= MAX_ENTRIES) return;
  for (const [oldKey, oldEntry] of entries) {
    if (entries.size <= MAX_ENTRIES) break;
    if (oldEntry.listeners.size === 0 && !oldEntry.inflight) {
      entries.delete(oldKey);
    }
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error && error.message
    ? error.message
    : "Failed to load data";
}

function createAbortError(): Error {
  const error = new Error("Aborted");
  error.name = "AbortError";
  return error;
}

export function getQueryState<T>(key: string): QueryState<T> {
  return (entries.get(key)?.state ?? IDLE) as QueryState<T>;
}

export function subscribeQuery(key: string, listener: () => void) {
  const entry = getEntry(key);
  entry.listeners.add(listener);
  return () => {
    entry.listeners.delete(listener);
  };
}

export function isQueryFresh(key: string, staleTimeMs: number): boolean {
  const state = entries.get(key)?.state;
  return (
    state !== undefined &&
    state.data !== undefined &&
    state.updatedAt > 0 &&
    Date.now() - state.updatedAt < staleTimeMs
  );
}

export type FetchQueryOptions = {
  // Aborting this signal detaches the caller; the request itself is only
  // aborted once every caller has detached. Without a signal the caller
  // keeps the request alive until it finishes (used for prefetching).
  signal?: AbortSignal;
  // Start a new request even if one is already in flight (pull-to-refresh).
  force?: boolean;
};

export function fetchQuery<T>(
  key: string,
  fetcher: (signal: AbortSignal) => Promise<T>,
  { signal, force = false }: FetchQueryOptions = {},
): Promise<T> {
  if (signal?.aborted) return Promise.reject(createAbortError());

  const entry = getEntry(key);
  let run = entry.inflight as Run<T> | undefined;

  if (!run || force) {
    const controller = new AbortController();
    const newRun: Run<T> = {
      id: nextRunId++,
      promise: undefined as unknown as Promise<T>,
      controller,
      refs: 0,
      settled: false,
    };

    const finish = () => {
      newRun.settled = true;
      if (entry.inflight === newRun) entry.inflight = undefined;
    };

    newRun.promise = Promise.resolve()
      .then(() => fetcher(controller.signal))
      .then(
        (data) => {
          finish();
          if (!controller.signal.aborted && newRun.id >= entry.dataRunId) {
            entry.dataRunId = newRun.id;
            setState(entry, {
              data,
              error: undefined,
              updatedAt: Date.now(),
              fetching: entry.inflight !== undefined,
            });
          } else if (!entry.inflight && entry.state.fetching) {
            setState(entry, { fetching: false });
          }
          return data;
        },
        (error: unknown) => {
          finish();
          if (!controller.signal.aborted) {
            setState(entry, {
              error: errorMessage(error),
              fetching: entry.inflight !== undefined,
            });
          } else if (!entry.inflight && entry.state.fetching) {
            setState(entry, { fetching: false });
          }
          throw error;
        },
      );
    // Callers attach their own handlers below; this one only keeps an
    // unobserved failure from being reported as an unhandled rejection.
    newRun.promise.catch(() => {});

    entry.inflight = newRun as Run<unknown>;
    touch(key, entry);
    setState(entry, { error: undefined, fetching: true });
    run = newRun;
  }

  return attach(entry, run, signal);
}

function attach<T>(
  entry: Entry,
  run: Run<T>,
  signal: AbortSignal | undefined,
): Promise<T> {
  run.refs += 1;
  if (!signal) return run.promise;

  return new Promise<T>((resolve, reject) => {
    const onAbort = () => {
      run.refs -= 1;
      if (run.refs === 0 && !run.settled) {
        run.controller.abort();
        if (entry.inflight === run) {
          entry.inflight = undefined;
          setState(entry, { fetching: false });
        }
      }
      reject(createAbortError());
    };
    signal.addEventListener("abort", onAbort, { once: true });
    run.promise.then(
      (value) => {
        signal.removeEventListener("abort", onAbort);
        resolve(value);
      },
      (error: unknown) => {
        signal.removeEventListener("abort", onAbort);
        reject(error);
      },
    );
  });
}

// Fire-and-forget load into the cache (e.g. right after login). Failures are
// ignored; the screen will simply load the data itself.
export function prefetchQuery<T>(
  key: string,
  fetcher: (signal: AbortSignal) => Promise<T>,
  staleTimeMs = 0,
) {
  if (isQueryFresh(key, staleTimeMs) || entries.get(key)?.inflight) return;
  fetchQuery(key, fetcher).catch(() => {});
}

// Marks matching entries stale so the next screen that shows them reloads
// in the background (cached data stays on screen meanwhile).
export function invalidateQueries(keyPrefix: string) {
  for (const [key, entry] of entries) {
    if (key.startsWith(keyPrefix)) {
      entry.state = { ...entry.state, updatedAt: 0 };
    }
  }
}

// Drops everything, e.g. on login/logout so one user's data never shows for
// another.
export function clearQueryCache() {
  for (const [key, entry] of entries) {
    entry.inflight?.controller.abort();
    entry.inflight = undefined;
    entry.dataRunId = nextRunId;
    if (entry.listeners.size > 0) {
      setState(entry, IDLE);
    } else {
      entries.delete(key);
    }
  }
}
