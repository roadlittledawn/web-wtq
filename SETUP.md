# Quick Setup Guide

## 1. Generate Your Password Hash

Run this command with your desired password:

```bash
npx tsx scripts/generate-password-hash.ts yourSecurePassword
```

You'll get output like:

```
✓ Password hash generated successfully!

Add these to your .env file:

ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=$2b$10$abc123...xyz789
```

## 2. Update Your .env File

Add these lines to your `.env` file:

```bash
# MongoDB Connection
MONGODB_URI=mongodb+srv://your-connection-string

# JWT Configuration
JWT_SECRET=generate-with-crypto-randomBytes-32-hex
JWT_EXPIRATION=24h

# Admin Authentication
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=$2b$10$your-hash-from-step-1
```

Generate JWT_SECRET with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 3. Set Up Database

```bash
npx tsx scripts/setup-db.ts
```

## 4. Run Locally

```bash
netlify dev
```

Visit http://localhost:8888 and log in at `/admin/login`

## Troubleshooting

### "Missing ADMIN_USERNAME or ADMIN_PASSWORD_HASH"

Make sure your `.env` file has both variables set.

### "Invalid username or password"

- Check that your username matches `ADMIN_USERNAME` in `.env`
- Regenerate your password hash if needed

### Netlify CLI not found

```bash
npm install -g netlify-cli
```
