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
 * Schema for Quote entries
 * Requirements: 2.4
 */
export const quoteEntrySchema = baseEntrySchema.extend({
  type: z.literal("quote"),
  name: z.string().optional(),
  body: z.string().min(1, "Body is required"),
  author: z.string().min(1, "Author is required"),
  source: z.string().optional(),
  notes: z.string().optional(),
});

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
 */
export const entrySchema = z.discriminatedUnion("type", [
  wordEntrySchema,
  phraseEntrySchema,
  quoteEntrySchema,
  hypotheticalEntrySchema,
]);

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
