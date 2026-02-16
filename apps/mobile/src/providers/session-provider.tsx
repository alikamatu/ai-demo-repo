import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { AuthUser } from "@/src/types/lifeos";
import * as api from "@/src/services/api";
import { authStorage } from "@/src/services/auth-storage";
import { registerForPushNotificationsAsync } from "@/src/services/notifications";

type SessionContextValue = {
  token: string | null;
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (name: string, email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

async function registerPush(token: string) {
  const push = await registerForPushNotificationsAsync();
  if (!push.token) return;

  await api.registerPushToken(token, {
    deviceId: push.deviceId,
    platform: push.platform,
    token: push.token,
  });
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      const saved = await authStorage.getToken();

      if (!saved) {
        setLoading(false);
        return;
      }

      const me = await api.me(saved);
      if (!me) {
        await authStorage.removeToken();
        setLoading(false);
        return;
      }

      setToken(saved);
      setUser(me.user);
      setLoading(false);
      await registerPush(saved);
    };

    void bootstrap();
  }, []);

  async function signIn(email: string, password: string): Promise<boolean> {
    const response = await api.login(email, password);
    if (!response) return false;

    await authStorage.setToken(response.token);
    setToken(response.token);
    setUser(response.user);
    await registerPush(response.token);
    return true;
  }

  async function signUp(name: string, email: string, password: string): Promise<boolean> {
    const response = await api.register(name, email, password);
    if (!response) return false;

    await authStorage.setToken(response.token);
    setToken(response.token);
    setUser(response.user);
    await registerPush(response.token);
    return true;
  }

  async function signOut() {
    await authStorage.removeToken();
    setToken(null);
    setUser(null);
  }

  const value = useMemo(
    () => ({ token, user, loading, signIn, signUp, signOut }),
    [token, user, loading]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within SessionProvider");
  }

  return context;
}
