import * as SecureStore from "expo-secure-store";

const IP_LOOKUP_URL = "https://domainmobile.domainsb.com.my/Api/GetIP";
const PACKAGE_NAME = "com.bijakpermata";
const SECURE_STORE_KEY = "ServerIP";
const FALLBACK_BASE_URL = "https://bijakpermatadev.domainsb.com.my";

let cachedIpAddress: string | null = null;
// Shared in-flight lookup, so the requests a screen fires at the same time on
// a cold start wait on one GetIP round trip instead of each starting its own.
let pendingIpLookup: Promise<string> | null = null;

// DEV-ONLY (commented out before pushing): points the app at the API
// running locally (`dotnet run` in BijakPermataApi) instead of the remote
// dev server, for testing on the Android emulator (10.0.2.2 is the
// emulator's alias for the host machine's localhost). Uncomment both this
// const and the block below it to test against a local backend again.
// const LOCAL_DEV_BASE_URL = "http://10.0.2.2:5147";

async function lookupIPAddress(): Promise<string> {
  try {
    const response = await fetch(
      `${IP_LOOKUP_URL}?packageName=${PACKAGE_NAME}&branch=`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const data = await response.json();
    if (!data.isSuccess || !data.ipAddress) {
      throw new Error("API did not return a valid IP");
    }

    cachedIpAddress = data.ipAddress;
    // Persisting the address is only needed for the offline fallback below,
    // so it doesn't hold up the caller.
    SecureStore.setItemAsync(SECURE_STORE_KEY, data.ipAddress).catch(() => {});
    return data.ipAddress;
  } catch {
    const stored = await SecureStore.getItemAsync(SECURE_STORE_KEY).catch(
      () => null,
    );
    if (stored) {
      cachedIpAddress = stored;
      return stored;
    }
    cachedIpAddress = FALLBACK_BASE_URL;
    return FALLBACK_BASE_URL;
  }
}

export function getIPAddress(): Promise<string> {
  // if (__DEV__) {
  //   return Promise.resolve(LOCAL_DEV_BASE_URL);
  // }

  if (cachedIpAddress) {
    return Promise.resolve(cachedIpAddress);
  }

  pendingIpLookup ??= lookupIPAddress().finally(() => {
    pendingIpLookup = null;
  });
  return pendingIpLookup;
}

export function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

// fetch() against the API server. Network failures become a user-facing
// message; aborts (the screen moved on to other filters or unmounted) are
// re-thrown as-is so callers can tell them apart.
export async function apiFetch(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  try {
    const baseUrl = await getIPAddress();
    return await fetch(`${baseUrl}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...init,
    });
  } catch (error) {
    if (isAbortError(error)) throw error;
    throw new Error("Unable to connect to the server. Please try again.");
  }
}

export type ApiEnvelope<T> = {
  isSuccess: boolean;
  message: string;
  data?: T;
};

async function request<T>(
  path: string,
  init?: RequestInit,
): Promise<ApiEnvelope<T>> {
  const response = await apiFetch(path, init);
  return response.json();
}

export async function apiGet<T>(
  path: string,
  signal?: AbortSignal,
): Promise<T> {
  const result = await request<T>(path, { method: "GET", signal });
  if (!result.isSuccess || result.data === undefined) {
    throw new Error(result.message || "Request failed");
  }
  return result.data;
}

// For the /Report/* endpoints, which answer `{ ..., data }` with a non-2xx
// status on failure instead of the `isSuccess` envelope.
export async function getReportData<T>(
  path: string,
  failureMessage: string,
  signal?: AbortSignal,
): Promise<T> {
  const response = await apiFetch(path, { method: "GET", signal });
  if (!response.ok) {
    throw new Error(failureMessage);
  }
  const result: { data: T } = await response.json();
  return result.data;
}

export async function apiPost<T = undefined>(
  path: string,
  body: unknown,
): Promise<T | undefined> {
  const result = await request<T>(path, {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (!result.isSuccess) {
    throw new Error(result.message || "Request failed");
  }
  return result.data;
}
