import { Handler, HandlerEvent, HandlerResponse } from "@netlify/functions";
import { ObjectId } from "mongodb";
import { getDatabase } from "../../lib/mongodb";
import { Entry } from "../../types/models";

interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

interface ValidateSlugRequest {
  slug: string;
  excludeId?: string;
}

interface ValidateSlugResponse {
  isUnique: boolean;
  slug: string;
}

/**
 * GET /api/validate-slug
 * Check slug uniqueness in database with optional entry exclusion
 * Requirements: 10.4
 */
const validateSlugHandler = async (event: HandlerEvent): Promise<HandlerResponse> => {
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
    // Parse query parameters
    const params = event.queryStringParameters || {};
    const slug = params.slug;
    const excludeId = params.excludeId;

    // Validate required fields
    if (!slug || typeof slug !== "string") {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: {
            code: "INVALID_SLUG",
            message: "Slug is required and must be a string",
          },
        } as ErrorResponse),
        headers: {
          "Content-Type": "application/json",
        },
      };
    }

    // Validate excludeId if provided
    if (excludeId && !ObjectId.isValid(excludeId)) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: {
            code: "INVALID_EXCLUDE_ID",
            message: "excludeId must be a valid ObjectId",
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

    // Build query to check slug uniqueness
    const query: any = { slug };

    // Exclude specific entry ID if provided (for update operations)
    if (excludeId) {
      query._id = { $ne: new ObjectId(excludeId) };
    }

    // Check if slug exists
    const existingEntry = await entriesCollection.findOne(query);

    // Return uniqueness result
    return {
      statusCode: 200,
      body: JSON.stringify({
        isUnique: !existingEntry,
        slug,
      } as ValidateSlugResponse),
      headers: {
        "Content-Type": "application/json",
      },
    };
  } catch (error) {
    console.error("Error validating slug:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An error occurred while validating the slug",
        },
      } as ErrorResponse),
      headers: {
        "Content-Type": "application/json",
      },
    };
  }
};

// Export handler without authentication (read-only operation)
export const handler: Handler = validateSlugHandler;
