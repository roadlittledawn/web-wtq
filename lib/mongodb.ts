import { MongoClient, Db } from "mongodb";

if (!process.env.MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable");
}

const uri = process.env.MONGODB_URI;
const options = {
  maxPoolSize: 10,
  minPoolSize: 2,
  maxIdleTimeMS: 30000,
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

// In development mode, use a global variable to preserve the connection
// across hot reloads in Next.js
declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (process.env.NODE_ENV === "development") {
  // In development, use a global variable to preserve the connection
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production, create a new client for each connection
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

/**
 * Get a connected MongoDB client instance
 * Reuses existing connections for optimal performance in serverless environments
 */
export async function getMongoClient(): Promise<MongoClient> {
  try {
    return await clientPromise;
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    throw new Error("Database connection failed");
  }
}

/**
 * Get the database instance
 * @param dbName - Optional database name, defaults to the one in connection string
 */
export async function getDatabase(dbName?: string): Promise<Db> {
  try {
    const client = await getMongoClient();
    return dbName ? client.db(dbName) : client.db();
  } catch (error) {
    console.error("Failed to get database:", error);
    throw new Error("Failed to access database");
  }
}

/**
 * Close the MongoDB connection
 * Should be called when shutting down the application
 */
export async function closeConnection(): Promise<void> {
  try {
    const client = await clientPromise;
    await client.close();
  } catch (error) {
    console.error("Error closing MongoDB connection:", error);
  }
}

export default clientPromise;
