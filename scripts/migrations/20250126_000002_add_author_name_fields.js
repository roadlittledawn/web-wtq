/**
 * Migration: Add First Name and Last Name Fields to Authors
 *
 * This migration:
 * 1. Adds firstName and lastName fields to existing authors
 * 2. Parses the name field to extract first and last names
 * 3. Handles various name formats (comma-separated, single names, etc.)
 * 4. Creates indexes for sorting by last name
 *
 * Name parsing logic:
 * - "LastName, FirstName" -> lastName: "LastName", firstName: "FirstName"
 * - "FirstName LastName" -> lastName: "LastName", firstName: "FirstName"
 * - "SingleName" -> lastName: "SingleName", firstName: ""
 *
 * Run with: node scripts/migrations/20250126_000002_add_author_name_fields.js
 */

const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config();

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = "test";

console.log(`Using database: ${MONGODB_DB}`);

/**
 * Parse author name into first and last name
 * @param {string} name - Full author name
 * @returns {Object} - { firstName, lastName }
 */
function parseAuthorName(name) {
  if (!name || typeof name !== "string") {
    return { firstName: "", lastName: "" };
  }

  const trimmedName = name.trim();

  // Check if name contains a comma (format: "LastName, FirstName")
  if (trimmedName.includes(",")) {
    const parts = trimmedName.split(",").map((p) => p.trim());
    return {
      lastName: parts[0] || "",
      firstName: parts[1] || "",
    };
  }

  // Check if name has multiple words (format: "FirstName LastName")
  const words = trimmedName.split(/\s+/);
  if (words.length >= 2) {
    // Last word is last name, everything else is first name
    return {
      firstName: words.slice(0, -1).join(" "),
      lastName: words[words.length - 1],
    };
  }

  // Single word name - treat as last name
  return {
    firstName: "",
    lastName: trimmedName,
  };
}

async function up() {
  console.log(
    "Starting migration: Add First Name and Last Name Fields to Authors"
  );

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    const db = client.db(MONGODB_DB);

    // Check if migration already ran
    const migrationsCollection = db.collection("migrations");
    const existingMigration = await migrationsCollection.findOne({
      name: "20250126_000002_add_author_name_fields",
    });

    if (existingMigration && existingMigration.status === "completed") {
      console.log("Migration already completed. Skipping.");
      return;
    }

    const authorsCollection = db.collection("authors");

    // Get all authors
    const authors = await authorsCollection.find({}).toArray();
    console.log(`Found ${authors.length} authors to process`);

    if (authors.length === 0) {
      console.log("No authors found. Migration complete.");

      // Record migration as completed
      await migrationsCollection.updateOne(
        { name: "20250126_000002_add_author_name_fields" },
        {
          $set: {
            name: "20250126_000002_add_author_name_fields",
            executedAt: new Date(),
            status: "completed",
          },
        },
        { upsert: true }
      );

      return;
    }

    // Process each author
    let updatedCount = 0;
    let skippedCount = 0;

    for (const author of authors) {
      // Skip if already has firstName and lastName
      if (author.firstName !== undefined && author.lastName !== undefined) {
        console.log(`  Skipping ${author.name} (already has name fields)`);
        skippedCount++;
        continue;
      }

      const { firstName, lastName } = parseAuthorName(author.name);

      await authorsCollection.updateOne(
        { _id: author._id },
        {
          $set: {
            firstName,
            lastName,
            updatedAt: new Date(),
          },
          $unset: {
            name: "",
          },
        }
      );

      console.log(
        `  Updated: ${author.name} -> firstName: "${firstName}", lastName: "${lastName}"`
      );
      updatedCount++;
    }

    console.log(`✓ Updated ${updatedCount} authors`);
    if (skippedCount > 0) {
      console.log(
        `  Skipped ${skippedCount} authors (already had name fields)`
      );
    }

    // Create index for sorting by last name
    await authorsCollection.createIndex({ lastName: 1, firstName: 1 });
    console.log("✓ Created index on lastName and firstName");

    // Record migration as completed
    await migrationsCollection.updateOne(
      { name: "20250126_000002_add_author_name_fields" },
      {
        $set: {
          name: "20250126_000002_add_author_name_fields",
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
      { name: "20250126_000002_add_author_name_fields" },
      {
        $set: {
          name: "20250126_000002_add_author_name_fields",
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
  console.log(
    "Rolling back migration: Add First Name and Last Name Fields to Authors"
  );

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    const db = client.db(MONGODB_DB);

    const authorsCollection = db.collection("authors");

    // Get all authors to reconstruct name field
    const authors = await authorsCollection.find({}).toArray();

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
        {
          $set: { name },
          $unset: {
            firstName: "",
            lastName: "",
          },
        }
      );
    }

    console.log(
      "✓ Restored name field and removed firstName/lastName fields from authors"
    );

    // Drop the index
    try {
      await authorsCollection.dropIndex("lastName_1_firstName_1");
      console.log("✓ Dropped index on lastName and firstName");
    } catch (error) {
      console.log("  Index may not exist, skipping drop");
    }

    // Remove migration record
    await db.collection("migrations").deleteOne({
      name: "20250126_000002_add_author_name_fields",
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
