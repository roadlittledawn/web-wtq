import { Handler, HandlerEvent } from "@netlify/functions";
import { getDatabase } from "../../lib/mongodb";
import { Tag } from "../../types/models";

interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

interface TagsResponse {
  tags: Tag[];
  total: number;
}

/**
 * GET /api/tags
 * Retrieve all tags with usage counts
 */
export const handler: Handler = async (event: HandlerEvent) => {
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
    // Get database connection
    const db = await getDatabase();
    const tagsCollection = db.collection<Tag>("tags");

    // Fetch all tags sorted by usage count (descending) and then by name
    const tags = await tagsCollection
      .find({})
      .sort({ usageCount: -1, name: 1 })
      .toArray();

    const total = tags.length;

    // Return success response
    return {
      statusCode: 200,
      body: JSON.stringify({
        tags,
        total,
      } as TagsResponse),
      headers: {
        "Content-Type": "application/json",
      },
    };
  } catch (error) {
    console.error("Error fetching tags:", error);

    // Handle database errors
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An error occurred while fetching tags",
        },
      } as ErrorResponse),
      headers: {
        "Content-Type": "application/json",
      },
    };
  }
};
