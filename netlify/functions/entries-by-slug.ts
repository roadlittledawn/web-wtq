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

/**
 * GET /api/entries/:slug
 * Retrieve a single entry by its slug
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
    // Extract slug from path
    // Path will be like /.netlify/functions/entries-by-slug/my-slug
    const path = event.path;
    const slug = path.split("/").pop();

    if (!slug) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: {
            code: "MISSING_SLUG",
            message: "Slug parameter is required",
          },
        } as ErrorResponse),
        headers: {
          "Content-Type": "application/json",
        },
      };
    }

    // Get database connection
    const db = await getDatabase();
    const entriesCollection = db.collection<Entry>("entries");

    // Find entry by slug
    const entry = await entriesCollection.findOne({ slug });

    if (!entry) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          error: {
            code: "ENTRY_NOT_FOUND",
            message: `Entry with slug '${slug}' not found`,
          },
        } as ErrorResponse),
        headers: {
          "Content-Type": "application/json",
        },
      };
    }

    // Return success response
    return {
      statusCode: 200,
      body: JSON.stringify(entry),
      headers: {
        "Content-Type": "application/json",
      },
    };
  } catch (error) {
    console.error("Error fetching entry by slug:", error);

    // Handle database errors
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An error occurred while fetching the entry",
        },
      } as ErrorResponse),
      headers: {
        "Content-Type": "application/json",
      },
    };
  }
};
