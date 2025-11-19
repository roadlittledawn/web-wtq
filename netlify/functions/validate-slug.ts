import { Handler, HandlerContext } from "@netlify/functions";
import { ObjectId } from "mongodb";
import { getDatabase } from "../../lib/mongodb";
import { withAuth, AuthenticatedEvent } from "../../lib/auth-middleware";
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
 * POST /api/validate-slug
 * Check slug uniqueness in database with optional entry exclusion
 * Requirements: 10.4
 */
const validateSlugHandler = async (
  event: AuthenticatedEvent,
  context: HandlerContext
) => {
  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({
        error: {
          code: "METHOD_NOT_ALLOWED",
          message: "Only POST requests are allowed",
        },
      } as ErrorResponse),
      headers: {
        "Content-Type": "application/json",
        Allow: "POST",
      },
    };
  }

  try {
    // Parse request body
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: {
            code: "MISSING_BODY",
            message: "Request body is required",
          },
        } as ErrorResponse),
        headers: {
          "Content-Type": "application/json",
        },
      };
    }

    let requestData: ValidateSlugRequest;
    try {
      requestData = JSON.parse(event.body);
    } catch (error) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: {
            code: "INVALID_JSON",
            message: "Request body must be valid JSON",
          },
        } as ErrorResponse),
        headers: {
          "Content-Type": "application/json",
        },
      };
    }

    // Validate required fields
    if (!requestData.slug || typeof requestData.slug !== "string") {
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
    if (requestData.excludeId && !ObjectId.isValid(requestData.excludeId)) {
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
    const query: any = { slug: requestData.slug };

    // Exclude specific entry ID if provided (for update operations)
    if (requestData.excludeId) {
      query._id = { $ne: new ObjectId(requestData.excludeId) };
    }

    // Check if slug exists
    const existingEntry = await entriesCollection.findOne(query);

    // Return uniqueness result
    return {
      statusCode: 200,
      body: JSON.stringify({
        isUnique: !existingEntry,
        slug: requestData.slug,
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

// Export handler wrapped with authentication middleware
export const handler: Handler = withAuth(validateSlugHandler);
