/**
 * Free Dictionary API Adapter
 *
 * Fetches word definitions from the Free Dictionary API (https://dictionaryapi.dev/)
 *
 * Features:
 * - No API key required
 * - Free tier with reasonable rate limits
 * - Supports single words only (not phrases)
 * - Returns first definition from first meaning
 */

import type { DefinitionAdapter } from "./adapter";

/**
 * Response type from Free Dictionary API
 */
interface FreeDictionaryResponse {
  word: string;
  phonetic?: string;
  phonetics?: Array<{
    text?: string;
    audio?: string;
  }>;
  meanings: Array<{
    partOfSpeech: string;
    definitions: Array<{
      definition: string;
      example?: string;
      synonyms?: string[];
      antonyms?: string[];
    }>;
    synonyms?: string[];
    antonyms?: string[];
  }>;
  license?: {
    name: string;
    url: string;
  };
  sourceUrls?: string[];
}

/**
 * Error response when word is not found
 */
interface FreeDictionaryErrorResponse {
  title: string;
  message: string;
  resolution: string;
}

export class FreeDictionaryAdapter implements DefinitionAdapter {
  private readonly baseUrl = "https://api.dictionaryapi.dev/api/v2/entries/en";

  /**
   * Fetch definition for a single word from Free Dictionary API
   *
   * @param term - The word to look up (will be URL encoded)
   * @returns Definition string if found, null if not found
   * @throws Error if API request fails
   */
  async getDefinition(term: string): Promise<string | null> {
    // URL encode the term to handle spaces, apostrophes, foreign characters, etc.
    // Examples:
    // - "hello world" → "hello%20world"
    // - "can't" → "can%27t"
    // - "café" → "caf%C3%A9"
    const encodedTerm = encodeURIComponent(term.trim());

    const url = `${this.baseUrl}/${encodedTerm}`;

    console.log(`[FreeDictionary] Fetching definition for: "${term}"`);

    try {
      const response = await fetch(url);

      // Handle 404 - word not found
      if (response.status === 404) {
        console.log(`[FreeDictionary] Definition not found for: "${term}"`);
        return null;
      }

      // Handle other error status codes
      if (!response.ok) {
        throw new Error(
          `Free Dictionary API returned status ${response.status}: ${response.statusText}`
        );
      }

      // Parse response
      const data: FreeDictionaryResponse[] = await response.json();

      // Validate response structure
      if (!data || !Array.isArray(data) || data.length === 0) {
        console.warn(
          `[FreeDictionary] Unexpected response structure for: "${term}"`
        );
        return null;
      }

      // Extract first definition from first meaning
      const firstEntry = data[0];
      if (!firstEntry.meanings || firstEntry.meanings.length === 0) {
        console.warn(
          `[FreeDictionary] No meanings found for: "${term}"`
        );
        return null;
      }

      const firstMeaning = firstEntry.meanings[0];
      if (
        !firstMeaning.definitions ||
        firstMeaning.definitions.length === 0
      ) {
        console.warn(
          `[FreeDictionary] No definitions in first meaning for: "${term}"`
        );
        return null;
      }

      const definition = firstMeaning.definitions[0].definition;

      console.log(
        `[FreeDictionary] ✓ Found definition for: "${term}" (${definition.length} chars)`
      );

      return definition;
    } catch (error) {
      // Log the error but re-throw for caller to handle
      console.error(
        `[FreeDictionary] API error for "${term}":`,
        error instanceof Error ? error.message : String(error)
      );
      throw error;
    }
  }

  /**
   * Get adapter name for tracking
   */
  getName(): string {
    return "free-dictionary";
  }

  /**
   * Check if this adapter supports the given entry type
   *
   * Free Dictionary API only supports single words, not phrases
   */
  supportsType(type: "word" | "phrase"): boolean {
    return type === "word";
  }
}
