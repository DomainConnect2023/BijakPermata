import accessMap from "@/constants/access.json";
import { apiFetch, apiGet, apiPost } from "@/services/api-client";
import { invalidateQueries, prefetchQuery } from "@/services/query-cache";

export type ApiAccess = {
  accessId: number;
  accessName: string;
  accessCode: string;
};

export type ApiAccessUser = {
  userId: number;
  userName: string;
  code: string;
  hasAccess: boolean;
};

export async function fetchAccessList(): Promise<ApiAccess[]> {
  return apiGet<ApiAccess[]>("/Api/GetAccessList");
}

export async function fetchAccessUserList(
  accessId: number,
): Promise<ApiAccessUser[]> {
  return apiGet<ApiAccessUser[]>(
    `/Api/GetAccessUserList?accessId=${accessId}`,
  );
}

export async function updateAccessUsers(payload: {
  accessId: number;
  userIds: number[];
}): Promise<void> {
  await apiPost("/Api/UpdateAccessUsers", {
    AccessId: payload.accessId,
    UserIds: payload.userIds,
  });
  // The signed-in user may be in the list; re-check their page access.
  invalidateQueries(PAGE_ACCESS_KEY_PREFIX);
}

const PAGE_ACCESS_KEY_PREFIX = "pageAccess:";

// Page access rarely changes during a session; within this window a screen
// reuses the cached answer without asking the server again. Older answers
// are still shown immediately and re-checked in the background.
export const PAGE_ACCESS_STALE_TIME_MS = 5 * 60_000;

export function pageAccessQueryKey(userId: number, accessId: number): string {
  return `${PAGE_ACCESS_KEY_PREFIX}${userId}:${accessId}`;
}

// Throws on network failure (so the failure isn't cached as "no access");
// callers treat a failure as "no access".
export async function checkPageAccess(
  payload: { userId: number; accessId: number },
  signal?: AbortSignal,
): Promise<boolean> {
  const response = await apiFetch(
    `/Api/GetPageAccess?UserId=${payload.userId}&AccessId=${payload.accessId}`,
    { method: "GET", signal },
  );
  const result = await response.json();
  return result === true;
}

// Loads every page-access flag for the user in parallel right after login,
// so opening a screen doesn't have to wait for its permission check first.
export function prefetchAllPageAccess(userId: number) {
  for (const accessId of Object.values(accessMap)) {
    prefetchQuery(
      pageAccessQueryKey(userId, accessId),
      (signal) => checkPageAccess({ userId, accessId }, signal),
      PAGE_ACCESS_STALE_TIME_MS,
    );
  }
}
