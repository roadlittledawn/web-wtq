import { Entry } from "../types/models";

/**
 * Search ranking utility for scoring entries against a search query.
 * Higher scores indicate better matches.
 *
 * Priority 1 (Highest): word.name, quote.body, phrase.body, hypothetical.body
 * Priority 2 (Medium): word.definition, phrase.definition, tags
 * Priority 3 (Lowest): notes (all types), quote.source
 */

// Escape special regex characters in search string
const escapeForRegex = (s: string): string =>
  s?.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&") ?? s;

// ============ MATCHERS ============
// Each matcher returns true if the field matches the search string

export const exactMatch = (field: string, search: string): boolean =>
  field.toLowerCase() === search.toLowerCase();

export const startsWith = (field: string, search: string): boolean =>
  field?.toLowerCase().startsWith(search.toLowerCase()) ?? false;

export const containsWord = (field: string, search: string): boolean =>
  new RegExp(`\\b${escapeForRegex(search)}\\b`, "i").test(field ?? "");

export const containsSubString = (field: string, search: string): boolean =>
  field?.toLowerCase().includes(search.toLowerCase()) ?? false;

// ============ FIELD GETTERS ============
// Type-safe getters that extract fields from entries

type FieldGetter = (entry: Entry) => string | string[] | undefined;

// Priority 1 fields - primary content
export const getPrimaryField: FieldGetter = (entry) => {
  switch (entry.type) {
    case "word":
      return entry.name;
    case "phrase":
      return entry.body;
    case "quote":
      return entry.body;
    case "hypothetical":
      return entry.body;
    default:
      return undefined;
  }
};

// Priority 2 fields - definitions
export const getDefinition: FieldGetter = (entry) => {
  switch (entry.type) {
    case "word":
      return entry.definition;
    case "phrase":
      return entry.definition;
    default:
      return undefined;
  }
};

// Priority 2 fields - tags
export const getTags: FieldGetter = (entry) => entry.tags;

// Priority 3 fields - notes
export const getNotes: FieldGetter = (entry) => {
  if ("notes" in entry) {
    return entry.notes;
  }
  return undefined;
};

// Priority 3 fields - quote source only
export const getQuoteSource: FieldGetter = (entry) => {
  if (entry.type === "quote") {
    return entry.source;
  }
  return undefined;
};

// ============ RULES ============
// Rules are ordered by priority - earlier rules give higher scores

type Matcher = (field: string, search: string) => boolean;

interface Rule {
  getter: FieldGetter;
  matcher: Matcher;
  name: string; // For debugging
}

const rules: Rule[] = [
  // Priority 1: Primary field with all matchers (exact → startsWith → containsWord → containsSubString)
  { getter: getPrimaryField, matcher: exactMatch, name: "primary-exact" },
  { getter: getPrimaryField, matcher: startsWith, name: "primary-startsWith" },
  {
    getter: getPrimaryField,
    matcher: containsWord,
    name: "primary-containsWord",
  },
  {
    getter: getPrimaryField,
    matcher: containsSubString,
    name: "primary-containsSubString",
  },

  // Priority 2: Definition with 2 matchers
  {
    getter: getDefinition,
    matcher: containsWord,
    name: "definition-containsWord",
  },

  // Priority 2: Tags - check if any tag matches search
  { getter: getTags, matcher: containsSubString, name: "tags-containsSubString" },

  // Priority 2: Definition substring
  {
    getter: getDefinition,
    matcher: containsSubString,
    name: "definition-containsSubString",
  },

  // Priority 3: Notes
  { getter: getNotes, matcher: containsSubString, name: "notes-containsSubString" },

  // Priority 3: Quote source
  {
    getter: getQuoteSource,
    matcher: containsSubString,
    name: "quoteSource-containsSubString",
  },
];

// ============ SCORING ============

/**
 * Calculate score for a rule based on its position.
 * Earlier rules (lower index) get higher scores.
 * Formula: (totalRules - ruleIndex)^2
 */
export const ruleScore = (index: number): number =>
  Math.pow(rules.length - index, 2);

/**
 * Rank an entry against a search string.
 * Returns a cumulative score based on all matching rules.
 */
export const rankEntry = (entry: Entry, searchString: string): number => {
  if (!searchString || searchString.trim() === "") {
    return 0;
  }

  const normalizedSearch = searchString.toLowerCase().trim();

  const total = rules.reduce((score, rule, index) => {
    const fieldValue = rule.getter(entry);

    if (fieldValue === undefined || fieldValue === null) {
      return score;
    }

    let matches = false;

    if (Array.isArray(fieldValue)) {
      // For arrays (like tags), check if any element matches
      matches = fieldValue.some(
        (val) => val && rule.matcher(val.toLowerCase(), normalizedSearch)
      );
    } else if (typeof fieldValue === "string") {
      matches = rule.matcher(fieldValue.toLowerCase(), normalizedSearch);
    }

    if (matches) {
      return score + ruleScore(index);
    }

    return score;
  }, 0);

  return total;
};

/**
 * Get max possible score (for reference/normalization if needed)
 */
export const getMaxPossibleScore = (): number => {
  return rules.reduce((total, _, index) => total + ruleScore(index), 0);
};

/**
 * Get score breakdown for debugging
 */
export const getScoreBreakdown = (
  entry: Entry,
  searchString: string
): { rule: string; score: number; matched: boolean }[] => {
  if (!searchString || searchString.trim() === "") {
    return [];
  }

  const normalizedSearch = searchString.toLowerCase().trim();

  return rules.map((rule, index) => {
    const fieldValue = rule.getter(entry);
    let matched = false;

    if (fieldValue !== undefined && fieldValue !== null) {
      if (Array.isArray(fieldValue)) {
        matched = fieldValue.some(
          (val) => val && rule.matcher(val.toLowerCase(), normalizedSearch)
        );
      } else if (typeof fieldValue === "string") {
        matched = rule.matcher(fieldValue.toLowerCase(), normalizedSearch);
      }
    }

    return {
      rule: rule.name,
      score: matched ? ruleScore(index) : 0,
      matched,
    };
  });
};
