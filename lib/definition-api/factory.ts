/**
 * Definition API Adapter Factory
 *
 * Creates the appropriate DefinitionAdapter based on environment configuration.
 * Allows swapping API providers without changing core business logic.
 */

import type { DefinitionAdapter } from "./adapter";
import { FreeDictionaryAdapter } from "./free-dictionary-adapter";

/**
 * Get the configured definition API adapter.
 *
 * Provider is selected from:
 * 1. Explicit provider parameter (highest priority)
 * 2. DEFINITION_API_PROVIDER environment variable
 * 3. Default: 'free-dictionary'
 *
 * @param provider - Optional provider name to override environment config
 * @returns Configured DefinitionAdapter instance
 * @throws Error if provider is unknown
 *
 * @example
 * ```typescript
 * // Use default provider from env
 * const adapter = getDefinitionAdapter();
 *
 * // Override with specific provider
 * const adapter = getDefinitionAdapter('free-dictionary');
 * ```
 */
export function getDefinitionAdapter(provider?: string): DefinitionAdapter {
  const selectedProvider =
    provider ||
    process.env.DEFINITION_API_PROVIDER ||
    "free-dictionary";

  switch (selectedProvider) {
    case "free-dictionary":
      return new FreeDictionaryAdapter();

    // Future providers can be added here:
    // case "merriam-webster":
    //   return new MerriamWebsterAdapter(process.env.MERRIAM_WEBSTER_API_KEY!);
    //
    // case "oxford":
    //   return new OxfordDictionaryAdapter(
    //     process.env.OXFORD_APP_ID!,
    //     process.env.OXFORD_APP_KEY!
    //   );

    default:
      throw new Error(
        `Unknown definition API provider: "${selectedProvider}". ` +
          `Supported providers: free-dictionary`
      );
  }
}
