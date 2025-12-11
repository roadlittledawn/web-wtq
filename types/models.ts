import { ObjectId } from "mongodb";

/**
 * User model for authentication
 */
export interface User {
  _id: ObjectId;
  username: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Base entry interface with common fields for all entry types
 */
export interface BaseEntry {
  _id: ObjectId;
  type: "word" | "phrase" | "quote" | "hypothetical";
  slug: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Word entry with definition, part of speech, etymology, and notes
 */
export interface WordEntry extends BaseEntry {
  type: "word";
  name: string;
  definition?: string;

  // API-sourced definition tracking
  definitionSource?: "manual" | "api";
  apiProvider?: string; // e.g., "free-dictionary", "merriam-webster"
  apiLookupStatus?: "found" | "not_found" | "error";
  apiLookupAttemptedAt?: Date;

  partOfSpeech?: string;
  etymology?: string;
  notes?: string;
}

/**
 * Phrase entry with definition, source, and notes
 */
export interface PhraseEntry extends BaseEntry {
  type: "phrase";
  body: string;
  definition?: string;
  source?: string;
  notes?: string;
}

/**
 * Quote entry with body, author, source, and notes
 */
export interface QuoteEntry extends BaseEntry {
  type: "quote";
  name?: string;
  body: string;
  author: string; // Kept for backward compatibility
  authorId?: ObjectId; // Reference to Author document
  authorName?: string; // Denormalized for performance
  source?: string;
  notes?: string;
}

/**
 * Hypothetical entry with body, source, and notes
 */
export interface HypotheticalEntry extends BaseEntry {
  type: "hypothetical";
  body: string;
  source?: string;
  notes?: string;
}

/**
 * Union type for all entry types
 */
export type Entry = WordEntry | PhraseEntry | QuoteEntry | HypotheticalEntry;

/**
 * Entry with search score for ranked results
 */
export interface SearchResultEntry {
  entry: Entry;
  score: number;
}

/**
 * Tag model for categorizing entries
 */
export interface Tag {
  _id: ObjectId;
  name: string;
  usageCount: number;
  createdAt: Date;
}

/**
 * Author model for quote attribution
 */
export interface Author {
  _id: ObjectId;
  firstName: string;
  lastName: string;
  slug: string;
  bio?: string;
  createdAt: Date;
  updatedAt: Date;
}
