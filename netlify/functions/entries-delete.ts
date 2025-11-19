import { Handler, HandlerContext } from "@netlify/functions";
import { ObjectId } from "mongodb";
import { getDatabase } from "../../lib/mongodb";
import { withAuth, AuthenticatedEvent } from "../../lib/auth-middleware";
import { Entry } from "../../types/models";
import { removeTagsFromEntry } from "../../lib/tag-management";

interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

interface DeleteResponse {
  success: boolean;
  message: string;
  deletedId: string;
}

/**
 * DELETE /api/entries/:id
 * Delete an entry with authentication
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */
const deleteEntryHandler = async (
  event: AuthenticatedEvent,
  context: HandlerContext
) => {
  // Only allow DELETE requests
  if (event.httpMethod !== "DELETE") {
    return {
      statusCode: 405,
      body: JSON.stringify({
        error: {
          code: "METHOD_NOT_ALLOWED",
          message: "Only DELETE requests are allowed",
        },
      } as ErrorResponse),
      headers: {
        "Content-Type": "application/json",
        Allow: "DELETE",
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

    // Get database connection
    const db = await getDatabase();
    const entriesCollection = db.collection<Entry>("entries");

    // Check if entry exists before deletion
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

    // Delete entry from database
    const deleteResult = await entriesCollection.deleteOne({
      _id: new ObjectId(entryId),
    });

    // Verify deletion was successful
    if (deleteResult.deletedCount === 0) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: {
            code: "DELETION_FAILED",
            message: "Failed to delete entry",
          },
        } as ErrorResponse),
        headers: {
          "Content-Type": "application/json",
        },
      };
    }

    // Remove tag associations and update usage counts
    await removeTagsFromEntry(db, existingEntry.tags || []);

    // Return confirmation of successful deletion
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "Entry deleted successfully",
        deletedId: entryId,
      } as DeleteResponse),
      headers: {
        "Content-Type": "application/json",
      },
    };
  } catch (error) {
    console.error("Error deleting entry:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An error occurred while deleting the entry",
        },
      } as ErrorResponse),
      headers: {
        "Content-Type": "application/json",
      },
    };
  }
};

// Export handler wrapped with authentication middleware
export const handler: Handler = withAuth(deleteEntryHandler);
