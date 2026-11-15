import { Handler } from "@netlify/functions";
import { authenticate, ADMIN_ROLE } from "../../lib/auth-middleware";

/**
 * GET /.netlify/functions/auth-me
 * The signed-in user's identity and roles on this app, from the clang-auth
 * access-token cookie. 401 when signed out or the token expired (the client
 * then refreshes), 403 when signed in without a grant for this app.
 */
export const handler: Handler = async (event) => {
  const headers = { "Content-Type": "application/json", "Cache-Control": "no-store" };
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers: { ...headers, Allow: "GET" },
      body: JSON.stringify({ error: { code: "METHOD_NOT_ALLOWED", message: "Only GET requests are allowed" } }),
    };
  }
  try {
    const result = await authenticate(event);
    if (!result.ok) {
      return {
        statusCode: result.statusCode,
        headers,
        body: JSON.stringify({ error: { code: result.code, message: result.message } }),
      };
    }
    const { sub, email, name } = result.claims;
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        user: { sub, email, name, roles: result.roles, isAdmin: result.roles.includes(ADMIN_ROLE) },
      }),
    };
  } catch (error) {
    console.error("auth-me error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: { code: "INTERNAL_SERVER_ERROR", message: "An error occurred during authentication" } }),
    };
  }
};
