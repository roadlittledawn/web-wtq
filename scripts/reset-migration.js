/**
 * Reset Migration Status
 *
 * Removes a migration record from the migrations collection
 * so it can be re-run.
 *
 * Usage:
 *   node scripts/reset-migration.js 20250126_000001_create_authors_collection
 */

const { MongoClient } = require("mongodb");
require("dotenv").config();

const MONGODB_URI = process.env.MONGODB_URI;

// Hardcoded database name
const MONGODB_DB = "test";

async function resetMigration(migrationName) {
  console.log(`Resetting migration: ${migrationName}`);
  console.log(`Database: ${MONGODB_DB}\n`);

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    const db = client.db(MONGODB_DB);
    const migrationsCollection = db.collection("migrations");

    // Check if migration exists
    const migration = await migrationsCollection.findOne({
      name: migrationName,
    });

    if (!migration) {
      console.log("Migration record not found. Nothing to reset.");
      return;
    }

    console.log("Found migration record:");
    console.log(`  Status: ${migration.status}`);
    console.log(`  Executed at: ${migration.executedAt}`);

    // Delete the migration record
    const result = await migrationsCollection.deleteOne({
      name: migrationName,
    });

    if (result.deletedCount > 0) {
      console.log("\n✓ Migration record deleted successfully");
      console.log("You can now re-run the migration.");
    } else {
      console.log("\n✗ Failed to delete migration record");
    }
  } catch (error) {
    console.error("Error resetting migration:", error);
    throw error;
  } finally {
    await client.close();
  }
}

// Main execution
const migrationName = process.argv[2];

if (!migrationName) {
  console.error("Error: Migration name is required");
  console.error("Usage: node scripts/reset-migration.js <migration-name>");
  console.error(
    "Example: node scripts/reset-migration.js 20250126_000001_create_authors_collection"
  );
  process.exit(1);
}

resetMigration(migrationName)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
