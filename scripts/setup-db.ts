#!/usr/bin/env node

/**
 * Database setup script
 * Run this script to create all required database indexes
 *
 * Usage: npx tsx scripts/setup-db.ts
 */

import { createIndexes, dropAllIndexes } from "../lib/db-indexes";
import { closeConnection } from "../lib/mongodb";

async function main() {
  const args = process.argv.slice(2);
  const shouldDrop = args.includes("--drop");

  try {
    if (shouldDrop) {
      console.log("Dropping existing indexes...");
      await dropAllIndexes();
    }

    console.log("Setting up database indexes...");
    await createIndexes();
    console.log("Database setup completed successfully!");
  } catch (error) {
    console.error("Database setup failed:", error);
    process.exit(1);
  } finally {
    await closeConnection();
    process.exit(0);
  }
}

main();
