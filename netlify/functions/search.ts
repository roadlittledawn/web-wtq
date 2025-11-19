import { Handler, HandlerEvent, HandlerResponse } from "@netlify/functions";
import { getDatabase } from "../../lib/mongodb";
import { Entry } from "../../types/models";

interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

interface SearchResponse {
  results: Entry[];
  total: number;
  limit: number;
  offset: number;
  query: string;
}

/**
 * GET /api/search
 * Search entries with text query, type filtering, tag filtering, and pagination
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
    // Per Requirement 7.1: search 'name' field for word entries,
    // and 'body' field for phrase, quote, and hypothetical entries
    // Note: Phrase entries have 'name' not 'body', so we search 'name' for phrases too
    if (query) {
      const searchConditions: any[] = [];

      // For word entries: search in 'name' field
      searchConditions.push({
        type: "word",
        name: { $regex: query, $options: "i" },
      });

      // For phrase entries: search in 'name' field (phrases have name, not body)
      searchConditions.push({
        type: "phrase",
        name: { $regex: query, $options: "i" },
      });

      // For quote entries: search in 'body' field
      searchConditions.push({
        type: "quote",
        body: { $regex: query, $options: "i" },
      });

      // For hypothetical entries: search in 'body' field
      searchConditions.push({
        type: "hypothetical",
        body: { $regex: query, $options: "i" },
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

    // Get total count for pagination
    const total = await entriesCollection.countDocuments(filter);

    // Fetch search results with pagination
    // Sort by relevance (entries with name matches first, then by name)
    const results = await entriesCollection
      .find(filter)
      .sort({ name: 1 })
      .skip(offset)
      .limit(limit)
      .toArray();

    // Return success response
    return {
      statusCode: 200,
      body: JSON.stringify({
        results,
        total,
        limit,
        offset,
        query,
      } as SearchResponse),
      headers: {
        "Content-Type": "application/json",
      },
    };
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
