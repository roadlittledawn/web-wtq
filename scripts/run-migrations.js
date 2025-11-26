/**
 * Migration Runner
 *
 * Runs all pending migrations in order
 *
 * Usage:
 *   node scripts/run-migrations.js        # Run all pending migrations
 *   node scripts/run-migrations.js down   # Rollback last migration
 */

const fs = require("fs");
const path = require("path");
const { MongoClient } = require("mongodb");
require("dotenv").config();

const MONGODB_URI = process.env.MONGODB_URI;

// Extract database name from connection string
function getDatabaseName(uri) {
  try {
    const url = new URL(uri);
    // Database name is the first part of the pathname (after the leading slash)
    const dbName = url.pathname.split("/")[1].split("?")[0];
    return dbName || "wtq";
  } catch (error) {
    console.error("Error parsing MongoDB URI:", error);
    return "wtq";
  }
}

// Hardcoded database name
// TODO: Move this to environment variable or extract from connection string
const MONGODB_DB = "test";
const MIGRATIONS_DIR = path.join(__dirname, "migrations");

console.log(`Using database: ${MONGODB_DB}`);

async function getCompletedMigrations() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    const db = client.db(MONGODB_DB);
    const migrationsCollection = db.collection("migrations");

    const completed = await migrationsCollection
      .find({ status: "completed" })
      .toArray();

    return new Set(completed.map((m) => m.name));
  } finally {
    await client.close();
  }
}

async function runMigrations() {
  console.log("Starting migration runner...\n");

  // Get all migration files
  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".js") && f !== "README.md")
    .sort();

  if (files.length === 0) {
    console.log("No migration files found.");
    return;
  }

  // Get completed migrations
  const completed = await getCompletedMigrations();

  // Filter to pending migrations
  const pending = files.filter((f) => !completed.has(f.replace(".js", "")));

  if (pending.length === 0) {
    console.log("All migrations are up to date.");
    return;
  }

  console.log(`Found ${pending.length} pending migration(s):\n`);
  pending.forEach((f) => console.log(`  - ${f}`));
  console.log("");

  // Run each pending migration
  for (const file of pending) {
    console.log(`Running migration: ${file}`);
    console.log("─".repeat(60));

    const migrationPath = path.join(MIGRATIONS_DIR, file);
    const migration = require(migrationPath);

    try {
      await migration.up();
      console.log("─".repeat(60));
      console.log("");
    } catch (error) {
      console.error(`\nMigration failed: ${file}`);
      console.error(error);
      process.exit(1);
    }
  }

  console.log("All migrations completed successfully! ✓");
}

async function rollbackLastMigration() {
  console.log("Rolling back last migration...\n");

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    const db = client.db(MONGODB_DB);
    const migrationsCollection = db.collection("migrations");

    // Get last completed migration
    const lastMigration = await migrationsCollection
      .find({ status: "completed" })
      .sort({ executedAt: -1 })
      .limit(1)
      .toArray();

    if (lastMigration.length === 0) {
      console.log("No migrations to roll back.");
      return;
    }

    const migrationName = lastMigration[0].name;
    console.log(`Rolling back: ${migrationName}`);
    console.log("─".repeat(60));

    const migrationPath = path.join(MIGRATIONS_DIR, `${migrationName}.js`);
    const migration = require(migrationPath);

    if (!migration.down) {
      console.error("Migration does not have a down() function.");
      process.exit(1);
    }

    await migration.down();
    console.log("─".repeat(60));
    console.log("\nRollback completed successfully! ✓");
  } catch (error) {
    console.error("\nRollback failed:");
    console.error(error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Main execution
const command = process.argv[2];

if (command === "down") {
  rollbackLastMigration()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
} else {
  runMigrations()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
