/**
 * Check Migration Status
 *
 * Shows which migrations have been completed and which are pending
 *
 * Usage:
 *   node scripts/check-migrations.js
 */

const fs = require("fs");
const path = require("path");
const { MongoClient } = require("mongodb");
require("dotenv").config();

const MONGODB_URI = process.env.MONGODB_URI;

// Hardcoded database name
const MONGODB_DB = "test";
const MIGRATIONS_DIR = path.join(__dirname, "migrations");

async function checkMigrations() {
  console.log("Migration Status Check");
  console.log("═".repeat(60));
  console.log(`Database: ${MONGODB_DB}`);
  console.log(
    `MongoDB URI: ${MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, "//***:***@")}`
  );
  console.log("═".repeat(60));
  console.log("");

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    const db = client.db(MONGODB_DB);

    // Get all migration files
    const files = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith(".js") && f !== "README.md")
      .sort();

    if (files.length === 0) {
      console.log("No migration files found.");
      return;
    }

    // Get completed migrations from database
    const migrationsCollection = db.collection("migrations");
    const completedMigrations = await migrationsCollection.find({}).toArray();
    const completedMap = new Map(completedMigrations.map((m) => [m.name, m]));

    console.log("Migration Files:");
    console.log("─".repeat(60));

    let pendingCount = 0;
    let completedCount = 0;
    let failedCount = 0;

    for (const file of files) {
      const migrationName = file.replace(".js", "");
      const completed = completedMap.get(migrationName);

      if (completed) {
        if (completed.status === "completed") {
          console.log(`✓ ${file}`);
          console.log(`  Status: Completed`);
          console.log(`  Executed: ${completed.executedAt}`);
          completedCount++;
        } else if (completed.status === "failed") {
          console.log(`✗ ${file}`);
          console.log(`  Status: Failed`);
          console.log(`  Error: ${completed.error || "Unknown error"}`);
          console.log(`  Attempted: ${completed.executedAt}`);
          failedCount++;
        }
      } else {
        console.log(`○ ${file}`);
        console.log(`  Status: Pending`);
        pendingCount++;
      }
      console.log("");
    }

    console.log("─".repeat(60));
    console.log("Summary:");
    console.log(`  Total migrations: ${files.length}`);
    console.log(`  Completed: ${completedCount}`);
    console.log(`  Failed: ${failedCount}`);
    console.log(`  Pending: ${pendingCount}`);
    console.log("");

    if (pendingCount > 0) {
      console.log("To run pending migrations:");
      console.log("  node scripts/run-migrations.js");
    }

    if (failedCount > 0) {
      console.log("\nTo reset a failed migration:");
      console.log("  node scripts/reset-migration.js <migration-name>");
    }
  } catch (error) {
    console.error("Error checking migrations:", error);
    throw error;
  } finally {
    await client.close();
  }
}

checkMigrations()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
