/**
 * Migration: Create Authors Collection
 *
 * This migration:
 * 1. Creates a new 'authors' collection
 * 2. Extracts unique authors from existing quotes
 * 3. Updates quotes to reference author IDs instead of storing author names
 * 4. Creates indexes for performance
 *
 * Run with: node scripts/migrations/20250126_000001_create_authors_collection.js
 */

const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config();

const MONGODB_URI = process.env.MONGODB_URI;

// Hardcoded database name
// TODO: Move this to environment variable or extract from connection string
const MONGODB_DB = "test";

console.log(`Using database: ${MONGODB_DB}`);

async function up() {
  console.log("Starting migration: Create Authors Collection");

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    const db = client.db(MONGODB_DB);

    // Check if migration already ran
    const migrationsCollection = db.collection("migrations");
    const existingMigration = await migrationsCollection.findOne({
      name: "20250126_000001_create_authors_collection",
    });

    if (existingMigration && existingMigration.status === "completed") {
      console.log("Migration already completed. Skipping.");
      return;
    }

    // Step 1: Create authors collection if it doesn't exist
    const collections = await db.listCollections({ name: "authors" }).toArray();
    if (collections.length === 0) {
      await db.createCollection("authors");
      console.log("✓ Created authors collection");
    } else {
      console.log("✓ Authors collection already exists");
    }

    const authorsCollection = db.collection("authors");
    const quotesCollection = db.collection("entries");

    // Step 2: Extract unique authors from quotes
    const quotes = await quotesCollection.find({ type: "quote" }).toArray();
    console.log(`Found ${quotes.length} quotes to process`);

    const authorMap = new Map(); // Map of author name -> author document

    for (const quote of quotes) {
      if (quote.author && typeof quote.author === "string") {
        const authorName = quote.author.trim();

        if (!authorMap.has(authorName)) {
          // Check if author already exists in database
          let existingAuthor = await authorsCollection.findOne({
            name: authorName,
          });

          if (!existingAuthor) {
            // Create new author
            const newAuthor = {
              _id: new ObjectId(),
              name: authorName,
              slug: authorName
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-|-$/g, ""),
              bio: "",
              quoteCount: 0,
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            await authorsCollection.insertOne(newAuthor);
            authorMap.set(authorName, newAuthor);
            console.log(`  Created author: ${authorName}`);
          } else {
            authorMap.set(authorName, existingAuthor);
            console.log(`  Found existing author: ${authorName}`);
          }
        }
      }
    }

    console.log(`✓ Processed ${authorMap.size} unique authors`);

    // Step 3: Update quotes to reference author IDs
    let updatedCount = 0;
    for (const quote of quotes) {
      if (quote.author && typeof quote.author === "string") {
        const authorName = quote.author.trim();
        const author = authorMap.get(authorName);

        if (author) {
          await quotesCollection.updateOne(
            { _id: quote._id },
            {
              $set: {
                authorId: author._id,
                authorName: author.name, // Keep for backward compatibility
              },
            }
          );
          updatedCount++;
        }
      }
    }

    console.log(`✓ Updated ${updatedCount} quotes with author references`);

    // Step 4: Update author quote counts
    for (const [authorName, author] of authorMap.entries()) {
      const count = await quotesCollection.countDocuments({
        authorId: author._id,
      });

      await authorsCollection.updateOne(
        { _id: author._id },
        { $set: { quoteCount: count } }
      );
    }

    console.log("✓ Updated author quote counts");

    // Step 5: Create indexes
    await authorsCollection.createIndex({ name: 1 }, { unique: true });
    await authorsCollection.createIndex({ slug: 1 }, { unique: true });
    await authorsCollection.createIndex({ quoteCount: -1 });
    await quotesCollection.createIndex({ authorId: 1 });

    console.log("✓ Created indexes");

    // Record migration as completed
    await migrationsCollection.updateOne(
      { name: "20250126_000001_create_authors_collection" },
      {
        $set: {
          name: "20250126_000001_create_authors_collection",
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
      { name: "20250126_000001_create_authors_collection" },
      {
        $set: {
          name: "20250126_000001_create_authors_collection",
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
  console.log("Starting rollback: Create Authors Collection");

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    const db = client.db(MONGODB_DB);

    const authorsCollection = db.collection("authors");
    const quotesCollection = db.collection("entries");

    // Remove authorId field from quotes
    await quotesCollection.updateMany(
      { type: "quote" },
      { $unset: { authorId: "" } }
    );

    console.log("✓ Removed authorId from quotes");

    // Drop authors collection
    await authorsCollection.drop();
    console.log("✓ Dropped authors collection");

    // Remove migration record
    await db.collection("migrations").deleteOne({
      name: "20250126_000001_create_authors_collection",
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
