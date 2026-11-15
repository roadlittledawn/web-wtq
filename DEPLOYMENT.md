# Deployment Guide

This guide covers deploying the Clinton Lexicon application to Netlify.

## Prerequisites

- A Netlify account (free tier is sufficient)
- A MongoDB Atlas account with a cluster set up
- Git repository connected to Netlify

## Environment Variables Setup

The application requires the following environment variables to be configured in Netlify:

### Required Environment Variables

#### 1. MONGODB_URI

**Description:** MongoDB connection string for database access

**Format:**

```
mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
```

**How to get it:**

1. Log in to MongoDB Atlas
2. Navigate to your cluster
3. Click "Connect" → "Connect your application"
4. Copy the connection string
5. Replace `<username>`, `<password>`, and `<database>` with your values

**Example:**

```
mongodb+srv://clintonlexicon:mySecurePassword123@cluster0.abc123.mongodb.net/lexicon?retryWrites=true&w=majority
```

#### 2. Authentication (clang-auth)

Admin sign-in uses the shared clang-auth service. Lexicon holds no passwords or signing secrets; these values are all public configuration.

| Variable | Production value | Purpose |
| --- | --- | --- |
| `AUTH_BASE_URL` | `https://auth.clintonlangosch.com` | Functions fetch the public keys (JWKS) from here and check the token's issuer |
| `NEXT_PUBLIC_AUTH_BASE_URL` | `https://auth.clintonlangosch.com` | Frontend sign-in, refresh and sign-out calls. Baked in at build time, so redeploy after changing it |
| `AUTH_APP_SLUG` | `lexicon` | The app slug registered in clang-auth; users need the `admin` role on it |
| `APP_ORIGIN` | `https://lexicon.clintonlangosch.com` | Write requests from any other origin are rejected (CSRF protection) |

#### 3. AUTHOR_IMAGE_API_URL

**Description:** External API endpoint for fetching author images

**Format:** Full URL to the image API

**Options:**

- Wikipedia API: `https://en.wikipedia.org/api/rest_v1`
- Custom image service URL
- Placeholder service: `https://ui-avatars.com/api`

**Example:**

```
https://en.wikipedia.org/api/rest_v1
```

#### 4. AUTHOR_IMAGE_API_KEY (Optional)

**Description:** API key if your image service requires authentication

**Format:** API key string provided by your image service

**Example:**

```
sk_live_abc123def456ghi789
```

**Note:** This is optional and only needed if your chosen image API requires authentication.

## Netlify Deployment Steps

### Step 1: Connect Repository

1. Log in to [Netlify](https://app.netlify.com)
2. Click "Add new site" → "Import an existing project"
3. Choose your Git provider (GitHub, GitLab, Bitbucket)
4. Select the Clinton Lexicon repository
5. Authorize Netlify to access the repository

### Step 2: Configure Build Settings

Netlify should automatically detect the settings from `netlify.toml`, but verify:

- **Build command:** `npm run build`
- **Publish directory:** `.next`
- **Functions directory:** `netlify/functions`

### Step 3: Add Environment Variables

1. In your Netlify site dashboard, go to **Site settings** → **Environment variables**
2. Click **Add a variable** for each required variable:

   | Variable Name | Value | Notes |
   | --- | --- | --- |
   | `MONGODB_URI` | Your MongoDB connection string | From MongoDB Atlas |
   | `AUTH_BASE_URL` | `https://auth.clintonlangosch.com` | clang-auth |
   | `NEXT_PUBLIC_AUTH_BASE_URL` | `https://auth.clintonlangosch.com` | clang-auth (frontend) |
   | `AUTH_APP_SLUG` | `lexicon` | |
   | `APP_ORIGIN` | `https://lexicon.clintonlangosch.com` | Must match the custom domain exactly |
   | `AUTHOR_IMAGE_API_URL` | Your image API URL | Wikipedia or custom |
   | `AUTHOR_IMAGE_API_KEY` | Your API key (if needed) | Optional |

3. Click **Save** after adding each variable

### Step 4: Deploy

1. Click **Deploy site** (or push to your main branch)
2. Netlify will automatically:

   - Install dependencies
   - Run the build command
   - Deploy Netlify Functions
   - Publish the site

3. Monitor the deploy log for any errors

### Step 5: Verify Deployment

After deployment completes:

1. **Test the public interface:**

   - Visit your Netlify URL (e.g., `https://your-site.netlify.app`)
   - Browse words, phrases, quotes, and hypotheticals
   - Test search functionality
   - Verify tag filtering works

2. **Test the admin interface:**

   - Navigate to `https://lexicon.clintonlangosch.com/admin` (the custom domain; the `*.netlify.app` URL can't receive the sign-in cookie)
   - You're redirected to `auth.clintonlangosch.com`; sign in and you land back on the dashboard
   - Create a test entry
   - Edit the test entry
   - Delete the test entry

3. **Check API endpoints:**
   - Open browser DevTools → Network tab
   - Verify API calls to `/.netlify/functions/*` are successful
   - Check for any 500 or authentication errors

## Database Setup

Before deploying, ensure your MongoDB database is properly configured:

### 1. Create Database User

1. In MongoDB Atlas, go to **Database Access**
2. Click **Add New Database User**
3. Create a user with read/write permissions
4. Save the username and password for your connection string

### 2. Configure Network Access

1. Go to **Network Access** in MongoDB Atlas
2. Click **Add IP Address**
3. For Netlify deployment, add: `0.0.0.0/0` (allow access from anywhere)
   - ⚠️ This is necessary because Netlify Functions use dynamic IPs
   - Security is maintained through database authentication

### 3. Create Database and Collections

Run the database setup script to create indexes:

```bash
# Locally, with your MongoDB URI in .env
npm run setup-db
```

Or manually create these collections:

- `entries` - Stores all entry types
- `tags` - Stores tag information

### 4. Grant Admin Access

Admin users live in clang-auth, not in Lexicon's database. With the `clang-auth` CLI configured for production:

```bash
clang-auth app create lexicon --name Lexicon --origin https://lexicon.clintonlangosch.com   # once
clang-auth user create someone@example.com --grant lexicon:admin    # prints a one-time setup link
clang-auth grant set existing@example.com lexicon --role admin      # existing user
```

## Troubleshooting

### Build Failures

**Issue:** Build fails with "Module not found" errors

**Solution:**

- Ensure all dependencies are in `package.json`
- Run `npm install` locally to verify
- Check that `package-lock.json` is committed

**Issue:** Build fails with TypeScript errors

**Solution:**

- Run `npm run build` locally to reproduce
- Fix TypeScript errors before deploying
- Ensure `tsconfig.json` is properly configured

### Function Errors

**Issue:** API endpoints return 500 errors

**Solution:**

- Check Netlify Function logs in the dashboard
- Verify environment variables are set correctly
- Ensure MongoDB connection string is valid
- Check MongoDB network access allows Netlify IPs

**Issue:** "Cannot connect to MongoDB" errors

**Solution:**

- Verify `MONGODB_URI` is correct
- Check MongoDB Atlas network access settings
- Ensure database user has proper permissions
- Test connection string locally first

### Authentication Issues

**Issue:** `/admin` keeps redirecting to sign in, even right after signing in

**Solution:**

- Use the custom domain (`lexicon.clintonlangosch.com`). The `*.netlify.app` URL and deploy previews never receive the `.clintonlangosch.com` cookie
- Check `NEXT_PUBLIC_AUTH_BASE_URL` and `AUTH_BASE_URL` point at `https://auth.clintonlangosch.com`

**Issue:** "You're signed in, but you don't have admin access"

**Solution:** grant the role: `clang-auth grant set <email> lexicon --role admin`. Takes effect on the next token (within 15 minutes, or sign out and in)

**Issue:** Saving fails with 403 "Cross-origin request rejected"

**Solution:** `APP_ORIGIN` must exactly match the site's origin, e.g. `https://lexicon.clintonlangosch.com` (no trailing slash)

**Issue:** Every admin request returns 401 and function logs show JWKS fetch errors

**Solution:** check `https://auth.clintonlangosch.com/.well-known/jwks.json` loads and that `AUTH_BASE_URL` has no typo

### Image Loading Issues

**Issue:** Author images not loading

**Solution:**

- Verify `AUTHOR_IMAGE_API_URL` is correct
- Check external API is accessible
- Review browser console for CORS errors
- Ensure fallback images are working

## Monitoring and Maintenance

### Logs

Access logs in Netlify dashboard:

- **Deploy logs:** Site settings → Deploys → Click on a deploy
- **Function logs:** Functions tab → Select a function → View logs

### Performance

Monitor performance metrics:

- **Build time:** Should be under 2 minutes
- **Function execution:** Should be under 10 seconds
- **Page load time:** Should be under 3 seconds

### Database Maintenance

Regular maintenance tasks:

- Monitor MongoDB Atlas metrics
- Review slow queries
- Check index usage
- Backup database regularly (MongoDB Atlas automatic backups)

## Rollback Procedure

If a deployment causes issues:

1. Go to **Deploys** in Netlify dashboard
2. Find the last working deployment
3. Click the three dots → **Publish deploy**
4. Confirm to instantly rollback

## Custom Domain Setup (Required for admin)

Admin sign-in only works on a subdomain of `clintonlangosch.com`, because the clang-auth cookie is scoped to that domain. Lexicon uses `lexicon.clintonlangosch.com`. DNS for `clintonlangosch.com` is hosted on Netlify DNS, so the record is created automatically:

1. Go to **Domain settings** in Netlify
2. Click **Add custom domain**
3. Enter your domain name
4. Follow DNS configuration instructions
5. Netlify will automatically provision SSL certificate

## Security Best Practices

1. **Review clang-auth grants periodically** (`clang-auth user list --app lexicon`)
2. **Use strong passwords** for database users
3. **Enable MongoDB Atlas IP whitelist** when possible
4. **Monitor access logs** for suspicious activity
5. **Keep dependencies updated** with `npm audit`
6. **Use HTTPS only** (enforced by Netlify)

## Support

For issues specific to:

- **Netlify:** [Netlify Support](https://www.netlify.com/support/)
- **MongoDB Atlas:** [MongoDB Support](https://www.mongodb.com/support)
- **Application bugs:** Check application logs and error messages

## Continuous Deployment

Once set up, the application will automatically deploy when you:

- Push to the main branch
- Merge a pull request
- Manually trigger a deploy in Netlify dashboard

Each deployment will:

1. Run tests (if configured)
2. Build the application
3. Deploy Netlify Functions
4. Update the live site

No manual intervention required! 🚀
