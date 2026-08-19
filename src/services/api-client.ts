import * as SecureStore from "expo-secure-store";

const IP_LOOKUP_URL = "https://domainmobile.domainsb.com.my/Api/GetIP";
const PACKAGE_NAME = "com.bijakpermata";
const SECURE_STORE_KEY = "ServerIP";

let cachedIpAddress: string | null = null;

export async function getIPAddress(): Promise<string> {
  if (cachedIpAddress) {
    return cachedIpAddress;
  }

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
    await SecureStore.setItemAsync(SECURE_STORE_KEY, data.ipAddress);
    return data.ipAddress;
  } catch (error) {
    const stored = await SecureStore.getItemAsync(SECURE_STORE_KEY);
    if (stored) {
      cachedIpAddress = stored;
      return stored;
    }
    throw error instanceof Error
      ? error
      : new Error("Unable to resolve server address");
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
  let response: Response;
  try {
    const baseUrl = await getIPAddress();
    response = await fetch(`${baseUrl}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...init,
    });
  } catch {
    throw new Error("Unable to connect to the server. Please try again.");
  }

  return response.json();
}

export async function apiGet<T>(path: string): Promise<T> {
  const result = await request<T>(path, { method: "GET" });
  if (!result.isSuccess || result.data === undefined) {
    throw new Error(result.message || "Request failed");
  }
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
