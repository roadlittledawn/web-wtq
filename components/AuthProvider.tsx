"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { hasSessionHint, refreshSession, setSessionHint } from "@/lib/auth-client";

export interface AuthUser {
  sub: string;
  email: string;
  name: string | null;
  roles: string[];
  isAdmin: boolean;
}

export type AuthStatus = "loading" | "signed-in" | "signed-out" | "no-access";

interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
  isAdmin: boolean;
  /** Re-check the session (e.g. after signing out). */
  reload: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  status: "loading",
  user: null,
  isAdmin: false,
  reload: async () => {},
});

const ME_URL = "/.netlify/functions/auth-me";

async function fetchMe(): Promise<Response> {
  return fetch(ME_URL, { headers: { Accept: "application/json" } });
}

/**
 * One identity check per page load, shared by every component via useAuth().
 * On 401 it refreshes the session, but only on admin pages or when this
 * browser has signed in before, so anonymous visitors never call the auth
 * service.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<AuthUser | null>(null);

  const reload = useCallback(async () => {
    try {
      let res = await fetchMe();
      if (res.status === 401) {
        const tryRefresh = hasSessionHint() || window.location.pathname.startsWith("/admin");
        if (tryRefresh && (await refreshSession())) {
          res = await fetchMe();
        }
      }
      if (res.ok) {
        const data = (await res.json()) as { user: AuthUser };
        setUser(data.user);
        setStatus("signed-in");
        setSessionHint(true);
      } else if (res.status === 403) {
        setUser(null);
        setStatus("no-access");
        setSessionHint(true);
      } else {
        setUser(null);
        setStatus("signed-out");
        setSessionHint(false);
      }
    } catch {
      setUser(null);
      setStatus("signed-out");
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return (
    <AuthContext.Provider value={{ status, user, isAdmin: !!user?.isAdmin, reload }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  return useContext(AuthContext);
}
