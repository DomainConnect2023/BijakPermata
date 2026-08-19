import { getIPAddress } from "@/services/api-client";

export type LoginResult = {
  userId: number;
  username: string;
  code: string;
};

type LoginApiResponse = {
  isSuccess: boolean;
  message: string;
  data?: {
    userId: number;
    userName: string;
    code: string;
  };
};

export async function loginRequest(
  usercode: string,
  password: string,
): Promise<LoginResult | null> {
  let response: Response;
  try {
    const baseUrl = await getIPAddress();
    response = await fetch(`${baseUrl}/Api/Login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ UserCode: usercode, Password: password }),
    });
  } catch {
    return null;
  }

  const result: LoginApiResponse = await response.json();
  if (!result.isSuccess || !result.data) {
    throw new Error(result.message || "Login failed");
  }

  return {
    userId: result.data.userId,
    username: result.data.userName,
    code: result.data.code,
  };
}
