# Quick Setup Guide

Admin sign-in uses the shared [clang-auth](https://github.com/roadlittledawn/service-clang-auth-claude) service. Production is at `https://auth.clintonlangosch.com`. Lexicon stores no passwords: its functions verify a short-lived token from the `ca_access` cookie against clang-auth's public keys. For the design, see [docs/PLAN.md](docs/PLAN.md).

Locally you run clang-auth too. Both use `*.localtest.me` hostnames: that's public DNS pointing at `127.0.0.1`, so the two "subdomains" can share a cookie.

## 1. Run clang-auth locally

In the clang-auth repo (see its README for prerequisites):

```bash
docker compose up -d                 # MongoDB
cargo run -p service -- seed         # dev user dev@localtest.me / devpassword123
cargo run -p service                 # http://auth.localtest.me:4000
```

Register Lexicon and give the dev user admin (run from the clang-auth repo root, so the CLI uses its local `.env`):

```bash
clang-auth app create lexicon --name Lexicon --origin http://lexicon.localtest.me:8888
clang-auth grant set dev@localtest.me lexicon --role admin
```

## 2. Configure `.env`

```bash
cp .env.example .env
```

Set `MONGODB_URI` (a local or dev database, not production data). The auth variables in `.env.example` already point at the local clang-auth:

```bash
AUTH_BASE_URL=http://auth.localtest.me:4000
NEXT_PUBLIC_AUTH_BASE_URL=http://auth.localtest.me:4000
AUTH_APP_SLUG=lexicon
APP_ORIGIN=http://lexicon.localtest.me:8888
```

## 3. Set Up Database

```bash
npx tsx scripts/setup-db.ts
```

## 4. Run Locally

```bash
netlify dev --command "npx next dev -p 3002" --target-port 3002
```

Open **http://lexicon.localtest.me:8888/admin** (not `localhost`, which can't receive the cookie). You're redirected to the clang-auth sign-in page; sign in as `dev@localtest.me` / `devpassword123` and you land back on the admin dashboard.

Pinning Next.js to port 3002 matters: if anything else is listening on port 3000, plain `netlify dev` silently proxies to that instead.

## Troubleshooting

### Redirected to sign in again right after signing in

You're probably on `localhost` instead of `lexicon.localtest.me:8888`. The cookie is scoped to `.localtest.me`.

### "You're signed in, but you don't have admin access"

Your user has no `admin` grant on `lexicon`: `clang-auth grant set <email> lexicon --role admin`.

### 403 "Cross-origin request rejected" when saving

`APP_ORIGIN` must exactly match the URL in your browser's address bar (scheme, host and port).

### Pages load but every request goes to a different app

Something else was on port 3000. Use the `--target-port` command in step 4.

### Netlify CLI not found

```bash
npm install -g netlify-cli
```
