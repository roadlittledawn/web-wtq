import { Handler, HandlerEvent, HandlerResponse } from "@netlify/functions";
import { getDatabase } from "../../lib/mongodb";
import { Author } from "../../types/models";

interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

interface AuthorsResponse {
  authors: Author[];
  total: number;
}

/**
 * GET /api/authors
 * Retrieve all authors with quote counts
 * Query parameters:
 *   - q: Search query to filter authors by name
 *   - sort: Sort order (name, quoteCount) - default: quoteCount descending
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
    // Get query parameters
    const authorId = event.queryStringParameters?.id;
    const searchQuery = event.queryStringParameters?.q;
    const sortParam = event.queryStringParameters?.sort || "quoteCount";

    // Get database connection
    const db = await getDatabase();
    const authorsCollection = db.collection<Author>("authors");

    // If fetching a single author by ID
    if (authorId) {
      let author;
      try {
        const { ObjectId } = await import("mongodb");
        author = await authorsCollection.findOne({
          _id: new ObjectId(authorId),
        });
      } catch (err) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            error: {
              code: "INVALID_ID",
              message: "Invalid author ID format",
            },
          } as ErrorResponse),
          headers: {
            "Content-Type": "application/json",
          },
        };
      }

      if (!author) {
        return {
          statusCode: 404,
          body: JSON.stringify({
            error: {
              code: "AUTHOR_NOT_FOUND",
              message: "Author not found",
            },
          } as ErrorResponse),
          headers: {
            "Content-Type": "application/json",
          },
        };
      }

      return {
        statusCode: 200,
        body: JSON.stringify(author),
        headers: {
          "Content-Type": "application/json",
        },
      };
    }

    // Build query filter
    const filter: any = {};
    if (searchQuery) {
      // Case-insensitive search on firstName or lastName
      filter.$or = [
        { firstName: { $regex: searchQuery, $options: "i" } },
        { lastName: { $regex: searchQuery, $options: "i" } },
      ];
    }

    // Build sort order
    let sort: any = {};
    if (sortParam === "name") {
      // Sort by last name, then first name
      sort = { lastName: 1, firstName: 1 };
    } else {
      // Default: sort by quote count descending, then by last name
      sort = { quoteCount: -1, lastName: 1, firstName: 1 };
    }

    // Fetch authors
    const authors = await authorsCollection.find(filter).sort(sort).toArray();

    const total = authors.length;

    // Return success response
    return {
      statusCode: 200,
      body: JSON.stringify({
        authors,
        total,
      } as AuthorsResponse),
      headers: {
        "Content-Type": "application/json",
      },
    };
  } catch (error) {
    console.error("Error fetching authors:", error);

    // Handle database errors
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An error occurred while fetching authors",
        },
      } as ErrorResponse),
      headers: {
        "Content-Type": "application/json",
      },
    };
  }
};
