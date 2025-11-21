import { Handler, HandlerEvent, HandlerResponse } from "@netlify/functions";
import { getDatabase } from "../../lib/mongodb";
import { Tag } from "../../types/models";

interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

interface TagAutocompleteResponse {
  tags: Tag[];
  total: number;
}

/**
 * GET /api/tags/autocomplete
 * Query tags collection for partial matches
 * Returns matching tags sorted by usage count
 * Requirements: 9.1
 */
export const handler: Handler = async (event: HandlerEvent): Promise<HandlerResponse> => {
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
        "Allow": "GET",
      },
    };
  }

  try {
    // Get query parameter for partial match
    const query = event.queryStringParameters?.q || "";

    // Get database connection
    const db = await getDatabase();
    const tagsCollection = db.collection<Tag>("tags");

    // Build query for partial match (case-insensitive)
    const searchQuery = query ? { name: { $regex: query, $options: "i" } } : {};

    // Fetch matching tags sorted by usage count (descending) and then by name
    const tags = await tagsCollection
      .find(searchQuery)
      .sort({ usageCount: -1, name: 1 })
      .limit(20) // Limit to 20 suggestions
      .toArray();

    const total = tags.length;

    // Return success response
    return {
      statusCode: 200,
      body: JSON.stringify({
        tags,
        total,
      } as TagAutocompleteResponse),
      headers: {
        "Content-Type": "application/json",
      },
    };
  } catch (error) {
    console.error("Error fetching tag autocomplete:", error);

    // Handle database errors
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An error occurred while fetching tag suggestions",
        },
      } as ErrorResponse),
      headers: {
        "Content-Type": "application/json",
      },
    };
  }
};
