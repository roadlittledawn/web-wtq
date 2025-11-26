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

interface TagsResponse {
  tags: Tag[];
  total: number;
}

/**
 * GET /api/tags
 * Retrieve all tags with usage counts
 * Query parameters:
 *   - type: Filter tags by entry type (word, phrase, quote, hypothetical)
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
    const entryType = event.queryStringParameters?.type;

    // Get database connection
    const db = await getDatabase();

    if (entryType) {
      // When filtering by entry type, aggregate tags from entries collection
      const entriesCollection = db.collection("entries");

      // Aggregate to get unique tags used by this entry type with counts
      const tagAggregation = await entriesCollection
        .aggregate([
          { $match: { type: entryType } },
          { $unwind: "$tags" },
          {
            $group: {
              _id: "$tags",
              usageCount: { $sum: 1 },
            },
          },
          {
            $project: {
              _id: 0,
              name: "$_id",
              usageCount: 1,
            },
          },
          { $sort: { usageCount: -1, name: 1 } },
        ])
        .toArray();

      return {
        statusCode: 200,
        body: JSON.stringify({
          tags: tagAggregation,
          total: tagAggregation.length,
        } as TagsResponse),
        headers: {
          "Content-Type": "application/json",
        },
      };
    } else {
      // No filter - return all tags from tags collection
      const tagsCollection = db.collection<Tag>("tags");
      const tags = await tagsCollection
        .find({})
        .sort({ usageCount: -1, name: 1 })
        .toArray();

      return {
        statusCode: 200,
        body: JSON.stringify({
          tags,
          total: tags.length,
        } as TagsResponse),
        headers: {
          "Content-Type": "application/json",
        },
      };
    }
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
