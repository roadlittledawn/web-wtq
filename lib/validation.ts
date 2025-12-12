import { z } from "zod";

/**
 * Base schema for all entry types with common fields
 */
const baseEntrySchema = z.object({
  slug: z.string().min(1, "Slug is required"),
  tags: z.array(z.string()).default([]),
});

/**
 * Schema for Word entries
 * Requirements: 2.2
 */
export const wordEntrySchema = baseEntrySchema.extend({
  type: z.literal("word"),
  name: z.string().min(1, "Name is required"),
  definition: z.string().optional(),

  // API-sourced definition tracking fields
  definitionSource: z.enum(["manual", "api"]).optional(),
  apiProvider: z.string().optional(),
  apiLookupStatus: z.enum(["found", "not_found", "error"]).optional(),
  apiLookupAttemptedAt: z.date().optional(),

  partOfSpeech: z.string().optional(),
  etymology: z.string().optional(),
  notes: z.string().optional(),
});

/**
 * Schema for Phrase entries
 * Requirements: 2.3
 */
export const phraseEntrySchema = baseEntrySchema.extend({
  type: z.literal("phrase"),
  body: z.string().min(1, "Phrase text is required"),
  definition: z.string().optional(),
  source: z.string().optional(),
  notes: z.string().optional(),
});

/**
 * Base schema for Quote entries (without refinement for discriminated union)
 * Requirements: 2.4
 */
const quoteEntryBaseSchema = baseEntrySchema.extend({
  type: z.literal("quote"),
  name: z.string().optional(),
  body: z.string().min(1, "Body is required"),
  author: z.string().optional(), // Legacy field for backward compatibility
  authorId: z.string().optional(), // Reference to Author document
  source: z.string().optional(),
  notes: z.string().optional(),
});

/**
 * Quote entry schema with refinement for validation
 */
export const quoteEntrySchema = quoteEntryBaseSchema.refine(
  (data) => {
    // At least one of author or authorId must be provided
    return (
      (data.author && data.author.trim()) ||
      (data.authorId && data.authorId.trim())
    );
  },
  {
    message: "Author is required",
    path: ["author"], // Show error on author field
  }
);

/**
 * Schema for Hypothetical entries
 * Requirements: 2.5
 */
export const hypotheticalEntrySchema = baseEntrySchema.extend({
  type: z.literal("hypothetical"),
  body: z.string().min(1, "Body is required"),
  source: z.string().optional(),
  notes: z.string().optional(),
});

/**
 * Discriminated union schema for all entry types
 * Requirements: 2.1
 * Note: Using base schema for quotes in union, refinement applied separately
 */
export const entrySchema = z
  .discriminatedUnion("type", [
    wordEntrySchema,
    phraseEntrySchema,
    quoteEntryBaseSchema,
    hypotheticalEntrySchema,
  ])
  .superRefine((data, ctx) => {
    // Apply quote-specific validation
    if (data.type === "quote") {
      const hasAuthor = data.author && data.author.trim();
      const hasAuthorId = data.authorId && data.authorId.trim();

      if (!hasAuthor && !hasAuthorId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Author is required",
          path: ["author"],
        });
      }
    }
  });

/**
 * Type inference from schemas
 */
export type WordEntryInput = z.infer<typeof wordEntrySchema>;
export type PhraseEntryInput = z.infer<typeof phraseEntrySchema>;
export type QuoteEntryInput = z.infer<typeof quoteEntrySchema>;
export type HypotheticalEntryInput = z.infer<typeof hypotheticalEntrySchema>;
export type EntryInput = z.infer<typeof entrySchema>;

/**
 * Validation helper function
 * Returns parsed data if valid, throws ZodError if invalid
 */
export function validateEntry(data: unknown): EntryInput {
  return entrySchema.parse(data);
}

/**
 * Safe validation helper function
 * Returns success/error result without throwing
 */
export function validateEntrySafe(data: unknown) {
  return entrySchema.safeParse(data);
}
