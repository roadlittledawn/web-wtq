// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
  SignJWT,
  createLocalJWKSet,
  exportJWK,
  generateKeyPair,
  type CryptoKey,
} from "jose";
import type { HandlerContext, HandlerEvent } from "@netlify/functions";
import { withAuth } from "../auth-middleware";
import { setJwksForTesting } from "../clang-auth";
import { handler as authMe } from "../../netlify/functions/auth-me";

const AUTH = "https://auth.clintonlangosch.com";
const ORIGIN = "https://lexicon.clintonlangosch.com";

let key: CryptoKey;
let otherKey: CryptoKey;

beforeAll(async () => {
  process.env.AUTH_BASE_URL = AUTH;
  process.env.AUTH_APP_SLUG = "lexicon";
  process.env.APP_ORIGIN = ORIGIN;
  const kp = await generateKeyPair("ES256");
  key = kp.privateKey;
  otherKey = (await generateKeyPair("ES256")).privateKey;
  const jwk = { ...(await exportJWK(kp.publicKey)), kid: "k1", alg: "ES256", use: "sig" };
  setJwksForTesting(createLocalJWKSet({ keys: [jwk] }));
});

afterAll(() => setJwksForTesting(undefined));

async function token(opts: {
  apps?: Record<string, string[]>;
  iss?: string;
  expSecondsFromNow?: number;
  signWith?: CryptoKey;
} = {}): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({
    email: "me@example.com",
    name: "Me",
    apps: opts.apps ?? { lexicon: ["admin"] },
  })
    .setProtectedHeader({ alg: "ES256", kid: "k1" })
    .setSubject("user-1")
    .setIssuer(opts.iss ?? AUTH)
    .setIssuedAt(now - 60)
    .setExpirationTime(now + (opts.expSecondsFromNow ?? 900))
    .sign(opts.signWith ?? key);
}

function event(opts: {
  method?: string;
  cookie?: string;
  origin?: string;
  referer?: string;
} = {}): HandlerEvent {
  const headers: Record<string, string> = {};
  if (opts.cookie) headers.cookie = opts.cookie;
  if (opts.origin) headers.origin = opts.origin;
  if (opts.referer) headers.referer = opts.referer;
  return {
    httpMethod: opts.method ?? "GET",
    headers,
    multiValueHeaders: {},
    path: "/",
    rawUrl: `${ORIGIN}/`,
    rawQuery: "",
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    body: null,
    isBase64Encoded: false,
  };
}

const ctx = {} as HandlerContext;

function protectedFn() {
  const inner = vi.fn(async (e: { user?: unknown }) => ({
    statusCode: 200,
    body: JSON.stringify({ user: e.user }),
  }));
  return { inner, fn: withAuth(inner) };
}

async function call(e: HandlerEvent) {
  const { inner, fn } = protectedFn();
  const res = (await fn(e, ctx)) as { statusCode: number; body: string };
  return { res, inner, body: JSON.parse(res.body) };
}

describe("withAuth", () => {
  it("lets an admin through and attaches the user", async () => {
    const { res, inner, body } = await call(
      event({ method: "POST", origin: ORIGIN, cookie: `other=1; ca_access=${await token()}` })
    );
    expect(res.statusCode).toBe(200);
    expect(inner).toHaveBeenCalledOnce();
    expect(body.user).toEqual({ sub: "user-1", email: "me@example.com", name: "Me", roles: ["admin"] });
  });

  it("allows GET without an Origin header", async () => {
    const { res } = await call(event({ cookie: `ca_access=${await token()}` }));
    expect(res.statusCode).toBe(200);
  });

  it("401s without the cookie, and ignores an Authorization header", async () => {
    const e = event({ method: "POST", origin: ORIGIN });
    e.headers.authorization = `Bearer ${await token()}`;
    const { res, inner, body } = await call(e);
    expect(res.statusCode).toBe(401);
    expect(body.error.code).toBe("UNAUTHENTICATED");
    expect(inner).not.toHaveBeenCalled();
  });

  it("401s an expired token", async () => {
    const { res } = await call(event({ cookie: `ca_access=${await token({ expSecondsFromNow: -120 })}` }));
    expect(res.statusCode).toBe(401);
  });

  it("401s a token from another issuer", async () => {
    const { res } = await call(event({ cookie: `ca_access=${await token({ iss: "https://evil.example" })}` }));
    expect(res.statusCode).toBe(401);
  });

  it("401s a token signed by an unknown key", async () => {
    const { res } = await call(event({ cookie: `ca_access=${await token({ signWith: otherKey })}` }));
    expect(res.statusCode).toBe(401);
  });

  it("401s an unsigned (alg none) token", async () => {
    const enc = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
    const now = Math.floor(Date.now() / 1000);
    const forged = `${enc({ alg: "none" })}.${enc({ sub: "x", iss: AUTH, exp: now + 900, apps: { lexicon: ["admin"] } })}.`;
    const { res } = await call(event({ cookie: `ca_access=${forged}` }));
    expect(res.statusCode).toBe(401);
  });

  it("403s a user with no grant for this app", async () => {
    const { res, body } = await call(event({ cookie: `ca_access=${await token({ apps: { recipes: ["admin"] } })}` }));
    expect(res.statusCode).toBe(403);
    expect(body.error.code).toBe("FORBIDDEN");
  });

  it("403s a user with a grant but not the admin role", async () => {
    const { res } = await call(event({ cookie: `ca_access=${await token({ apps: { lexicon: ["member"] } })}` }));
    expect(res.statusCode).toBe(403);
  });

  it("403s a state-changing request from another origin", async () => {
    const cookie = `ca_access=${await token()}`;
    for (const method of ["POST", "PUT", "PATCH", "DELETE"]) {
      const { res, inner } = await call(event({ method, cookie, origin: "https://recipes.clintonlangosch.com" }));
      expect(res.statusCode).toBe(403);
      expect(inner).not.toHaveBeenCalled();
    }
  });

  it("403s a state-changing request with no Origin or Referer", async () => {
    const { res } = await call(event({ method: "DELETE", cookie: `ca_access=${await token()}` }));
    expect(res.statusCode).toBe(403);
  });

  it("accepts a same-origin Referer when Origin is missing", async () => {
    const { res } = await call(
      event({ method: "PUT", cookie: `ca_access=${await token()}`, referer: `${ORIGIN}/admin/entries` })
    );
    expect(res.statusCode).toBe(200);
  });
});

describe("auth-me", () => {
  async function me(e: HandlerEvent) {
    const res = (await authMe(e, ctx)) as { statusCode: number; body: string };
    return { status: res.statusCode, body: JSON.parse(res.body) };
  }

  it("returns the user and admin flag", async () => {
    const { status, body } = await me(event({ cookie: `ca_access=${await token()}` }));
    expect(status).toBe(200);
    expect(body.user).toEqual({ sub: "user-1", email: "me@example.com", name: "Me", roles: ["admin"], isAdmin: true });
  });

  it("reports a non-admin grant as isAdmin false", async () => {
    const { body } = await me(event({ cookie: `ca_access=${await token({ apps: { lexicon: ["member"] } })}` }));
    expect(body.user.isAdmin).toBe(false);
  });

  it("401s when signed out", async () => {
    const { status } = await me(event());
    expect(status).toBe(401);
  });
});
