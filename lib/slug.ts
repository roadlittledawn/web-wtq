import { getDatabase } from "./mongodb";

/**
 * Generate a URL-friendly slug from text
 * Requirements: 10.1, 10.2
 *
 * @param text - The text to convert to a slug
 * @returns A lowercase slug with spaces replaced by hyphens and special characters removed
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase() // Convert to lowercase (Requirement 10.1)
    .replace(/\s+/g, "-") // Replace spaces with hyphens (Requirement 10.1)
    .replace(/[^a-z0-9-]/g, "") // Remove special characters except hyphens (Requirement 10.2)
    .replace(/-+/g, "-") // Replace multiple consecutive hyphens with single hyphen
    .replace(/^-|-$/g, ""); // Remove leading/trailing hyphens
}

/**
 * Check if a slug is unique in the database
 * Requirements: 10.4
 *
 * @param slug - The slug to check for uniqueness
 * @param excludeId - Optional entry ID to exclude from the check (for updates)
 * @returns True if the slug is unique, false if it already exists
 */
export async function isSlugUnique(
  slug: string,
  excludeId?: string
): Promise<boolean> {
  try {
    const db = await getDatabase();
    const entriesCollection = db.collection("entries");

    // Build query to check for existing slug
    const query: any = { slug };

    // If excludeId is provided, exclude that entry from the check
    // This allows updating an entry without conflicting with itself
    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const existingEntry = await entriesCollection.findOne(query);

    // Return true if no entry found (slug is unique)
    return existingEntry === null;
  } catch (error) {
    console.error("Error checking slug uniqueness:", error);
    throw new Error("Failed to validate slug uniqueness");
  }
}
