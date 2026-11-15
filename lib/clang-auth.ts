import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from "jose";

/**
 * Verification of clang-auth access tokens (the `ca_access` cookie).
 *
 * clang-auth signs a short-lived ES256 JWT and publishes its public keys at
 * `${AUTH_BASE_URL}/.well-known/jwks.json`. We verify locally: no call to the
 * auth service per request.
 */

export const ACCESS_COOKIE = "ca_access";

export interface AccessClaims {
  sub: string;
  email: string;
  name: string | null;
  /** app slug -> roles, e.g. { lexicon: ["admin"] } */
  apps: Record<string, string[]>;
}

export interface AuthSettings {
  authBaseUrl: string;
  appSlug: string;
  /** This app's own origin, for the CSRF check on state-changing requests. */
  appOrigin: string;
}

export function authSettings(): AuthSettings {
  const authBaseUrl = process.env.AUTH_BASE_URL;
  const appSlug = process.env.AUTH_APP_SLUG;
  const appOrigin = process.env.APP_ORIGIN;
  if (!authBaseUrl || !appSlug || !appOrigin) {
    throw new Error("AUTH_BASE_URL, AUTH_APP_SLUG and APP_ORIGIN must be set");
  }
  return { authBaseUrl: authBaseUrl.replace(/\/$/, ""), appSlug, appOrigin };
}

// One JWKS fetcher per function instance. jose caches the keys and
// re-fetches when it sees an unknown `kid` (after a key rotation).
let jwks: JWTVerifyGetKey | undefined;
let jwksFor: string | undefined;
let testKeys: JWTVerifyGetKey | undefined;

function keySet(authBaseUrl: string): JWTVerifyGetKey {
  if (testKeys) return testKeys;
  if (!jwks || jwksFor !== authBaseUrl) {
    jwks = createRemoteJWKSet(new URL(`${authBaseUrl}/.well-known/jwks.json`));
    jwksFor = authBaseUrl;
  }
  return jwks;
}

/** Tests only: verify against a local key set instead of fetching the JWKS. */
export function setJwksForTesting(keys: JWTVerifyGetKey | undefined): void {
  testKeys = keys;
}

/**
 * Verify signature (ES256 only, key chosen by `kid`), `iss` and `exp`.
 * Throws on any failure.
 */
export async function verifyAccessToken(
  token: string,
  authBaseUrl: string
): Promise<AccessClaims> {
  const { payload } = await jwtVerify(token, keySet(authBaseUrl), {
    issuer: authBaseUrl,
    algorithms: ["ES256"],
    clockTolerance: 30,
  });
  if (typeof payload.sub !== "string" || typeof payload.apps !== "object" || payload.apps === null) {
    throw new Error("token is missing required claims");
  }
  return payload as unknown as AccessClaims;
}

/** Read one cookie from a raw `Cookie` header. */
export function readCookie(
  header: string | undefined,
  name: string
): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() === name) {
      return decodeURIComponent(part.slice(eq + 1).trim());
    }
  }
  return undefined;
}

/** Origin of a URL string, or undefined if it doesn't parse. */
export function originOf(value: string | undefined): string | undefined {
  if (!value) return undefined;
  try {
    return new URL(value).origin;
  } catch {
    return undefined;
  }
}
