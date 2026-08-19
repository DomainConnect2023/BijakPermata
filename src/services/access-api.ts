import { apiGet, apiPost, getIPAddress } from "@/services/api-client";

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
}

export async function checkPageAccess(payload: {
  userId: number;
  accessId: number;
}): Promise<boolean> {
  try {
    const baseUrl = await getIPAddress();
    const response = await fetch(
      `${baseUrl}/Api/GetPageAccess?UserId=${payload.userId}&AccessId=${payload.accessId}`,
      { headers: { "Content-Type": "application/json" } },
    );
    const result = await response.json();
    return result === true;
  } catch {
    return false;
  }
}
