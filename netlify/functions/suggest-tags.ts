import { Handler, HandlerEvent, HandlerResponse } from "@netlify/functions";
import Anthropic from "@anthropic-ai/sdk";
import { getDatabase } from "../../lib/mongodb";
import { Tag } from "../../types/models";

interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

interface SuggestTagsRequest {
  body: string;
  type: "quote" | "phrase" | "hypothetical";
  author?: string;
  source?: string;
}

interface SuggestTagsResponse {
  tags: string[];
}

/**
 * POST /.netlify/functions/suggest-tags
 * Use AI to suggest relevant tags for a quote, phrase, or hypothetical
 */
export const handler: Handler = async (
  event: HandlerEvent
): Promise<HandlerResponse> => {
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
            code: "BAD_REQUEST",
            message: "Request body is required",
          },
        } as ErrorResponse),
        headers: {
          "Content-Type": "application/json",
        },
      };
    }

    const request: SuggestTagsRequest = JSON.parse(event.body);

    if (!request.body || !request.type) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: {
            code: "BAD_REQUEST",
            message: "body and type fields are required",
          },
        } as ErrorResponse),
        headers: {
          "Content-Type": "application/json",
        },
      };
    }

    // Get existing tags from database
    const db = await getDatabase();
    const tagsCollection = db.collection<Tag>("tags");
    const existingTags = await tagsCollection
      .find({})
      .sort({ usageCount: -1 })
      .limit(100) // Get top 100 most used tags
      .toArray();

    const existingTagNames = existingTags.map((tag) => tag.name);

    // Initialize Anthropic client
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error("ANTHROPIC_API_KEY not found in environment");
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: {
            code: "CONFIGURATION_ERROR",
            message: "AI service is not configured",
          },
        } as ErrorResponse),
        headers: {
          "Content-Type": "application/json",
        },
      };
    }

    const anthropic = new Anthropic({
      apiKey: apiKey,
    });

    // Build context for AI
    let contextInfo = "";
    if (request.type === "quote" && request.author) {
      contextInfo = `\nAuthor: ${request.author}`;
    }
    if (request.source) {
      contextInfo += `\nSource: ${request.source}`;
    }

    // Create AI prompt
    const prompt = `Analyze this ${request.type} and suggest 3-6 relevant tags.${contextInfo}

${request.type === "quote" ? "Quote" : request.type === "phrase" ? "Phrase" : "Hypothetical"}: "${request.body}"

IMPORTANT: Prefer using existing tags from this list when relevant:
${existingTagNames.join(", ")}

Only suggest tags you're highly confident about. Consider these categories:
- Topics/themes (e.g., politics, cats, philosophy, nature, technology)
- Tone (e.g., funny, serious, ironic, sarcastic, motivating, insult)
- Origin (e.g., French, Latin, Biblical, Shakespearean, modern)
- Context (e.g., historical, academic, popular culture)
- Style (e.g., metaphorical, rhetorical, literal)

Return ONLY a valid JSON object in this exact format with no additional text:
{"tags": ["tag1", "tag2", "tag3"]}

Use lowercase for all tags. Maximum 6 tags. Only include tags you're confident about.`;

    // Call Anthropic API
    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    // Parse AI response
    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    let suggestedTags: string[] = [];
    try {
      const parsed = JSON.parse(responseText);
      suggestedTags = parsed.tags || [];
    } catch (parseError) {
      console.error("Failed to parse AI response:", responseText);
      // Fallback: try to extract tags from text
      const tagMatch = responseText.match(/\[([^\]]+)\]/);
      if (tagMatch) {
        suggestedTags = tagMatch[1]
          .split(",")
          .map((t) => t.trim().replace(/"/g, ""));
      }
    }

    // Ensure tags are lowercase and unique
    suggestedTags = Array.from(new Set(suggestedTags.map((tag) => tag.toLowerCase())));

    // Limit to 6 tags
    suggestedTags = suggestedTags.slice(0, 6);

    return {
      statusCode: 200,
      body: JSON.stringify({
        tags: suggestedTags,
      } as SuggestTagsResponse),
      headers: {
        "Content-Type": "application/json",
      },
    };
  } catch (error) {
    console.error("Error suggesting tags:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An error occurred while suggesting tags",
          details: error instanceof Error ? error.message : "Unknown error",
        },
      } as ErrorResponse),
      headers: {
        "Content-Type": "application/json",
      },
    };
  }
};
