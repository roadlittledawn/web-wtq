import { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import { verifyToken } from "./auth";

interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export interface AuthenticatedEvent extends HandlerEvent {
  user?: {
    userId: string;
    username: string;
  };
}

/**
 * Extract JWT token from Authorization header
 * @param event - Netlify function event
 * @returns The extracted token or null if not found
 */
function extractToken(event: HandlerEvent): string | null {
  const authHeader = event.headers.authorization || event.headers.Authorization;

  if (!authHeader) {
    return null;
  }

  // Check if header follows "Bearer <token>" format
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return null;
  }

  return parts[1];
}

/**
 * Middleware to verify JWT token and authenticate requests
 * Validates token from Authorization header and attaches user info to event
 *
 * @param handler - The handler function to wrap with authentication
 * @returns Wrapped handler that requires authentication
 *
 * Requirements: 11.1, 11.2, 11.3, 11.4
 */
export function withAuth(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: (event: AuthenticatedEvent, context: HandlerContext) => Promise<any>
): Handler {
  return async (event: HandlerEvent, context: HandlerContext) => {
    try {
      // Extract token from Authorization header
      const token = extractToken(event);

      // Handle missing token
      if (!token) {
        return {
          statusCode: 401,
          body: JSON.stringify({
            error: {
              code: "MISSING_TOKEN",
              message: "Authorization token is required",
            },
          } as ErrorResponse),
          headers: {
            "Content-Type": "application/json",
          },
        };
      }

      // Verify and decode token
      let decoded: { userId: string; username: string };
      try {
        decoded = verifyToken(token) as { userId: string; username: string };
      } catch (error: unknown) {
        // Handle expired token
        if (error instanceof Error && error.name === "TokenExpiredError") {
          return {
            statusCode: 401,
            body: JSON.stringify({
              error: {
                code: "TOKEN_EXPIRED",
                message: "Authorization token has expired",
              },
            } as ErrorResponse),
            headers: {
              "Content-Type": "application/json",
            },
          };
        }

        // Handle invalid token (JsonWebTokenError, NotBeforeError, etc.)
        return {
          statusCode: 401,
          body: JSON.stringify({
            error: {
              code: "INVALID_TOKEN",
              message: "Authorization token is invalid",
            },
          } as ErrorResponse),
          headers: {
            "Content-Type": "application/json",
          },
        };
      }

      // Attach user information to event
      const authenticatedEvent: AuthenticatedEvent = {
        ...event,
        user: {
          userId: decoded.userId,
          username: decoded.username,
        },
      };

      // Call the wrapped handler with authenticated event
      return handler(authenticatedEvent, context);
    } catch (error) {
      console.error("Authentication middleware error:", error);

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
}
