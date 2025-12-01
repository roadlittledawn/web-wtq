import { Handler, HandlerEvent, HandlerResponse } from "@netlify/functions";
import { ObjectId } from "mongodb";
import { getDatabase } from "../../lib/mongodb";
import { withAuth, AuthenticatedEvent } from "../../lib/auth-middleware";
import { Author } from "../../types/models";

interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

interface CreateAuthorResponse {
  author: Author;
  message: string;
}

/**
 * Parse author name into first and last name
 * Handles formats: "LastName, FirstName" or "FirstName LastName" or "SingleName"
 */
function parseAuthorName(name: string): {
  firstName: string;
  lastName: string;
} {
  if (!name || typeof name !== "string") {
    return { firstName: "", lastName: "" };
  }

  const trimmedName = name.trim();

  // Check if name contains a comma (format: "LastName, FirstName")
  if (trimmedName.includes(",")) {
    const parts = trimmedName.split(",").map((p) => p.trim());
    return {
      lastName: parts[0] || "",
      firstName: parts[1] || "",
    };
  }

  // Check if name has multiple words (format: "FirstName LastName")
  const words = trimmedName.split(/\s+/);
  if (words.length >= 2) {
    // Last word is last name, everything else is first name
    return {
      firstName: words.slice(0, -1).join(" "),
      lastName: words[words.length - 1],
    };
  }

  // Single word name - treat as last name
  return {
    firstName: "",
    lastName: trimmedName,
  };
}

/**
 * Generate slug from author name
 */
function generateSlug(firstName: string, lastName: string): string {
  const fullName = firstName ? `${firstName} ${lastName}` : lastName;
  return fullName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * POST /api/authors-create
 * Create a new author with authentication
 */
const createAuthorHandler = async (
  event: AuthenticatedEvent,
  context: any
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
    const body = JSON.parse(event.body || "{}");
    const { name } = body;

    // Validate input
    if (!name || typeof name !== "string" || !name.trim()) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: {
            code: "INVALID_INPUT",
            message: "Author name is required",
          },
        } as ErrorResponse),
        headers: {
          "Content-Type": "application/json",
        },
      };
    }

    // Parse name into firstName and lastName
    const { firstName, lastName } = parseAuthorName(name);

    // Generate slug
    const slug = generateSlug(firstName, lastName);

    // Get database connection
    const db = await getDatabase();
    const authorsCollection = db.collection<Author>("authors");

    // Check if author already exists (by slug)
    const existingAuthor = await authorsCollection.findOne({ slug });
    if (existingAuthor) {
      return {
        statusCode: 409,
        body: JSON.stringify({
          error: {
            code: "AUTHOR_EXISTS",
            message: "An author with this name already exists",
            details: { existingAuthor },
          },
        } as ErrorResponse),
        headers: {
          "Content-Type": "application/json",
        },
      };
    }

    // Create new author
    const newAuthor: Author = {
      _id: new ObjectId(),
      firstName,
      lastName,
      slug,
      bio: "",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await authorsCollection.insertOne(newAuthor);

    // Return success response
    return {
      statusCode: 201,
      body: JSON.stringify({
        author: newAuthor,
        message: "Author created successfully",
      } as CreateAuthorResponse),
      headers: {
        "Content-Type": "application/json",
      },
    };
  } catch (error) {
    console.error("Error creating author:", error);

    // Handle database errors
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An error occurred while creating the author",
        },
      } as ErrorResponse),
      headers: {
        "Content-Type": "application/json",
      },
    };
  }
};

export const handler: Handler = withAuth(createAuthorHandler);
