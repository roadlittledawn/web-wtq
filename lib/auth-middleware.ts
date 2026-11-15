import { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import {
  ACCESS_COOKIE,
  AccessClaims,
  authSettings,
  originOf,
  readCookie,
  verifyAccessToken,
} from "./clang-auth";

interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export interface AuthUser {
  sub: string;
  email: string;
  name: string | null;
  roles: string[];
}

export interface AuthenticatedEvent extends HandlerEvent {
  user?: AuthUser;
}

/** Role required for every protected (admin) function. */
export const ADMIN_ROLE = "admin";

const STATE_CHANGING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function errorResponse(statusCode: number, code: string, message: string) {
  return {
    statusCode,
    body: JSON.stringify({ error: { code, message } } as ErrorResponse),
    headers: { "Content-Type": "application/json" },
  };
}

function header(event: HandlerEvent, name: string): string | undefined {
  return event.headers[name] ?? event.headers[name.toLowerCase()] ?? undefined;
}

export type AuthResult =
  | { ok: true; claims: AccessClaims; roles: string[] }
  | { ok: false; statusCode: 401 | 403; code: string; message: string };

/**
 * Verify the clang-auth access-token cookie on a request. Doesn't check roles
 * or the CSRF origin; `withAuth` does that.
 */
export async function authenticate(event: HandlerEvent): Promise<AuthResult> {
  const { authBaseUrl, appSlug } = authSettings();
  const token = readCookie(header(event, "cookie"), ACCESS_COOKIE);
  if (!token) {
    return { ok: false, statusCode: 401, code: "UNAUTHENTICATED", message: "Sign-in required" };
  }
  let claims: AccessClaims;
  try {
    claims = await verifyAccessToken(token, authBaseUrl);
  } catch {
    // Expired, forged, or signed by an unknown key: treat as signed out.
    return { ok: false, statusCode: 401, code: "UNAUTHENTICATED", message: "Sign-in required" };
  }
  const roles = claims.apps[appSlug];
  if (!Array.isArray(roles)) {
    return { ok: false, statusCode: 403, code: "FORBIDDEN", message: "You don't have access to this app" };
  }
  return { ok: true, claims, roles };
}

/**
 * State-changing requests must come from this app's own origin. SameSite=Lax
 * treats every *.clintonlangosch.com app as same-site, so without this a
 * sibling app could submit a forged request carrying the user's cookie.
 */
function sameOrigin(event: HandlerEvent, appOrigin: string): boolean {
  const origin = header(event, "origin") ?? originOf(header(event, "referer"));
  return origin === appOrigin;
}

/**
 * Wrap a handler so it only runs for a signed-in user with the admin role on
 * this app. The user's identity is attached as `event.user`.
 */
export function withAuth(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: (event: AuthenticatedEvent, context: HandlerContext) => Promise<any>
): Handler {
  return async (event: HandlerEvent, context: HandlerContext) => {
    let appOrigin: string;
    try {
      appOrigin = authSettings().appOrigin;
    } catch (error) {
      console.error("Auth configuration error:", error);
      return errorResponse(500, "INTERNAL_SERVER_ERROR", "Server configuration error");
    }

    if (STATE_CHANGING.has(event.httpMethod) && !sameOrigin(event, appOrigin)) {
      return errorResponse(403, "FORBIDDEN", "Cross-origin request rejected");
    }

    let result: AuthResult;
    try {
      result = await authenticate(event);
    } catch (error) {
      console.error("Authentication middleware error:", error);
      return errorResponse(500, "INTERNAL_SERVER_ERROR", "An error occurred during authentication");
    }
    if (!result.ok) {
      return errorResponse(result.statusCode, result.code, result.message);
    }
    if (!result.roles.includes(ADMIN_ROLE)) {
      return errorResponse(403, "FORBIDDEN", "Admin access required");
    }

    const authenticatedEvent: AuthenticatedEvent = {
      ...event,
      user: {
        sub: result.claims.sub,
        email: result.claims.email,
        name: result.claims.name,
        roles: result.roles,
      },
    };
    return handler(authenticatedEvent, context);
  };
}
