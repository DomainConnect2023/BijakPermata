import { apiGet, apiPost } from "@/services/api-client";

export type ApiUser = {
  userId: number;
  userName: string;
  code: string;
};

export async function fetchUserList(): Promise<ApiUser[]> {
  return apiGet<ApiUser[]>("/Api/GetUserList");
}

export async function createUser(payload: {
  userCode: string;
  userName: string;
  password: string;
}): Promise<void> {
  await apiPost("/Api/CreateUser", {
    UserCode: payload.userCode,
    UserName: payload.userName,
    Password: payload.password,
  });
}

export async function updateUser(payload: {
  userId: number;
  userCode: string;
  userName: string;
}): Promise<void> {
  await apiPost("/Api/UpdateUser", {
    UserId: payload.userId,
    UserCode: payload.userCode,
    UserName: payload.userName,
  });
}

export async function deleteUser(userId: number): Promise<void> {
  await apiPost("/Api/DeleteUser", { UserId: userId });
}

export async function changePassword(payload: {
  userId: number;
  oldPassword: string;
  newPassword: string;
}): Promise<void> {
  await apiPost("/Api/UpdatePassword", {
    UserId: payload.userId,
    OldPassword: payload.oldPassword,
    NewPassword: payload.newPassword,
  });
}
