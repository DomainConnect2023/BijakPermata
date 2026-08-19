import {
  createContext,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

import { loginRequest, type LoginResult } from "@/services/auth-api";
import { updateUser } from "@/services/user-api";

type AuthContextValue = {
  isAuthenticated: boolean;
  user: LoginResult | null;
  login: (usercode: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (usercode: string, username: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<LoginResult | null>(null);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: user !== null,
      user,
      login: async (usercode, password) => {
        if (!usercode.trim() || !password.trim()) {
          throw new Error("Please enter your username and password.");
        }

        const result = await loginRequest(usercode.trim(), password);
        if (result === null) {
          throw new Error("Unable to connect to the server. Please try again.");
        }

        setUser(result);
      },
      logout: () => setUser(null),
      updateProfile: async (usercode, username) => {
        if (!user) {
          throw new Error("You must be logged in to update your profile.");
        }

        const trimmedCode = usercode.trim();
        const trimmedName = username.trim();
        if (!trimmedCode || !trimmedName) {
          throw new Error("Please enter your user code and name.");
        }

        await updateUser({
          userId: user.userId,
          userCode: trimmedCode,
          userName: trimmedName,
        });

        setUser({ ...user, code: trimmedCode, username: trimmedName });
      },
    }),
    [user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
