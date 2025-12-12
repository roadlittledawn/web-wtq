/**
 * Netlify Scheduled Function: Update Word Definitions
 *
 * Runs weekly to fetch and update definitions for words that don't have them.
 * Uses the Free Dictionary API by default.
 *
 * Schedule: @weekly (every Sunday at midnight UTC)
 * Can be changed to:
 *   - @hourly
 *   - @daily
 *   - @monthly
 *   - Custom cron: "0 0 * * 0" (Sunday midnight)
 *
 * Environment Variables:
 *   - DEFINITION_API_PROVIDER: API provider to use (default: "free-dictionary")
 *   - DEF_BATCH_SIZE: Max entries per run (default: 50)
 *   - DEF_RATE_LIMIT_MS: Delay between API calls in ms (default: 1000)
 *   - DEF_MAX_REQUESTS: Hard limit on API calls per run (default: 100)
 *   - DEF_RETRY_NOT_FOUND_DAYS: Days before retrying not_found (default: 90)
 *   - DEF_RETRY_ERROR_DAYS: Days before retrying errors (default: 7)
 */

import { schedule } from "@netlify/functions";
import { updateDefinitions } from "../../lib/definition-updater";

export const handler = schedule("@weekly", async (event) => {
  console.log("[ScheduledFunction] Starting weekly definition update");
  console.log(`[ScheduledFunction] Triggered at: ${new Date().toISOString()}`);

  try {
    // Get configuration from environment variables
    const config = {
      maxRequests: parseInt(process.env.DEF_MAX_REQUESTS || "100"),
      rateLimit: parseInt(process.env.DEF_RATE_LIMIT_MS || "1000"),
      retryNotFoundDays: parseInt(
        process.env.DEF_RETRY_NOT_FOUND_DAYS || "90"
      ),
      retryErrorDays: parseInt(process.env.DEF_RETRY_ERROR_DAYS || "7"),
      provider: process.env.DEFINITION_API_PROVIDER,
    };

    console.log("[ScheduledFunction] Configuration:", {
      maxRequests: config.maxRequests,
      rateLimit: config.rateLimit,
      retryNotFoundDays: config.retryNotFoundDays,
      retryErrorDays: config.retryErrorDays,
      provider: config.provider || "free-dictionary (default)",
    });

    // Run the definition updater
    const result = await updateDefinitions(config);

    // Log results
    console.log("[ScheduledFunction] Update completed successfully");
    console.log("[ScheduledFunction] Results:", {
      totalProcessed: result.totalProcessed,
      successfulUpdates: result.successfulUpdates,
      notFound: result.notFound,
      failures: result.failures,
      errorCount: result.errors.length,
    });

    // Log individual errors if any
    if (result.errors.length > 0) {
      console.warn(
        "[ScheduledFunction] Errors encountered:",
        result.errors
      );
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        result,
      }),
    };
  } catch (error) {
    console.error(
      "[ScheduledFunction] Fatal error during definition update:",
      error
    );

    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error),
      }),
    };
  }
});
