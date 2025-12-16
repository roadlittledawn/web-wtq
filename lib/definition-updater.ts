/**
 * Definition Updater Service
 *
 * Core business logic for fetching and updating word definitions from external APIs.
 * Handles querying entries, calling API adapters, updating database, rate limiting,
 * and error handling.
 */

import { getDatabase } from "./mongodb";
import { getDefinitionAdapter } from "./definition-api/factory";
import type { WordEntry } from "../types/models";

/**
 * Configuration for definition update process
 */
export interface UpdateConfig {
  /** Maximum number of entries to process in one run */
  maxRequests: number;
  /** Delay in milliseconds between API requests for rate limiting */
  rateLimit: number;
  /** Number of days before retrying "not_found" entries (default: 90) */
  retryNotFoundDays?: number;
  /** Number of days before retrying "error" entries (default: 7) */
  retryErrorDays?: number;
  /** Override API provider (optional) */
  provider?: string;
}

/**
 * Result of definition update process
 */
export interface UpdateResult {
  /** Total number of entries processed */
  totalProcessed: number;
  /** Number of successful definition updates */
  successfulUpdates: number;
  /** Number of entries where definition was not found */
  notFound: number;
  /** Number of failed API calls */
  failures: number;
  /** Number of entries skipped (e.g., manual definitions) */
  skipped: number;
  /** Detailed error information */
  errors: Array<{
    slug: string;
    term: string;
    error: string;
  }>;
}

/**
 * Sleep helper for rate limiting
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Update definitions for entries missing them
 *
 * Queries database for words without definitions, fetches definitions from API,
 * and updates the database. Respects rate limits and handles errors gracefully.
 *
 * @param config - Configuration for update process
 * @returns Summary of update results
 *
 * @example
 * ```typescript
 * const result = await updateDefinitions({
 *   maxRequests: 50,
 *   rateLimit: 1000,
 * });
 * console.log(`Updated ${result.successfulUpdates} definitions`);
 * ```
 */
export async function updateDefinitions(
  config: UpdateConfig
): Promise<UpdateResult> {
  const db = await getDatabase();
  const adapter = getDefinitionAdapter(config.provider);

  const result: UpdateResult = {
    totalProcessed: 0,
    successfulUpdates: 0,
    notFound: 0,
    failures: 0,
    skipped: 0,
    errors: [],
  };

  // Calculate retry dates
  const retryNotFoundDays = config.retryNotFoundDays || 90;
  const retryErrorDays = config.retryErrorDays || 7;
  const ninetyDaysAgo = new Date(
    Date.now() - retryNotFoundDays * 24 * 60 * 60 * 1000
  );
  const sevenDaysAgo = new Date(
    Date.now() - retryErrorDays * 24 * 60 * 60 * 1000
  );

  console.log(
    `[DefinitionUpdater] Starting update with provider: ${adapter.getName()}`
  );
  console.log(
    `[DefinitionUpdater] Config: maxRequests=${config.maxRequests}, rateLimit=${config.rateLimit}ms`
  );

  // Query for words that need definitions
  const query = {
    type: "word" as const,

    // Exclude entries with manual definitions
    $and: [
      {
        $or: [
          { definitionSource: { $exists: false } },
          { definitionSource: "api" as const },
        ],
      },
      // Must not have a definition
      {
        $or: [
          { definition: { $exists: false } },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          { definition: { $eq: null } as any },
        ],
      },
      // Never attempted OR retry period passed
      {
        $or: [
          // Never attempted
          { apiLookupStatus: { $exists: false } },

          // Not found but retry period passed
          {
            apiLookupStatus: "not_found" as const,
            apiLookupAttemptedAt: { $lt: ninetyDaysAgo },
          },

          // Error - retry sooner
          {
            apiLookupStatus: "error" as const,
            apiLookupAttemptedAt: { $lt: sevenDaysAgo },
          },
        ],
      },
    ],
  };

  const entries = await db
    .collection<WordEntry>("entries")
    .find(query)
    .limit(config.maxRequests)
    .toArray();

  result.totalProcessed = entries.length;

  console.log(`[DefinitionUpdater] Found ${entries.length} entries to process`);

  // Process each entry
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const term = entry.name;

    console.log(
      `[DefinitionUpdater] [${i + 1}/${entries.length}] Processing: "${term}"`
    );

    try {
      // Fetch definition from API
      const definition = await adapter.getDefinition(term);

      if (definition) {
        // Definition found - update entry
        await db.collection<WordEntry>("entries").updateOne(
          { _id: entry._id },
          {
            $set: {
              definition,
              definitionSource: "api" as const,
              apiProvider: adapter.getName(),
              apiLookupStatus: "found" as const,
              apiLookupAttemptedAt: new Date(),
              updatedAt: new Date(),
            },
          }
        );

        result.successfulUpdates++;
        console.log(`[DefinitionUpdater] ✓ Updated definition for: "${term}"`);
      } else {
        // Definition not found - mark as not_found
        await db.collection<WordEntry>("entries").updateOne(
          { _id: entry._id },
          {
            $set: {
              apiLookupStatus: "not_found" as const,
              apiLookupAttemptedAt: new Date(),
              updatedAt: new Date(),
            },
          }
        );

        result.notFound++;
        console.log(
          `[DefinitionUpdater] ✗ No definition found for: "${term}"`
        );
      }
    } catch (error) {
      // API call failed - mark as error
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      await db
        .collection<WordEntry>("entries")
        .updateOne(
          { _id: entry._id },
          {
            $set: {
              apiLookupStatus: "error" as const,
              apiLookupAttemptedAt: new Date(),
              updatedAt: new Date(),
            },
          }
        )
        .catch((updateError) => {
          console.error(
            `[DefinitionUpdater] Failed to update error status for "${term}":`,
            updateError
          );
        });

      result.failures++;
      result.errors.push({
        slug: entry.slug,
        term,
        error: errorMessage,
      });

      console.error(
        `[DefinitionUpdater] ✗ Error fetching definition for "${term}": ${errorMessage}`
      );
    }

    // Rate limiting - sleep between requests (except after last one)
    if (i < entries.length - 1) {
      await sleep(config.rateLimit);
    }
  }

  // Log summary
  console.log(`[DefinitionUpdater] ===== Update Complete =====`);
  console.log(`[DefinitionUpdater] Total processed: ${result.totalProcessed}`);
  console.log(
    `[DefinitionUpdater] Successful updates: ${result.successfulUpdates}`
  );
  console.log(`[DefinitionUpdater] Not found: ${result.notFound}`);
  console.log(`[DefinitionUpdater] Failures: ${result.failures}`);
  console.log(`[DefinitionUpdater] =============================`);

  return result;
}
