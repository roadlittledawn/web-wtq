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
 * PUT /api/entries/:id
 * Update an existing entry with authentication
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */
const updateEntryHandler = async (
  event: AuthenticatedEvent,
  context: HandlerContext
): Promise<HandlerResponse> => {
  // Only allow PUT requests
  if (event.httpMethod !== "PUT") {
    return {
      statusCode: 405,
      body: JSON.stringify({
        error: {
          code: "METHOD_NOT_ALLOWED",
          message: "Only PUT requests are allowed",
        },
      } as ErrorResponse),
      headers: {
        "Content-Type": "application/json",
        Allow: "PUT",
      },
    };
  }

  try {
    // Extract entry ID from path
    const pathParts = event.path.split("/");
    const entryId = pathParts[pathParts.length - 1];

    if (!entryId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: {
            code: "MISSING_ID",
            message: "Entry ID is required",
          },
        } as ErrorResponse),
        headers: {
          "Content-Type": "application/json",
        },
      };
    }

    // Validate ObjectId format
    if (!ObjectId.isValid(entryId)) {
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

    // Convert authorId string to ObjectId for quote entries
    if (validatedData.type === "quote" && validatedData.authorId) {
      try {
        (validatedData as any).authorId = new ObjectId(validatedData.authorId);
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

    // Get database connection
    const db = await getDatabase();
    const entriesCollection = db.collection<Entry>("entries");

    // Check if entry exists
    const existingEntry = await entriesCollection.findOne({
      _id: new ObjectId(entryId),
    });

    if (!existingEntry) {
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

    // Check if slug is being changed and if new slug already exists
    if (validatedData.slug !== existingEntry.slug) {
      const slugExists = await entriesCollection.findOne({
        slug: validatedData.slug,
        _id: { $ne: new ObjectId(entryId) },
      });

      if (slugExists) {
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
    }

    // Update entry in database
    const updatedEntry: Entry = {
      ...existingEntry,
      ...validatedData,
      _id: existingEntry._id,
      createdAt: existingEntry.createdAt,
      updatedAt: new Date(),
    } as Entry;

    await entriesCollection.replaceOne(
      { _id: new ObjectId(entryId) },
      updatedEntry
    );

    // Sync tags (handle added and removed tags)
    await syncTags(db, validatedData.tags || [], existingEntry.tags || []);

    // Return updated entry
    return {
      statusCode: 200,
      body: JSON.stringify(updatedEntry),
      headers: {
        "Content-Type": "application/json",
      },
    };
  } catch (error) {
    console.error("Error updating entry:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An error occurred while updating the entry",
        },
      } as ErrorResponse),
      headers: {
        "Content-Type": "application/json",
      },
    };
  }
};

// Export handler wrapped with authentication middleware
export const handler: Handler = withAuth(updateEntryHandler);
