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

#### 2. JWT_SECRET

**Description:** Secret key used to sign and verify JWT authentication tokens

**Format:** A strong random string (minimum 32 characters recommended)

**How to generate:**

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Using OpenSSL
openssl rand -hex 32
```

**Example:**

```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
```

⚠️ **Important:** Never commit this value to version control. Use a different secret for production than development.

#### 3. JWT_EXPIRATION

**Description:** Token expiration time

**Format:** Time string (e.g., "24h", "7d", "30m")

**Recommended value:**

```
24h
```

#### 4. AUTHOR_IMAGE_API_URL

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

#### 5. AUTHOR_IMAGE_API_KEY (Optional)

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
   | `JWT_SECRET` | Your generated secret key | Use strong random string |
   | `JWT_EXPIRATION` | `24h` | Token validity period |
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

   - Navigate to `/admin/login`
   - Log in with your credentials
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
- `users` - Stores admin user credentials

### 4. Create Admin User

You'll need to manually create an admin user in the `users` collection:

```javascript
// Use MongoDB Compass or mongosh
db.users.insertOne({
  username: "admin",
  passwordHash: "$2b$12$...", // Generate using bcrypt with work factor 12
  createdAt: new Date(),
  updatedAt: new Date(),
});
```

To generate a password hash:

```javascript
const bcrypt = require("bcrypt");
const password = "your-secure-password";
const hash = await bcrypt.hash(password, 12);
console.log(hash);
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

**Issue:** Login fails with "Invalid credentials"

**Solution:**

- Verify admin user exists in database
- Check password hash was generated correctly
- Ensure `JWT_SECRET` is set in Netlify
- Check browser console for detailed errors

**Issue:** "Token expired" errors

**Solution:**

- Verify `JWT_EXPIRATION` is set correctly
- Clear browser localStorage and log in again
- Check system time is synchronized

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

## Custom Domain Setup (Optional)

To use a custom domain:

1. Go to **Domain settings** in Netlify
2. Click **Add custom domain**
3. Enter your domain name
4. Follow DNS configuration instructions
5. Netlify will automatically provision SSL certificate

## Security Best Practices

1. **Rotate JWT_SECRET periodically** (every 90 days recommended)
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
