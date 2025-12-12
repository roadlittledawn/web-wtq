#!/usr/bin/env tsx

// IMPORTANT: Load .env BEFORE any other imports
// This ensures MONGODB_URI is available when mongodb.ts is imported
import { config } from "dotenv";
config();

/**
 * Definition Migration Script
 *
 * One-time migration to:
 * 1. Backfill existing definitions with `definitionSource: 'manual'`
 * 2. Fetch missing definitions from external API
 *
 * Usage:
 *   npx tsx scripts/migrate-definitions.ts [options]
 *
 * Options:
 *   --dry-run         Preview changes without writing to database
 *   --limit <number>  Process only first N entries
 *   --verbose         Show detailed logging
 *   --skip-backfill   Skip Phase 1 (backfill manual definitions)
 *   --skip-fetch      Skip Phase 2 (fetch missing definitions)
 *
 * Examples:
 *   npx tsx scripts/migrate-definitions.ts --dry-run --limit 10
 *   npx tsx scripts/migrate-definitions.ts
 */

import { getDatabase, closeConnection } from "../lib/mongodb";
import { updateDefinitions } from "../lib/definition-updater";
import type { WordEntry } from "../types/models";
import * as fs from "fs";
import * as path from "path";

// Parse command-line arguments
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const verbose = args.includes("--verbose");
const skipBackfill = args.includes("--skip-backfill");
const skipFetch = args.includes("--skip-fetch");

let limit: number | undefined;
const limitIndex = args.indexOf("--limit");
if (limitIndex !== -1 && args[limitIndex + 1]) {
  limit = parseInt(args[limitIndex + 1], 10);
  if (isNaN(limit) || limit < 1) {
    console.error("Error: --limit must be a positive number");
    process.exit(1);
  }
}

// Log configuration
console.log("====================================");
console.log("Definition Migration Script");
console.log("====================================");
console.log(`Dry run: ${dryRun ? "YES (no DB writes)" : "NO"}`);
console.log(`Verbose: ${verbose ? "YES" : "NO"}`);
console.log(`Limit: ${limit !== undefined ? limit : "NONE (all entries)"}`);
console.log(`Skip backfill: ${skipBackfill ? "YES" : "NO"}`);
console.log(`Skip fetch: ${skipFetch ? "YES" : "NO"}`);
console.log("====================================\n");

interface MigrationResult {
  phase1: {
    totalFound: number;
    backfilled: number;
  };
  phase2: {
    totalProcessed: number;
    successfulUpdates: number;
    notFound: number;
    failures: number;
    errors: Array<{ slug: string; term: string; error: string }>;
  };
}

/**
 * Phase 1: Backfill existing definitions as 'manual'
 */
async function backfillManualDefinitions(): Promise<{
  totalFound: number;
  backfilled: number;
}> {
  console.log("\n=== Phase 1: Backfill Manual Definitions ===\n");

  const db = await getDatabase();

  // Find word entries with definitions but no definitionSource
  const query = {
    type: "word" as const,
    definition: { $exists: true, $ne: null },
    definitionSource: { $exists: false },
  };

  const entries = limit
    ? await db
        .collection<WordEntry>("entries")
        .find(query)
        .limit(limit)
        .toArray()
    : await db.collection<WordEntry>("entries").find(query).toArray();

  console.log(`Found ${entries.length} entries with definitions but no source`);

  if (entries.length === 0) {
    console.log("✓ No entries to backfill\n");
    return { totalFound: 0, backfilled: 0 };
  }

  if (dryRun) {
    console.log("[DRY RUN] Would mark the following as 'manual':");
    entries.slice(0, 10).forEach((entry) => {
      console.log(`  - ${entry.name} (${entry.slug})`);
    });
    if (entries.length > 10) {
      console.log(`  ... and ${entries.length - 10} more`);
    }
    console.log(`\n[DRY RUN] Would backfill ${entries.length} entries\n`);
    return { totalFound: entries.length, backfilled: 0 };
  }

  // Update all entries to mark as manual
  const result = await db.collection<WordEntry>("entries").updateMany(query, {
    $set: {
      definitionSource: "manual",
      updatedAt: new Date(),
    },
  });

  console.log(`✓ Backfilled ${result.modifiedCount} entries as 'manual'\n`);

  return {
    totalFound: entries.length,
    backfilled: result.modifiedCount,
  };
}

/**
 * Phase 2: Fetch missing definitions
 */
async function fetchMissingDefinitions(): Promise<MigrationResult["phase2"]> {
  console.log("\n=== Phase 2: Fetch Missing Definitions ===\n");

  const db = await getDatabase();

  // Count entries that need definitions
  const countQuery = {
    type: "word" as const,
    $and: [
      {
        $or: [
          { definitionSource: { $exists: false } },
          { definitionSource: "api" },
        ],
      },
      {
        $or: [{ definition: { $exists: false } }, { definition: null }],
      },
      {
        $or: [
          { apiLookupStatus: { $exists: false } },
          { apiLookupStatus: { $nin: ["found", "not_found"] } },
        ],
      },
    ],
  };

  const totalNeeded = await db
    .collection<WordEntry>("entries")
    .countDocuments(countQuery);

  console.log(
    `Found ${totalNeeded} word entries without definitions (excluding manual)`
  );

  if (totalNeeded === 0) {
    console.log("✓ No definitions to fetch\n");
    return {
      totalProcessed: 0,
      successfulUpdates: 0,
      notFound: 0,
      failures: 0,
      errors: [],
    };
  }

  const processLimit = limit !== undefined ? Math.min(limit, totalNeeded) : 100;
  console.log(`Processing up to ${processLimit} entries...\n`);

  if (dryRun) {
    // In dry run, just show what would be processed
    const entries = await db
      .collection<WordEntry>("entries")
      .find(countQuery)
      .limit(processLimit)
      .toArray();

    console.log("[DRY RUN] Would fetch definitions for:");
    entries.slice(0, 10).forEach((entry) => {
      console.log(`  - ${entry.name} (${entry.slug})`);
    });
    if (entries.length > 10) {
      console.log(`  ... and ${entries.length - 10} more`);
    }
    console.log(`\n[DRY RUN] Would process ${entries.length} entries\n`);

    return {
      totalProcessed: entries.length,
      successfulUpdates: 0,
      notFound: 0,
      failures: 0,
      errors: [],
    };
  }

  // Actually fetch definitions
  const result = await updateDefinitions({
    maxRequests: processLimit,
    rateLimit: parseInt(process.env.DEF_RATE_LIMIT_MS || "1000"),
    retryNotFoundDays: 0, // Fetch all in migration
    retryErrorDays: 0, // Fetch all in migration
  });

  return result;
}

/**
 * Main migration function
 */
async function migrate(): Promise<void> {
  const startTime = Date.now();
  const migrationResult: MigrationResult = {
    phase1: { totalFound: 0, backfilled: 0 },
    phase2: {
      totalProcessed: 0,
      successfulUpdates: 0,
      notFound: 0,
      failures: 0,
      errors: [],
    },
  };

  try {
    // Phase 1: Backfill
    if (!skipBackfill) {
      migrationResult.phase1 = await backfillManualDefinitions();
    } else {
      console.log("⏭️  Skipping Phase 1 (backfill)\n");
    }

    // Phase 2: Fetch
    if (!skipFetch) {
      migrationResult.phase2 = await fetchMissingDefinitions();
    } else {
      console.log("⏭️  Skipping Phase 2 (fetch)\n");
    }

    // Summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log("\n====================================");
    console.log("Migration Summary");
    console.log("====================================");
    console.log(`Duration: ${duration}s`);
    console.log(`Dry run: ${dryRun ? "YES" : "NO"}`);
    console.log("");
    console.log("Phase 1 (Backfill):");
    console.log(`  - Found: ${migrationResult.phase1.totalFound}`);
    console.log(`  - Backfilled: ${migrationResult.phase1.backfilled}`);
    console.log("");
    console.log("Phase 2 (Fetch):");
    console.log(`  - Processed: ${migrationResult.phase2.totalProcessed}`);
    console.log(
      `  - Successful: ${migrationResult.phase2.successfulUpdates}`
    );
    console.log(`  - Not found: ${migrationResult.phase2.notFound}`);
    console.log(`  - Failures: ${migrationResult.phase2.failures}`);
    console.log("====================================\n");

    // Save error log if there were errors
    if (migrationResult.phase2.errors.length > 0) {
      const errorLogPath = path.join(
        process.cwd(),
        "migration-errors.json"
      );
      fs.writeFileSync(
        errorLogPath,
        JSON.stringify(migrationResult.phase2.errors, null, 2)
      );
      console.log(`⚠️  Error log saved to: ${errorLogPath}\n`);
    }

    if (dryRun) {
      console.log(
        "✓ Dry run complete - no changes were made to the database\n"
      );
    } else {
      console.log("✓ Migration complete\n");
    }
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    throw error;
  } finally {
    await closeConnection();
  }
}

// Run migration
migrate()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
