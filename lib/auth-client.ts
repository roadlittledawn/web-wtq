/**
 * Browser-side helpers for clang-auth.
 *
 * The access token lives in an HttpOnly cookie (`ca_access`) that frontend
 * code can't read. Same-origin requests to our Netlify functions send it
 * automatically. When it expires (every 15 minutes), we ask the auth service
 * for a new one using its own session cookie, then retry.
 */

export const AUTH_BASE_URL = (process.env.NEXT_PUBLIC_AUTH_BASE_URL ?? "").replace(/\/$/, "");

// Remembers that this browser had a session, so signed-out visitors on public
// pages don't trigger a refresh call to the auth service on every page load.
const HINT_KEY = "lexicon_had_session";

export function setSessionHint(on: boolean): void {
  try {
    if (on) localStorage.setItem(HINT_KEY, "1");
    else localStorage.removeItem(HINT_KEY);
  } catch {
    // Storage unavailable (private mode etc.): we just refresh less cleverly.
  }
}

export function hasSessionHint(): boolean {
  try {
    return localStorage.getItem(HINT_KEY) === "1";
  } catch {
    return false;
  }
}

/** The auth service's login page, returning to `returnTo` afterwards. */
export function loginUrl(returnTo: string = window.location.href): string {
  return `${AUTH_BASE_URL}/login?redirect_uri=${encodeURIComponent(returnTo)}`;
}

export function redirectToLogin(returnTo?: string): void {
  window.location.assign(loginUrl(returnTo));
}

/** Get a fresh access-token cookie. Resolves false if there's no session. */
export async function refreshSession(): Promise<boolean> {
  try {
    const res = await fetch(`${AUTH_BASE_URL}/api/session/refresh`, {
      method: "POST",
      credentials: "include",
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * fetch() for our protected functions. On 401 it refreshes the session and
 * retries once; if there's no session it sends the user to sign in.
 */
export async function authFetch(input: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(input, init);
  if (res.status !== 401) return res;
  if (await refreshSession()) {
    return fetch(input, init);
  }
  setSessionHint(false);
  redirectToLogin();
  return res;
}

/** End the clang-auth session. This signs out of every app on the domain. */
export async function logout(): Promise<void> {
  setSessionHint(false);
  try {
    await fetch(`${AUTH_BASE_URL}/logout`, {
      method: "POST",
      credentials: "include",
      headers: { Accept: "application/json" },
    });
  } catch {
    // Even if the call failed, local state is cleared; reload shows signed out
    // once the 15-minute access token expires.
  }
}
