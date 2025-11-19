import { Handler, HandlerEvent, HandlerResponse } from "@netlify/functions";
import { getDatabase } from "../../lib/mongodb";
import { Entry } from "../../types/models";
import { ObjectId } from "mongodb";

interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

interface EntriesResponse {
  entries: Entry[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * GET /api/entries
 * Retrieve entries with pagination, filtering, and sorting
 * Also supports fetching a single entry by ID
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

    // Check if fetching a single entry by ID
    if (params.id) {
      const db = await getDatabase();
      const entriesCollection = db.collection<Entry>("entries");

      let entry;
      try {
        entry = await entriesCollection.findOne({
          _id: new ObjectId(params.id),
        });
      } catch (err) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            error: {
              code: "INVALID_ID",
              message: "Invalid entry ID format",
            },
          } as ErrorResponse),
          headers: {
            "Content-Type": "application/json",
          },
        };
      }

      if (!entry) {
        return {
          statusCode: 404,
          body: JSON.stringify({
            error: {
              code: "ENTRY_NOT_FOUND",
              message: "Entry not found",
            },
          } as ErrorResponse),
          headers: {
            "Content-Type": "application/json",
          },
        };
      }

      return {
        statusCode: 200,
        body: JSON.stringify(entry),
        headers: {
          "Content-Type": "application/json",
        },
      };
    }
    const limit = Math.min(parseInt(params.limit || "30", 10), 100); // Max 100 items per page
    const offset = parseInt(params.offset || "0", 10);
    const type = params.type as
      | "word"
      | "phrase"
      | "quote"
      | "hypothetical"
      | undefined;
    const letter = params.letter?.toUpperCase();
    const sortBy = params.sortBy || "name"; // Default sort by name

    // Parse tags parameter - can be a single tag or comma-separated list
    const tagsParam = params.tags;
    let tags: string[] = [];
    if (tagsParam) {
      tags = tagsParam
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);
    }

    // Build query filter
    const filter: any = {};

    // Filter by type if provided
    if (type) {
      if (!["word", "phrase", "quote", "hypothetical"].includes(type)) {
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
      filter.type = type;
    }

    // Filter by first letter if provided (only for entries with 'name' field)
    if (letter) {
      if (!/^[A-Z]$/.test(letter)) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            error: {
              code: "INVALID_LETTER",
              message: "Letter must be a single uppercase letter A-Z",
            },
          } as ErrorResponse),
          headers: {
            "Content-Type": "application/json",
          },
        };
      }
      // Letter filter only applies to entries with 'name' field
      filter.name = { $regex: `^${letter}`, $options: "i" };
    }

    // Filter by tags if provided (AND logic - entry must have ALL specified tags)
    if (tags.length > 0) {
      filter.tags = { $all: tags };
    }

    // Build sort options
    const sortOptions: any = {};
    if (sortBy === "name") {
      sortOptions.name = 1;
    } else if (sortBy === "author") {
      sortOptions.author = 1;
    } else if (sortBy === "createdAt") {
      sortOptions.createdAt = -1; // Newest first
    } else if (sortBy === "updatedAt") {
      sortOptions.updatedAt = -1; // Most recently updated first
    } else {
      sortOptions.name = 1; // Default to name
    }

    // Get database connection
    const db = await getDatabase();
    const entriesCollection = db.collection<Entry>("entries");

    // Get total count for pagination
    const total = await entriesCollection.countDocuments(filter);

    // Fetch entries with pagination and sorting
    const entries = await entriesCollection
      .find(filter)
      .sort(sortOptions)
      .skip(offset)
      .limit(limit)
      .toArray();

    // Return success response
    return {
      statusCode: 200,
      body: JSON.stringify({
        entries,
        total,
        limit,
        offset,
      } as EntriesResponse),
      headers: {
        "Content-Type": "application/json",
      },
    };
  } catch (error) {
    console.error("Error fetching entries:", error);

    // Handle database errors
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An error occurred while fetching entries",
        },
      } as ErrorResponse),
      headers: {
        "Content-Type": "application/json",
      },
    };
  }
};
