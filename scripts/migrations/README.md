# Database Migrations

This directory contains MongoDB migration scripts for the WTQ application.

## Running Migrations

### Prerequisites

- Node.js installed
- MongoDB connection string in `.env` file
- Required dependencies: `mongodb`, `dotenv`

### Run a specific migration

```bash
node scripts/migrations/YYYYMMDD_migration_name.js
```

### Run all pending migrations

```bash
node scripts/run-migrations.js
```

## Migration File Structure

Each migration file should:

1. Have a timestamp prefix: `YYYYMMDD_HHMMSS_description.js`
2. Export `up` and `down` functions
3. Be idempotent (safe to run multiple times)
4. Include clear documentation

## Example Migration

```javascript
const { getDatabase } = require("../../lib/mongodb");

async function up() {
  const db = await getDatabase();
  // Migration logic here
}

async function down() {
  const db = await getDatabase();
  // Rollback logic here
}

module.exports = { up, down };
```

## Migration Tracking

Completed migrations are tracked in the `migrations` collection with:

- `name`: Migration filename
- `executedAt`: Timestamp of execution
- `status`: 'completed' or 'failed'
