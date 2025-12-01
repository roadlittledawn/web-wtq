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
        const authorObjectId = new ObjectId(authorId);

        // Use aggregation to get author with dynamic quote count
        const result = await authorsCollection
          .aggregate([
            {
              $match: { _id: authorObjectId },
            },
            {
              $lookup: {
                from: "entries",
                localField: "_id",
                foreignField: "authorId",
                as: "quotes",
              },
            },
            {
              $addFields: {
                quoteCount: { $size: "$quotes" },
              },
            },
            {
              $project: {
                quotes: 0,
              },
            },
          ])
          .toArray();

        author = result[0];
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

    // Build aggregation pipeline to calculate quote counts dynamically
    const pipeline: any[] = [];

    // Match stage for search filter
    if (searchQuery) {
      pipeline.push({
        $match: {
          $or: [
            { firstName: { $regex: searchQuery, $options: "i" } },
            { lastName: { $regex: searchQuery, $options: "i" } },
          ],
        },
      });
    }

    // Lookup stage to count quotes for each author
    pipeline.push({
      $lookup: {
        from: "entries",
        localField: "_id",
        foreignField: "authorId",
        as: "quotes",
      },
    });

    // Add computed quoteCount field
    pipeline.push({
      $addFields: {
        quoteCount: { $size: "$quotes" },
      },
    });

    // Remove the quotes array (we only need the count)
    pipeline.push({
      $project: {
        quotes: 0,
      },
    });

    // Sort stage
    if (sortParam === "name") {
      pipeline.push({
        $sort: { lastName: 1, firstName: 1 },
      });
    } else {
      // Default: sort by quote count descending, then by last name
      pipeline.push({
        $sort: { quoteCount: -1, lastName: 1, firstName: 1 },
      });
    }

    // Execute aggregation
    const authors = await authorsCollection.aggregate(pipeline).toArray();

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
