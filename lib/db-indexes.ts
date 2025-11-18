import { Db } from "mongodb";
import { getDatabase } from "./mongodb";

/**
 * Create all required database indexes for the application
 * This should be run during application initialization or deployment
 */
export async function createIndexes(): Promise<void> {
  try {
    const db = await getDatabase();

    console.log("Creating database indexes...");

    // Create indexes for entries collection
    await createEntriesIndexes(db);

    // Create indexes for tags collection
    await createTagsIndexes(db);

    // Create indexes for users collection
    await createUsersIndexes(db);

    console.log("All database indexes created successfully");
  } catch (error) {
    console.error("Error creating database indexes:", error);
    throw error;
  }
}

/**
 * Create indexes for the entries collection
 */
async function createEntriesIndexes(db: Db): Promise<void> {
  const entriesCollection = db.collection("entries");

  // Unique index for slug lookups
  await entriesCollection.createIndex(
    { slug: 1 },
    { unique: true, name: "slug_unique" }
  );

  // Compound index for type-specific alphabetical sorting
  await entriesCollection.createIndex(
    { type: 1, name: 1 },
    { name: "type_name" }
  );

  // Compound index for quote sorting by author
  await entriesCollection.createIndex(
    { type: 1, author: 1 },
    { name: "type_author", sparse: true }
  );

  // Multi-key index for tag filtering
  await entriesCollection.createIndex({ tags: 1 }, { name: "tags" });

  // Text index for search functionality
  await entriesCollection.createIndex(
    { name: "text", body: "text", definition: "text" },
    { name: "text_search" }
  );

  console.log("Entries collection indexes created");
}

/**
 * Create indexes for the tags collection
 */
async function createTagsIndexes(db: Db): Promise<void> {
  const tagsCollection = db.collection("tags");

  // Unique index for tag names
  await tagsCollection.createIndex(
    { name: 1 },
    { unique: true, name: "name_unique" }
  );

  console.log("Tags collection indexes created");
}

/**
 * Create indexes for the users collection
 */
async function createUsersIndexes(db: Db): Promise<void> {
  const usersCollection = db.collection("users");

  // Unique index for username lookups
  await usersCollection.createIndex(
    { username: 1 },
    { unique: true, name: "username_unique" }
  );

  console.log("Users collection indexes created");
}

/**
 * Drop all indexes (useful for testing or migrations)
 * WARNING: This will drop all indexes except the _id index
 */
export async function dropAllIndexes(): Promise<void> {
  try {
    const db = await getDatabase();

    await db.collection("entries").dropIndexes();
    await db.collection("tags").dropIndexes();
    await db.collection("users").dropIndexes();

    console.log("All indexes dropped successfully");
  } catch (error) {
    console.error("Error dropping indexes:", error);
    throw error;
  }
}
