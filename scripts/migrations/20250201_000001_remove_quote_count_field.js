/**
 * Migration: Remove quoteCount Field from Authors
 *
 * This migration:
 * 1. Removes the quoteCount field from all author documents
 * 2. The quote count is now calculated dynamically via aggregation
 *
 * Background:
 * - The quoteCount field was previously stored but became stale
 * - Quote counts are now calculated on-the-fly using MongoDB aggregation
 * - This ensures accurate counts without manual synchronization
 *
 * Run with: node scripts/migrations/20250201_000001_remove_quote_count_field.js
 * Rollback with: node scripts/migrations/20250201_000001_remove_quote_count_field.js down
 */

const { MongoClient } = require("mongodb");
require("dotenv").config();

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = "test";

console.log(`Using database: ${MONGODB_DB}`);

async function up() {
  console.log("Starting migration: Remove quoteCount Field from Authors");

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    const db = client.db(MONGODB_DB);

    // Check if migration already ran
    const migrationsCollection = db.collection("migrations");
    const existingMigration = await migrationsCollection.findOne({
      name: "20250201_000001_remove_quote_count_field",
    });

    if (existingMigration && existingMigration.status === "completed") {
      console.log("Migration already completed. Skipping.");
      return;
    }

    const authorsCollection = db.collection("authors");

    // Count authors with quoteCount field
    const authorsWithQuoteCount = await authorsCollection.countDocuments({
      quoteCount: { $exists: true },
    });

    console.log(`Found ${authorsWithQuoteCount} authors with quoteCount field`);

    if (authorsWithQuoteCount === 0) {
      console.log(
        "No authors with quoteCount field found. Migration complete."
      );

      // Record migration as completed
      await migrationsCollection.updateOne(
        { name: "20250201_000001_remove_quote_count_field" },
        {
          $set: {
            name: "20250201_000001_remove_quote_count_field",
            executedAt: new Date(),
            status: "completed",
          },
        },
        { upsert: true }
      );

      return;
    }

    // Remove quoteCount field from all authors
    const result = await authorsCollection.updateMany(
      { quoteCount: { $exists: true } },
      {
        $unset: { quoteCount: "" },
        $set: { updatedAt: new Date() },
      }
    );

    console.log(
      `✓ Removed quoteCount field from ${result.modifiedCount} authors`
    );

    // Record migration as completed
    await migrationsCollection.updateOne(
      { name: "20250201_000001_remove_quote_count_field" },
      {
        $set: {
          name: "20250201_000001_remove_quote_count_field",
          executedAt: new Date(),
          status: "completed",
        },
      },
      { upsert: true }
    );

    console.log("✓ Migration completed successfully");
  } catch (error) {
    console.error("Migration failed:", error);

    // Record migration as failed
    const db = client.db(MONGODB_DB);
    await db.collection("migrations").updateOne(
      { name: "20250201_000001_remove_quote_count_field" },
      {
        $set: {
          name: "20250201_000001_remove_quote_count_field",
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
  console.log("Rolling back migration: Remove quoteCount Field from Authors");

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    const db = client.db(MONGODB_DB);

    const authorsCollection = db.collection("authors");
    const entriesCollection = db.collection("entries");

    // Get all authors
    const authors = await authorsCollection.find({}).toArray();
    console.log(`Found ${authors.length} authors to restore quoteCount for`);

    let updatedCount = 0;

    // Calculate and restore quoteCount for each author
    for (const author of authors) {
      // Count quotes for this author
      const quoteCount = await entriesCollection.countDocuments({
        type: "quote",
        authorId: author._id,
      });

      await authorsCollection.updateOne(
        { _id: author._id },
        {
          $set: {
            quoteCount,
            updatedAt: new Date(),
          },
        }
      );

      console.log(
        `  Restored quoteCount for ${author.lastName}${
          author.firstName ? ", " + author.firstName : ""
        }: ${quoteCount}`
      );
      updatedCount++;
    }

    console.log(`✓ Restored quoteCount field for ${updatedCount} authors`);

    // Remove migration record
    await db.collection("migrations").deleteOne({
      name: "20250201_000001_remove_quote_count_field",
    });

    console.log("✓ Rollback completed successfully");
  } catch (error) {
    console.error("Rollback failed:", error);
    throw error;
  } finally {
    await client.close();
  }
}

// Run migration if called directly
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
