import { Handler, HandlerEvent, HandlerResponse } from "@netlify/functions";
import { getDatabase } from "../../lib/mongodb";
import { Entry } from "../../types/models";
import { rankEntry } from "../../lib/searchRanking";

interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

type ScoredEntry = Entry & { score: number };

interface SearchResponse {
  results: ScoredEntry[];
  total: number;
  limit: number;
  offset: number;
  query: string;
}

/**
 * GET /api/search
 * Search entries with text query, type filtering, tag filtering, and pagination
 * Results are ranked by relevance when a query is provided
 */
export const handler: Handler = async (
  event: HandlerEvent
): Promise<HandlerResponse> => {
  // Only allow GET requests
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      body: JSON.stringify({
        error: {
          code: "METHOD_NOT_ALLOWED",
          message: "Only GET requests are allowed",
        },
      } as ErrorResponse),
      headers: {
        "Content-Type": "application/json",
        Allow: "GET",
      },
    };
  }

  try {
    // Parse query parameters
    const params = event.queryStringParameters || {};
    const query = params.q || params.query || "";
    const limit = Math.min(parseInt(params.limit || "30", 10), 100); // Max 100 items per page
    const offset = parseInt(params.offset || "0", 10);
    const type = params.type as
      | "word"
      | "phrase"
      | "quote"
      | "hypothetical"
      | undefined;

    // Parse tags parameter (can be comma-separated or multiple tag params)
    let tags: string[] = [];
    if (params.tags) {
      tags = params.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);
    }

    // Validate type if provided
    if (type && !["word", "phrase", "quote", "hypothetical"].includes(type)) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: {
            code: "INVALID_TYPE",
            message:
              "Invalid entry type. Must be one of: word, phrase, quote, hypothetical",
          },
        } as ErrorResponse),
        headers: {
          "Content-Type": "application/json",
        },
      };
    }

    // Build search filter
    const filter: any = {};

    // Add text search if query is provided
    // Search across ALL relevant fields for ranking to work properly
    if (query) {
      const searchConditions: any[] = [];

      // Word entries: search name, definition, notes
      searchConditions.push({
        type: "word",
        $or: [
          { name: { $regex: query, $options: "i" } },
          { definition: { $regex: query, $options: "i" } },
          { notes: { $regex: query, $options: "i" } },
        ],
      });

      // Phrase entries: search body, definition, notes
      searchConditions.push({
        type: "phrase",
        $or: [
          { body: { $regex: query, $options: "i" } },
          { definition: { $regex: query, $options: "i" } },
          { notes: { $regex: query, $options: "i" } },
        ],
      });

      // Quote entries: search name, body, source, notes
      searchConditions.push({
        type: "quote",
        $or: [
          { name: { $regex: query, $options: "i" } },
          { body: { $regex: query, $options: "i" } },
          { source: { $regex: query, $options: "i" } },
          { notes: { $regex: query, $options: "i" } },
        ],
      });

      // Hypothetical entries: search body, notes
      searchConditions.push({
        type: "hypothetical",
        $or: [
          { body: { $regex: query, $options: "i" } },
          { notes: { $regex: query, $options: "i" } },
        ],
      });

      // Also search tags across all types
      searchConditions.push({
        tags: { $regex: query, $options: "i" },
      });

      filter.$or = searchConditions;
    }

    // Filter by type if provided
    if (type) {
      filter.type = type;
    }

    // Filter by tags if provided (AND logic - entry must have all specified tags)
    if (tags.length > 0) {
      filter.tags = { $all: tags };
    }

    // Get database connection
    const db = await getDatabase();
    const entriesCollection = db.collection<Entry>("entries");

    // If there's a query, we need to fetch all matches, rank them, then paginate
    // If no query, use the original approach (no ranking needed)
    if (query) {
      // Fetch all matching entries for ranking
      // Note: For very large result sets, this could be optimized with aggregation pipelines
      const allResults = await entriesCollection.find(filter).toArray();

      // Rank each entry
      const scoredResults: ScoredEntry[] = allResults.map((entry) => ({
        ...entry,
        score: rankEntry(entry, query),
      }));

      // Sort by score descending (highest score first)
      scoredResults.sort((a, b) => b.score - a.score);

      // Apply pagination after sorting
      const paginatedResults = scoredResults.slice(offset, offset + limit);

      // Return success response with ranked results
      return {
        statusCode: 200,
        body: JSON.stringify({
          results: paginatedResults,
          total: scoredResults.length,
          limit,
          offset,
          query,
        } as SearchResponse),
        headers: {
          "Content-Type": "application/json",
        },
      };
    } else {
      // No query - use original behavior without ranking
      const total = await entriesCollection.countDocuments(filter);

      const results = await entriesCollection
        .find(filter)
        .sort({ name: 1 })
        .skip(offset)
        .limit(limit)
        .toArray();

      // Add score of 0 for consistency
      const scoredResults: ScoredEntry[] = results.map((entry) => ({
        ...entry,
        score: 0,
      }));

      return {
        statusCode: 200,
        body: JSON.stringify({
          results: scoredResults,
          total,
          limit,
          offset,
          query,
        } as SearchResponse),
        headers: {
          "Content-Type": "application/json",
        },
      };
    }
  } catch (error) {
    console.error("Error performing search:", error);

    // Handle database errors
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An error occurred while performing the search",
        },
      } as ErrorResponse),
      headers: {
        "Content-Type": "application/json",
      },
    };
  }
};
