# Plan: migrate Lexicon auth to clang-auth

Branch: `feat/clang-auth` (from `develop`).

## Goal

Replace Lexicon's single-user login (bcrypt hash in env vars, HS256 JWT in `localStorage`, `Authorization: Bearer` headers) with the shared clang-auth service at `https://auth.clintonlangosch.com`. Afterwards:

- You sign in once at `auth.clintonlangosch.com` and are signed in to Lexicon and every other app on `*.clintonlangosch.com` you have a grant for.
- Lexicon stores no passwords or signing secrets. Its functions verify a short-lived ES256 token from clang-auth's public JWKS.
- Admin access means `apps.lexicon` includes `"admin"` in the token's claims (already granted to your user).

## How it works after the change

```
browser (lexicon.clintonlangosch.com)
  │  cookie ca_access (Domain=.clintonlangosch.com, HttpOnly, 15 min)
  ├─► /.netlify/functions/entries-create …   same-origin → cookie sent automatically
  │       withAuth: verify ES256 via JWKS, iss, exp, apps.lexicon ∋ "admin", Origin check
  ├─► /.netlify/functions/auth-me            → {email, name, roles} or 401 (drives UI state)
  └─► auth.clintonlangosch.com
        /login?redirect_uri=…               sign in (or silent redirect if already signed in)
        POST /api/session/refresh           new ca_access when the 15-min token expires
        POST /logout                        signs out of all apps
```

The token is HttpOnly, so frontend code never sees it. That removes the XSS-steals-token risk of `localStorage`.

## Prerequisites (outside this repo)

1. **Custom domain.** Add `lexicon.clintonlangosch.com` to the Netlify site (Domain management → Add domain). DNS is Netlify DNS, so the record is created automatically. Until this is live, cookie auth cannot work in production: the `*.netlify.app` URL never receives the cookie.
2. **clang-auth app.** Done: `lexicon` with origin `https://lexicon.clintonlangosch.com`, user granted `lexicon:admin`.
3. **Netlify env vars** (production context):
   - `AUTH_BASE_URL=https://auth.clintonlangosch.com`
   - `AUTH_APP_SLUG=lexicon`
   - `NEXT_PUBLIC_AUTH_BASE_URL=https://auth.clintonlangosch.com` (frontend, baked in at build time)
   - `APP_ORIGIN=https://lexicon.clintonlangosch.com` (for the CSRF origin check)

## Part 2: backend (Netlify functions)

| Step | Change |
|---|---|
| 2.1 | Add `jose`. New `lib/clang-auth.ts`: `verifyAccessToken(token)` using `createRemoteJWKSet` (cached per function instance, re-fetches on unknown `kid`), `algorithms: ["ES256"]`, `issuer: AUTH_BASE_URL`, `clockTolerance: 30`. Plus `readCookie(event, "ca_access")`. The JWKS source is injectable so tests can use a local key set. |
| 2.2 | Rewrite `withAuth` in `lib/auth-middleware.ts`. Read `ca_access` from the `Cookie` header (no more `Authorization`). Return `401 UNAUTHENTICATED` for a missing, expired or invalid token, and `403 FORBIDDEN` if `apps[AUTH_APP_SLUG]` lacks `"admin"`. Keep the existing JSON error shape so the frontend's error handling still works. Attach `event.user = { sub, email, name, roles }`. |
| 2.3 | CSRF origin check in `withAuth` for `POST/PUT/PATCH/DELETE`: the `Origin` header (or `Referer` if `Origin` is missing) must equal `APP_ORIGIN`. Otherwise return `403`. This is needed because `SameSite=Lax` treats sibling subdomains as same-site, so another `*.clintonlangosch.com` app could otherwise submit a forged request carrying your cookie. |
| 2.4 | New function `auth-me`: returns `{ email, name, roles }` from a valid token, or `401`. It's what the UI uses to decide whether to show admin controls. |
| 2.5 | Delete `auth-login` and the bcrypt and JWT-signing code in `lib/auth.ts`, plus `scripts/generate-password-hash.ts`. Drop the `bcrypt` and `jsonwebtoken` dependencies. |
| 2.6 | Tests (vitest): sign tokens with a throwaway ES256 key and verify them via `createLocalJWKSet`. Cover a valid admin token, a missing cookie, an expired token, the wrong `iss`, a wrong-algorithm or forged signature, no grant (403), a grant without the `admin` role (403), a bad `Origin` on POST (403), and GET without `Origin` passing. |

The handlers themselves don't change: none of them read `event.user`.

## Part 3: frontend

| Step | Change |
|---|---|
| 3.1 | New `lib/auth-client.ts`. `authFetch(url, init)` does a same-origin fetch. On a `401` it calls `POST ${AUTH_BASE}/api/session/refresh` with `credentials: "include"` and retries once. If the refresh fails, it redirects to `${AUTH_BASE}/login?redirect_uri=<current URL>`. It also exports `loginUrl()` and `logout()` (`POST /logout` with `Accept: application/json` and `credentials: "include"`, then reload). |
| 3.2 | New `useAuth()` hook (`components/AuthProvider.tsx`). One `auth-me` call per page load, exposing `{ status, user, isAdmin }`. On `401` it refreshes the session only on `/admin/*` pages or when a `localStorage` hint says this browser has signed in before. That way anonymous visitors never hit the auth service, which is throttled to 5 rps for all apps. It never redirects on public pages. Replaces the four copies of "decode the localStorage JWT" in `PublicLayout`, `EntryCard`, `QuoteCard` and `AuthGuard`. |
| 3.3 | `AuthGuard`: while loading, show the spinner. When signed out, redirect to `loginUrl()`. When signed in without admin, show a "no access" message rather than redirecting, which would loop. |
| 3.4 | Replace every `localStorage.getItem("auth_token")` and `Authorization: Bearer` with `authFetch` in `EntryForm` (create, update, delete, author-create) and `EntryList` (delete). This also fixes an existing bug: `EntryList` read `localStorage.getItem("token")`, the wrong key, so deleting from the list never authenticated. |
| 3.5 | Login and logout UI. The `Header` "Login" links go to `loginUrl()`. `AdminLayout` logout calls `logout()`; its label says "Sign out", and you're signed out of all apps on the domain. `app/admin/login/page.tsx` becomes a tiny client page that redirects to `loginUrl()`, so old bookmarks still work. Delete `LoginForm.tsx`. |
| 3.6 | Update tests in `components/__tests__` that set `auth_token` in `localStorage`. |

## Local development

Cookies need a shared parent domain locally too:

- Run clang-auth locally (`auth.localtest.me:4000`, see that repo's README), and register a dev app: `clang-auth app create lexicon --name Lexicon --origin http://lexicon.localtest.me:8888`, then `clang-auth grant set dev@localtest.me lexicon --role admin`.
- Run Lexicon with `netlify dev` and open `http://lexicon.localtest.me:8888`, not `localhost`. If anything else is listening on port 3000, `netlify dev` silently proxies to *it* instead of Next.js. Pin the port: `netlify dev --command "npx next dev -p 3002" --target-port 3002`.
- `.env`: `AUTH_BASE_URL=http://auth.localtest.me:4000`, `NEXT_PUBLIC_AUTH_BASE_URL=http://auth.localtest.me:4000`, `AUTH_APP_SLUG=lexicon`, `APP_ORIGIN=http://lexicon.localtest.me:8888`.

Production clang-auth refuses `http://` origins, so local dev always uses the local auth service.

**Verified 2026-11-15** (local clang-auth + `netlify dev`, local Mongo `lexicon_dev`): redirect to sign-in from `/admin` and back; the header shows Admin on public pages; create (`201`), edit (`PUT 200`), delete from the edit form and from the list (`200`); `ca_access` is HttpOnly and no token is in `localStorage`; sign-out ends the session (`auth-me` → `401`, `/admin` asks for the password again).

## Rollout

1. Add the custom domain (prerequisite 1) and the env vars (3). The old login keeps working on both URLs in the meantime.
2. Merge to `develop`, then `main`. Netlify deploys.
3. Visit `https://lexicon.clintonlangosch.com/admin`. You're redirected to sign in at auth, then land back on the admin page. Create, edit and delete a test entry. Sign out, and check that admin is blocked again.
4. Remove the old env vars: `JWT_SECRET`, `JWT_EXPIRATION`, `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`.
5. Optional: redirect `*.netlify.app` traffic to the custom domain (Netlify's primary-domain setting does this), so nobody lands on a URL where admin can't work.

**Rollback:** redeploy the previous production deploy in Netlify (one click). The old env vars stay until step 4 for exactly this reason.

## Known limitations

- **Deploy previews** (`deploy-preview-N--….netlify.app`) can show public pages but can't use admin, because they never receive the cookie.
- **Signing out is global.** It ends the clang-auth session for every app.
- **Token changes take up to 15 minutes.** Revoking access or disabling a user in clang-auth takes effect within the 15-minute token lifetime, not instantly.
