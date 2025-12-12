/**
 * Definition API Adapter Interface
 *
 * Provides a common interface for fetching word/phrase definitions
 * from various external dictionary APIs.
 */

export interface DefinitionAdapter {
  /**
   * Fetch the definition for a word or phrase.
   *
   * @param term - The word or phrase to look up
   * @returns The definition string if found, null if not found
   * @throws Error if API request fails (network error, server error, etc.)
   */
  getDefinition(term: string): Promise<string | null>;

  /**
   * Get the name of this adapter for logging and tracking purposes.
   *
   * @returns Adapter name (e.g., "free-dictionary", "merriam-webster")
   */
  getName(): string;

  /**
   * Check if this adapter supports lookups for the given entry type.
   *
   * @param type - Entry type ('word' or 'phrase')
   * @returns true if this adapter can handle the type
   */
  supportsType(type: "word" | "phrase"): boolean;
}
