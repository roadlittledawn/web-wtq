import { Handler, HandlerContext, HandlerResponse } from "@netlify/functions";
import { ObjectId } from "mongodb";
import { getDatabase } from "../../lib/mongodb";
import { withAuth, AuthenticatedEvent } from "../../lib/auth-middleware";
import { validateEntrySafe } from "../../lib/validation";
import { Entry } from "../../types/models";
import { syncTags } from "../../lib/tag-management";

interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

/**
 * POST /api/entries
 * Create a new entry with authentication
 * Requirements: 2.1, 2.6, 2.7, 2.8
 */
const createEntryHandler = async (
  event: AuthenticatedEvent,
  context: HandlerContext
): Promise<HandlerResponse> => {
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

    let entryData: any;
    try {
      entryData = JSON.parse(event.body);
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

    // Validate entry data against schema
    const validationResult = validateEntrySafe(entryData);

    if (!validationResult.success) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: {
            code: "VALIDATION_ERROR",
            message: "Entry data validation failed",
            details: validationResult.error.errors.map((err) => ({
              path: err.path.join("."),
              message: err.message,
            })),
          },
        } as ErrorResponse),
        headers: {
          "Content-Type": "application/json",
        },
      };
    }

    const validatedData = validationResult.data;

    // Get database connection
    const db = await getDatabase();

    // Convert authorId string to ObjectId and fetch author name for quote entries
    if (validatedData.type === "quote" && validatedData.authorId) {
      try {
        const authorObjectId = new ObjectId(validatedData.authorId);
        (validatedData as any).authorId = authorObjectId;

        // Fetch author to get the name for denormalization
        const authorsCollection = db.collection("authors");
        const author = await authorsCollection.findOne({ _id: authorObjectId });

        if (author) {
          // Denormalize author name for display
          const authorName = author.firstName
            ? `${author.lastName}, ${author.firstName}`
            : author.lastName;
          (validatedData as any).author = authorName;
        }
      } catch (error) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            error: {
              code: "INVALID_AUTHOR_ID",
              message: "Invalid author ID format",
            },
          } as ErrorResponse),
          headers: {
            "Content-Type": "application/json",
          },
        };
      }
    }
    const entriesCollection = db.collection<Entry>("entries");

    // Check if slug already exists
    const existingEntry = await entriesCollection.findOne({
      slug: validatedData.slug,
    });

    if (existingEntry) {
      return {
        statusCode: 409,
        body: JSON.stringify({
          error: {
            code: "DUPLICATE_SLUG",
            message: "An entry with this slug already exists",
            details: { slug: validatedData.slug },
          },
        } as ErrorResponse),
        headers: {
          "Content-Type": "application/json",
        },
      };
    }

    // Generate unique ID and timestamps
    const now = new Date();
    const newEntry: Entry = {
      _id: new ObjectId(),
      ...validatedData,
      createdAt: now,
      updatedAt: now,
    } as Entry;

    // Store entry in database
    await entriesCollection.insertOne(newEntry);

    // Sync tags (create new tags and update usage counts)
    await syncTags(db, validatedData.tags || [], []);

    // Return created entry
    return {
      statusCode: 201,
      body: JSON.stringify(newEntry),
      headers: {
        "Content-Type": "application/json",
      },
    };
  } catch (error) {
    console.error("Error creating entry:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An error occurred while creating the entry",
        },
      } as ErrorResponse),
      headers: {
        "Content-Type": "application/json",
      },
    };
  }
};

// Export handler wrapped with authentication middleware
export const handler: Handler = withAuth(createEntryHandler);
