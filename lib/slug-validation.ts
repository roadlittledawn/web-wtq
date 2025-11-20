import { getDatabase } from "./mongodb";

/**
 * Check if a slug is unique in the database
 * Requirements: 10.4
 *
 * NOTE: This function uses MongoDB and should only be called from server-side code
 * (API routes, server components, or Netlify functions)
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
