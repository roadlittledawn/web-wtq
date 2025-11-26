/**
 * Migration: Remove Name Field from Authors
 *
 * This migration:
 * 1. Removes the 'name' field from all author documents
 * 2. We now use firstName and lastName instead
 *
 * Run with: node scripts/migrations/20250126_000003_remove_author_name_field.js
 */

const { MongoClient } = require("mongodb");
require("dotenv").config();

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = "test";

console.log(`Using database: ${MONGODB_DB}`);

async function up() {
  console.log("Starting migration: Remove Name Field from Authors");

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    const db = client.db(MONGODB_DB);

    // Check if migration already ran
    const migrationsCollection = db.collection("migrations");
    const existingMigration = await migrationsCollection.findOne({
      name: "20250126_000003_remove_author_name_field",
    });

    if (existingMigration && existingMigration.status === "completed") {
      console.log("Migration already completed. Skipping.");
      return;
    }

    const authorsCollection = db.collection("authors");

    // Count authors with name field
    const countWithName = await authorsCollection.countDocuments({
      name: { $exists: true },
    });

    console.log(`Found ${countWithName} authors with 'name' field`);

    if (countWithName === 0) {
      console.log("No authors have name field. Migration complete.");

      // Record migration as completed
      await migrationsCollection.updateOne(
        { name: "20250126_000003_remove_author_name_field" },
        {
          $set: {
            name: "20250126_000003_remove_author_name_field",
            executedAt: new Date(),
            status: "completed",
          },
        },
        { upsert: true }
      );

      return;
    }

    // First, drop the unique index on 'name' field
    try {
      await authorsCollection.dropIndex("name_1");
      console.log("✓ Dropped unique index on name field");
    } catch (error) {
      // Index might not exist, that's okay
      console.log("  Index on name field does not exist or already dropped");
    }

    // Now remove name field from all authors
    const result = await authorsCollection.updateMany(
      { name: { $exists: true } },
      {
        $unset: { name: "" },
        $set: { updatedAt: new Date() },
      }
    );

    console.log(`✓ Removed 'name' field from ${result.modifiedCount} authors`);

    // Record migration as completed
    await migrationsCollection.updateOne(
      { name: "20250126_000003_remove_author_name_field" },
      {
        $set: {
          name: "20250126_000003_remove_author_name_field",
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
      { name: "20250126_000003_remove_author_name_field" },
      {
        $set: {
          name: "20250126_000003_remove_author_name_field",
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
  console.log("Rolling back migration: Remove Name Field from Authors");
  console.log("WARNING: Cannot restore original 'name' field values!");
  console.log(
    "This rollback will reconstruct names from firstName and lastName."
  );

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    const db = client.db(MONGODB_DB);

    const authorsCollection = db.collection("authors");

    // Get all authors to reconstruct name field
    const authors = await authorsCollection.find({}).toArray();

    console.log(`Reconstructing 'name' field for ${authors.length} authors`);

    for (const author of authors) {
      // Reconstruct name field from firstName and lastName
      let name = "";
      if (author.lastName && author.firstName) {
        name = `${author.lastName}, ${author.firstName}`;
      } else if (author.lastName) {
        name = author.lastName;
      } else if (author.firstName) {
        name = author.firstName;
      }

      await authorsCollection.updateOne(
        { _id: author._id },
        { $set: { name } }
      );

      console.log(`  Restored: ${name}`);
    }

    console.log("✓ Restored name field to all authors");

    // Recreate the unique index on name field
    await authorsCollection.createIndex({ name: 1 }, { unique: true });
    console.log("✓ Recreated unique index on name field");

    // Remove migration record
    await db.collection("migrations").deleteOne({
      name: "20250126_000003_remove_author_name_field",
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
