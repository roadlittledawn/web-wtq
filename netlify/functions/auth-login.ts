import { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import { getDatabase } from "../../lib/mongodb";
import { verifyPassword, generateToken } from "../../lib/auth";
import { User } from "../../types/models";

interface LoginRequest {
  username: string;
  password: string;
}

interface LoginResponse {
  token: string;
  expiresAt: string;
}

interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

/**
 * POST /api/auth/login
 * Authenticate user and return JWT token
 */
export const handler: Handler = async (
  event: HandlerEvent,
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

    const { username, password }: LoginRequest = JSON.parse(event.body);

    // Validate required fields
    if (!username || !password) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: {
            code: "MISSING_CREDENTIALS",
            message: "Username and password are required",
          },
        } as ErrorResponse),
        headers: {
          "Content-Type": "application/json",
        },
      };
    }

    // Get database connection
    const db = await getDatabase();
    const usersCollection = db.collection<User>("users");

    // Find user by username
    const user = await usersCollection.findOne({ username });

    if (!user) {
      return {
        statusCode: 401,
        body: JSON.stringify({
          error: {
            code: "INVALID_CREDENTIALS",
            message: "Invalid username or password",
          },
        } as ErrorResponse),
        headers: {
          "Content-Type": "application/json",
        },
      };
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.passwordHash);

    if (!isPasswordValid) {
      return {
        statusCode: 401,
        body: JSON.stringify({
          error: {
            code: "INVALID_CREDENTIALS",
            message: "Invalid username or password",
          },
        } as ErrorResponse),
        headers: {
          "Content-Type": "application/json",
        },
      };
    }

    // Generate JWT token
    const token = generateToken({
      userId: user._id.toString(),
      username: user.username,
    });

    // Calculate expiration time (24 hours from now)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    // Return success response
    return {
      statusCode: 200,
      body: JSON.stringify({
        token,
        expiresAt,
      } as LoginResponse),
      headers: {
        "Content-Type": "application/json",
      },
    };
  } catch (error) {
    console.error("Login error:", error);

    // Handle JSON parse errors
    if (error instanceof SyntaxError) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: {
            code: "INVALID_JSON",
            message: "Invalid JSON in request body",
          },
        } as ErrorResponse),
        headers: {
          "Content-Type": "application/json",
        },
      };
    }

    // Handle database errors
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An error occurred during authentication",
        },
      } as ErrorResponse),
      headers: {
        "Content-Type": "application/json",
      },
    };
  }
};
