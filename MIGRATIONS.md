# Database Migrations Guide

This document explains how to manage database schema changes for the WTQ application.

## Overview

We use a custom migration system for MongoDB that:

- Tracks completed migrations in a `migrations` collection
- Supports both forward (up) and backward (down) migrations
- Ensures idempotency (safe to run multiple times)
- Provides clear rollback capabilities

## Directory Structure

```
scripts/
├── migrations/
│   ├── README.md
│   └── YYYYMMDD_HHMMSS_description.js
└── run-migrations.js
```

## Running Migrations

### Run All Pending Migrations

```bash
node scripts/run-migrations.js
```

This will:

1. Check which migrations have already been completed
2. Run all pending migrations in chronological order
3. Track each completed migration in the database

### Run a Specific Migration

```bash
node scripts/migrations/20250126_000001_create_authors_collection.js
```

### Rollback Last Migration

```bash
node scripts/run-migrations.js down
```

Or rollback a specific migration:

```bash
node scripts/migrations/20250126_000001_create_authors_collection.js down
```

## Creating a New Migration

### 1. Create Migration File

Create a new file in `scripts/migrations/` with the format:

```
YYYYMMDD_HHMMSS_description.js
```

Example: `20250126_120000_add_author_bio_field.js`

### 2. Migration Template

```javascript
const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config();

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || "wtq";
const MIGRATION_NAME = "20250126_120000_add_author_bio_field";

async function up() {
  console.log(`Starting migration: ${MIGRATION_NAME}`);

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    const db = client.db(MONGODB_DB);

    // Check if already completed
    const migrationsCollection = db.collection("migrations");
    const existing = await migrationsCollection.findOne({
      name: MIGRATION_NAME,
    });

    if (existing && existing.status === "completed") {
      console.log("Migration already completed. Skipping.");
      return;
    }

    // YOUR MIGRATION LOGIC HERE
    const authorsCollection = db.collection("authors");
    await authorsCollection.updateMany(
      { bio: { $exists: false } },
      { $set: { bio: "" } }
    );

    console.log("✓ Migration completed");

    // Record as completed
    await migrationsCollection.updateOne(
      { name: MIGRATION_NAME },
      {
        $set: {
          name: MIGRATION_NAME,
          executedAt: new Date(),
          status: "completed",
        },
      },
      { upsert: true }
    );
  } catch (error) {
    console.error("Migration failed:", error);

    // Record as failed
    const db = client.db(MONGODB_DB);
    await db.collection("migrations").updateOne(
      { name: MIGRATION_NAME },
      {
        $set: {
          name: MIGRATION_NAME,
          executedAt: new Date(),
          status: "failed",
          error: error.message,
        },
      },
      { upsert: true }
    );

    throw error;
  } finally {
    await client.close();
  }
}

async function down() {
  console.log(`Rolling back migration: ${MIGRATION_NAME}`);

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    const db = client.db(MONGODB_DB);

    // YOUR ROLLBACK LOGIC HERE
    const authorsCollection = db.collection("authors");
    await authorsCollection.updateMany({}, { $unset: { bio: "" } });

    console.log("✓ Rollback completed");

    // Remove migration record
    await db.collection("migrations").deleteOne({ name: MIGRATION_NAME });
  } catch (error) {
    console.error("Rollback failed:", error);
    throw error;
  } finally {
    await client.close();
  }
}

// CLI execution
if (require.main === module) {
  const command = process.argv[2];

  if (command === "down") {
    down()
      .then(() => process.exit(0))
      .catch((error) => {
        console.error(error);
        process.exit(1);
      });
  } else {
    up()
      .then(() => process.exit(0))
      .catch((error) => {
        console.error(error);
        process.exit(1);
      });
  }
}

module.exports = { up, down };
```

## Best Practices

### 1. Idempotency

Always check if the migration has already been applied:

```javascript
// Check if migration already ran
const existing = await migrationsCollection.findOne({ name: MIGRATION_NAME });
if (existing && existing.status === "completed") {
  console.log("Migration already completed. Skipping.");
  return;
}
```

### 2. Data Validation

Validate data before and after migration:

```javascript
// Before
const countBefore = await collection.countDocuments({ field: { $exists: false } });
console.log(`Documents to update: ${countBefore}`);

// Perform migration
await collection.updateMany(...);

// After
const countAfter = await collection.countDocuments({ field: { $exists: true } });
console.log(`Documents updated: ${countAfter}`);
```

### 3. Transactions (for related changes)

Use transactions for atomic operations:

```javascript
const session = client.startSession();
try {
  await session.withTransaction(async () => {
    await collection1.updateMany({}, { $set: { field: 'value' } }, { session });
    await collection2.insertMany([...], { session });
  });
} finally {
  await session.endSession();
}
```

### 4. Backup Before Major Changes

Always backup your database before running migrations that:

- Delete data
- Transform data structures
- Affect large numbers of documents

```bash
# MongoDB Atlas: Use automated backups
# Self-hosted: Use mongodump
mongodump --uri="mongodb://..." --out=/backup/$(date +%Y%m%d)
```

### 5. Test on Development First

1. Test migration on development database
2. Verify data integrity
3. Test rollback functionality
4. Then apply to production

## Common Migration Patterns

### Adding a Field

```javascript
await collection.updateMany(
  { newField: { $exists: false } },
  { $set: { newField: defaultValue } }
);
```

### Renaming a Field

```javascript
await collection.updateMany(
  { oldField: { $exists: true } },
  { $rename: { oldField: "newField" } }
);
```

### Creating an Index

```javascript
await collection.createIndex({ fieldName: 1 }, { unique: true });
```

### Data Transformation

```javascript
const docs = await collection.find({ needsTransform: true }).toArray();
for (const doc of docs) {
  const transformed = transformData(doc);
  await collection.updateOne({ _id: doc._id }, { $set: transformed });
}
```

### Creating a New Collection

```javascript
const collections = await db
  .listCollections({ name: "newCollection" })
  .toArray();
if (collections.length === 0) {
  await db.createCollection("newCollection");
}
```

## Troubleshooting

### Migration Failed

1. Check the error message in console
2. Check the `migrations` collection for status
3. Fix the issue in the migration code
4. Rollback if needed: `node scripts/run-migrations.js down`
5. Re-run the migration

### Migration Stuck

If a migration appears stuck:

1. Check MongoDB logs for long-running operations
2. Check if there are locks on collections
3. Consider adding timeouts to queries

### Partial Migration

If a migration partially completed:

1. Make the migration idempotent
2. Re-run the migration (it should skip completed parts)
3. Or rollback and start fresh

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Run Migrations

on:
  push:
    branches: [main]
    paths:
      - "scripts/migrations/**"

jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: node scripts/run-migrations.js
        env:
          MONGODB_URI: ${{ secrets.MONGODB_URI }}
          MONGODB_DB: ${{ secrets.MONGODB_DB }}
```

### Netlify Build Hook

Add to `netlify.toml`:

```toml
[build]
  command = "npm run build && node scripts/run-migrations.js"
```

## Migration Checklist

Before running a migration in production:

- [ ] Migration tested on development database
- [ ] Rollback tested and works correctly
- [ ] Database backup created
- [ ] Migration is idempotent
- [ ] Error handling is comprehensive
- [ ] Migration is documented
- [ ] Team has been notified
- [ ] Monitoring is in place
- [ ] Rollback plan is ready

## Example: Authors Collection Migration

The first migration (`20250126_000001_create_authors_collection.js`) demonstrates:

- Creating a new collection
- Extracting data from existing documents
- Creating relationships between collections
- Updating indexes
- Proper error handling and rollback

Run it with:

```bash
node scripts/migrations/20250126_000001_create_authors_collection.js
```

This will:

1. Create the `authors` collection
2. Extract unique authors from existing quotes
3. Create author documents with proper slugs
4. Update quotes to reference author IDs
5. Create indexes for performance
6. Track the migration as completed
