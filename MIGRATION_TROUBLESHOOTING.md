# Migration Troubleshooting Guide

## Issue: Migration Ran on Wrong Database

If you ran a migration and it created collections in the wrong database (e.g., `wtq` instead of `test`), follow these steps:

### Step 1: Check Current Status

First, verify which database is being used and check migration status:

```bash
node scripts/check-migrations.js
```

This will show:

- Which database is being targeted
- Which migrations have been completed
- Which migrations are pending

### Step 2: Verify Your MongoDB URI

Check your `.env` file to ensure your `MONGODB_URI` includes the correct database name:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/test?retryWrites=true&w=majority
                                                                      ^^^^
                                                                      This should be your database name
```

The database name comes after the hostname and before the `?` query parameters.

### Step 3: Clean Up Wrong Database (Optional)

If migrations created collections in the wrong database, you can either:

**Option A: Leave it** (it won't affect your production data)

**Option B: Manually delete the wrong database** using MongoDB Compass or the mongo shell:

```javascript
use wtq
db.dropDatabase()
```

### Step 4: Run Migration on Correct Database

Now that the scripts are fixed to extract the database name from the connection string, simply run:

```bash
node scripts/run-migrations.js
```

This will:

1. Connect to the correct database (from your MONGODB_URI)
2. Check which migrations are pending
3. Run all pending migrations

### Step 5: Verify Success

Check that the migration completed successfully:

```bash
node scripts/check-migrations.js
```

You should see:

- ✓ Migration marked as completed
- Authors collection created in the correct database
- Quotes updated with authorId references

### Common Issues

#### Issue: "Migration already completed"

If you see this message but the migration didn't actually run on the correct database:

```bash
# Reset the migration status
node scripts/reset-migration.js 20250126_000001_create_authors_collection

# Then re-run
node scripts/run-migrations.js
```

#### Issue: "No quotes found to process"

This means:

- Either there are no quotes in your database yet
- Or the migration is looking at the wrong database

Verify your database has quotes:

```bash
# Using MongoDB shell
use test
db.entries.countDocuments({ type: 'quote' })
```

#### Issue: Connection errors

Make sure:

- Your `.env` file has the correct `MONGODB_URI`
- Your IP is whitelisted in MongoDB Atlas (if using Atlas)
- Your credentials are correct

### Verification Checklist

After running the migration, verify:

- [ ] `authors` collection exists in the correct database
- [ ] Authors were extracted from quotes (check count)
- [ ] Quotes have `authorId` field populated
- [ ] Quotes still have `author` field (backward compatibility)
- [ ] Author `quoteCount` fields are accurate
- [ ] Indexes were created on both collections

### Manual Verification Queries

```javascript
// Check authors collection
use test
db.authors.countDocuments()
db.authors.find().limit(5)

// Check quotes have authorId
db.entries.find({ type: 'quote', authorId: { $exists: true } }).limit(5)

// Check author quote counts
db.authors.aggregate([
  {
    $lookup: {
      from: 'entries',
      localField: '_id',
      foreignField: 'authorId',
      as: 'quotes'
    }
  },
  {
    $project: {
      name: 1,
      quoteCount: 1,
      actualCount: { $size: '$quotes' }
    }
  }
])
```

## Prevention

To prevent this issue in the future:

1. **Always check your database name** before running migrations:

   ```bash
   node scripts/check-migrations.js
   ```

2. **Test on development first** - Run migrations on a development database before production

3. **Backup before migrations** - Always backup your database before running migrations:

   ```bash
   # MongoDB Atlas: Use automated backups
   # Self-hosted: Use mongodump
   mongodump --uri="mongodb://..." --out=/backup/$(date +%Y%m%d)
   ```

4. **Use environment-specific .env files**:
   - `.env.development` for local development
   - `.env.production` for production
   - Never commit `.env` files to git

## Need Help?

If you're still having issues:

1. Check the migration logs for specific error messages
2. Verify your MongoDB connection string format
3. Ensure you have proper permissions on the database
4. Check MongoDB Atlas network access settings (if applicable)
