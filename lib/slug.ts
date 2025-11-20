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
