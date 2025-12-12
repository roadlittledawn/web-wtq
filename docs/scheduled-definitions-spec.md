# Scheduled Definition Updates - Functional Requirements & Design Specification

## Overview
Implement a Netlify scheduled function to automatically populate missing definitions for words and phrases in the MongoDB database using an external dictionary API.

---

## 1. Functional Requirements

### 1.1 Core Functionality
- **FR-1.1**: System SHALL execute a scheduled function on a configurable interval (weekly or monthly)
- **FR-1.2**: System SHALL query MongoDB for entries of type "word" or "phrase" that have null/undefined `definition` fields
- **FR-1.3**: System SHALL fetch definitions from an external API for entries without definitions
- **FR-1.4**: System SHALL update the `definition` field in MongoDB when a valid definition is retrieved
- **FR-1.5**: System SHALL log all operations (successes, failures, API errors) for audit and debugging

### 1.2 API Efficiency
- **FR-2.1**: System SHALL NOT make API calls on page load or user-triggered requests
- **FR-2.2**: System SHALL batch API requests to minimize calls per execution
- **FR-2.3**: System SHALL respect API rate limits with configurable delays between requests
- **FR-2.4**: System SHALL track API usage metrics (requests made, successful updates, failures)

### 1.3 Data Handling
- **FR-3.1**: System SHALL support definitions for both single words (`WordEntry.name`) and multi-word phrases (`PhraseEntry.body`)
- **FR-3.2**: System SHALL preserve existing definitions (never overwrite non-null values)
- **FR-3.3**: System SHALL store the definition update timestamp
- **FR-3.4**: System SHALL handle ambiguous or missing definitions gracefully

### 1.4 Error Handling
- **FR-4.1**: System SHALL continue processing remaining entries if individual API calls fail
- **FR-4.2**: System SHALL log entries that could not be defined for manual review
- **FR-4.3**: System SHALL handle API quota exhaustion by gracefully stopping and resuming next run
- **FR-4.4**: System SHALL provide execution summary (total processed, succeeded, failed)

### 1.5 Configuration
- **FR-5.1**: Schedule interval SHALL be configurable via Netlify configuration
- **FR-5.2**: API credentials SHALL be stored in environment variables
- **FR-5.3**: Batch size and rate limits SHALL be configurable
- **FR-5.4**: API provider SHALL be swappable via configuration (not hardcoded)

---

## 2. Technical Design

### 2.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Netlify Scheduled Function                │
│                 (scheduled-update-definitions.ts)            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ├──────────────────────┐
                              ▼                      ▼
                    ┌──────────────────┐   ┌──────────────────┐
                    │  MongoDB Query   │   │  Definition API  │
                    │  (missing defs)  │   │    Adapter       │
                    └──────────────────┘   └──────────────────┘
                              │                      │
                              │                      ▼
                              │            ┌──────────────────┐
                              │            │  Free Dictionary │
                              │            │   API / Google   │
                              │            │   Custom Dict    │
                              └────────────┤   Dictionary API  │
                                           └──────────────────┘
                                                    │
                              ┌─────────────────────┘
                              ▼
                    ┌──────────────────┐
                    │  MongoDB Update  │
                    │  (set definition)│
                    └──────────────────┘
```

### 2.2 File Structure

```
web-wtq/
├── netlify/functions/
│   └── scheduled-update-definitions.ts    (Main scheduled function)
├── lib/
│   ├── definition-api/
│   │   ├── adapter.ts                     (Abstract adapter interface)
│   │   ├── free-dictionary-adapter.ts     (Free Dictionary API impl)
│   │   ├── google-adapter.ts              (Google Dictionary impl)
│   │   └── factory.ts                     (Provider factory)
│   └── definition-updater.ts              (Core business logic)
├── types/
│   └── definition-api.ts                  (API response types)
└── docs/
    └── scheduled-definitions-spec.md      (This document)
```

### 2.3 Database Schema Extensions

#### 2.3.1 Existing Schema (No Changes Required)
```typescript
// types/models.ts
interface WordEntry extends BaseEntry {
  type: "word";
  name: string;
  definition?: string;  // ✓ Already exists
  // ... other fields
}

interface PhraseEntry extends BaseEntry {
  type: "phrase";
  body: string;
  definition?: string;  // ✓ Already exists
  // ... other fields
}
```

#### 2.3.2 Optional Metadata Extension (Future Enhancement)
```typescript
interface DefinitionMetadata {
  source: string;           // e.g., "free-dictionary-api", "google"
  updatedAt: Date;
  apiVersion?: string;
}

// Add to WordEntry/PhraseEntry:
definitionMeta?: DefinitionMetadata;
```

### 2.4 Core Components

#### 2.4.1 Scheduled Function
```typescript
// netlify/functions/scheduled-update-definitions.ts
import { schedule } from "@netlify/functions";
import { updateDefinitions } from "../../lib/definition-updater";

export const handler = schedule("@weekly", async () => {
  try {
    const result = await updateDefinitions({
      batchSize: parseInt(process.env.DEF_BATCH_SIZE || "50"),
      rateLimit: parseInt(process.env.DEF_RATE_LIMIT_MS || "1000"),
      maxRequests: parseInt(process.env.DEF_MAX_REQUESTS || "100"),
    });

    console.log("Definition update completed:", result);

    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error("Definition update failed:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
});
```

#### 2.4.2 Definition Updater (Core Logic)
```typescript
// lib/definition-updater.ts
import { getDatabase } from "./mongodb";
import { getDefinitionAdapter } from "./definition-api/factory";
import type { Entry } from "../types/models";

export interface UpdateConfig {
  batchSize: number;
  rateLimit: number;
  maxRequests: number;
}

export interface UpdateResult {
  totalProcessed: number;
  successfulUpdates: number;
  failures: number;
  skipped: number;
  errors: Array<{ slug: string; error: string }>;
}

export async function updateDefinitions(
  config: UpdateConfig
): Promise<UpdateResult> {
  const db = await getDatabase();
  const adapter = getDefinitionAdapter();

  const result: UpdateResult = {
    totalProcessed: 0,
    successfulUpdates: 0,
    failures: 0,
    skipped: 0,
    errors: [],
  };

  // Query entries without definitions
  const entries = await db
    .collection<Entry>("entries")
    .find({
      type: { $in: ["word", "phrase"] },
      definition: { $exists: false },
    })
    .limit(config.maxRequests)
    .toArray();

  result.totalProcessed = entries.length;

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];

    try {
      // Get term based on entry type
      const term = entry.type === "word" ? entry.name : entry.body;

      // Fetch definition from API
      const definition = await adapter.getDefinition(term);

      if (!definition) {
        result.skipped++;
        console.log(`No definition found for: ${term}`);
        continue;
      }

      // Update MongoDB
      await db.collection("entries").updateOne(
        { _id: entry._id },
        {
          $set: {
            definition,
            updatedAt: new Date(),
          },
        }
      );

      result.successfulUpdates++;
      console.log(`Updated definition for: ${term}`);

    } catch (error) {
      result.failures++;
      result.errors.push({
        slug: entry.slug,
        error: error.message,
      });
      console.error(`Failed to update ${entry.slug}:`, error);
    }

    // Rate limiting
    if (i < entries.length - 1) {
      await sleep(config.rateLimit);
    }
  }

  return result;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
```

#### 2.4.3 API Adapter Interface
```typescript
// lib/definition-api/adapter.ts
export interface DefinitionAdapter {
  /**
   * Fetch definition for a word or phrase
   * @param term - The word or phrase to define
   * @returns Definition string or null if not found
   */
  getDefinition(term: string): Promise<string | null>;

  /**
   * Get adapter name for logging
   */
  getName(): string;
}
```

#### 2.4.4 Free Dictionary API Adapter
```typescript
// lib/definition-api/free-dictionary-adapter.ts
import type { DefinitionAdapter } from "./adapter";

interface FreeDictionaryResponse {
  word: string;
  meanings: Array<{
    partOfSpeech: string;
    definitions: Array<{
      definition: string;
      example?: string;
    }>;
  }>;
}

export class FreeDictionaryAdapter implements DefinitionAdapter {
  private baseUrl = "https://api.dictionaryapi.dev/api/v2/entries/en";

  async getDefinition(term: string): Promise<string | null> {
    try {
      const response = await fetch(`${this.baseUrl}/${encodeURIComponent(term)}`);

      if (!response.ok) {
        if (response.status === 404) {
          return null; // Word not found
        }
        throw new Error(`API error: ${response.status}`);
      }

      const data: FreeDictionaryResponse[] = await response.json();

      if (!data || data.length === 0) {
        return null;
      }

      // Get first definition from first meaning
      const firstMeaning = data[0].meanings[0];
      if (firstMeaning?.definitions?.[0]) {
        return firstMeaning.definitions[0].definition;
      }

      return null;
    } catch (error) {
      console.error(`FreeDictionary API error for "${term}":`, error);
      throw error;
    }
  }

  getName(): string {
    return "FreeDictionaryAPI";
  }
}
```

#### 2.4.5 Adapter Factory
```typescript
// lib/definition-api/factory.ts
import type { DefinitionAdapter } from "./adapter";
import { FreeDictionaryAdapter } from "./free-dictionary-adapter";
// import { GoogleDictionaryAdapter } from "./google-adapter";

export function getDefinitionAdapter(): DefinitionAdapter {
  const provider = process.env.DEFINITION_API_PROVIDER || "free-dictionary";

  switch (provider) {
    case "free-dictionary":
      return new FreeDictionaryAdapter();
    // case "google":
    //   return new GoogleDictionaryAdapter(process.env.GOOGLE_API_KEY!);
    default:
      throw new Error(`Unknown definition provider: ${provider}`);
  }
}
```

---

## 3. External API Options

### 3.1 Recommended: Free Dictionary API
**URL**: https://dictionaryapi.dev/

**Pros**:
- ✓ Completely free, no API key required
- ✓ No rate limits for reasonable use
- ✓ Simple JSON responses
- ✓ Supports word definitions, part of speech, examples
- ✓ Open source

**Cons**:
- ✗ Limited to English language
- ✗ May not have definitions for uncommon words or phrases
- ✗ No official SLA or uptime guarantee

**Example Response**:
```json
[
  {
    "word": "serendipity",
    "meanings": [
      {
        "partOfSpeech": "noun",
        "definitions": [
          {
            "definition": "The occurrence and development of events by chance in a happy or beneficial way.",
            "example": "a fortunate stroke of serendipity"
          }
        ]
      }
    ]
  }
]
```

### 3.2 Alternative: Merriam-Webster Dictionary API
**URL**: https://dictionaryapi.com/

**Pros**:
- ✓ Free tier available (1,000 requests/day)
- ✓ Authoritative dictionary source
- ✓ Rich metadata (pronunciation, etymology)
- ✓ Reliable uptime

**Cons**:
- ✗ Requires API key registration
- ✗ Rate limits on free tier
- ✗ More complex response format

### 3.3 Alternative: Google Custom Search JSON API
**URL**: https://developers.google.com/custom-search/v1/overview

**Pros**:
- ✓ Can scrape Google's dictionary results
- ✓ High accuracy

**Cons**:
- ✗ Complex to parse results
- ✗ Costs $5 per 1,000 queries after 100 free queries/day
- ✗ Terms of Service restrictions on automated queries
- ✗ Not recommended for this use case

### 3.4 Recommendation
**Start with Free Dictionary API** for initial implementation due to:
- Zero cost and no API key management
- Sufficient quality for common words
- Simple integration

**Plan to support Merriam-Webster** as a fallback or premium option for:
- Words not found in Free Dictionary
- Higher quality definitions for uncommon terms

---

## 4. Configuration

### 4.1 Environment Variables
```bash
# .env
# Definition API Configuration
DEFINITION_API_PROVIDER=free-dictionary    # Options: free-dictionary, merriam-webster
MERRIAM_WEBSTER_API_KEY=                   # Only needed if using Merriam-Webster

# Scheduling Configuration (handled by Netlify)
# Configured in netlify.toml or function file

# Batch Configuration
DEF_BATCH_SIZE=50                          # Max entries per run
DEF_RATE_LIMIT_MS=1000                     # Delay between API calls (ms)
DEF_MAX_REQUESTS=100                       # Hard limit per execution
```

### 4.2 Netlify Configuration
```toml
# netlify.toml
[functions]
  directory = "netlify/functions"
  node_bundler = "esbuild"

# Scheduled function will be configured in the function file itself using:
# export const handler = schedule("@weekly", async () => { ... });
#
# Cron syntax options:
# - "@hourly" / "0 * * * *"
# - "@daily" / "0 0 * * *"
# - "@weekly" / "0 0 * * 0"
# - "@monthly" / "0 0 1 * *"
```

---

## 5. Data Flow

### 5.1 Execution Flow

```
1. Netlify Cron Trigger (Weekly)
        │
        ▼
2. Query MongoDB for entries WHERE:
   - type IN ['word', 'phrase']
   - definition IS NULL/UNDEFINED
   - LIMIT maxRequests
        │
        ▼
3. FOR EACH entry:
   ├─ Get term (entry.name or entry.body)
   ├─ Call adapter.getDefinition(term)
   ├─ IF definition found:
   │  └─ UPDATE MongoDB SET definition, updatedAt
   ├─ IF definition not found:
   │  └─ Log to skipped
   ├─ IF error:
   │  └─ Log to errors, continue
   └─ Sleep (rate limit delay)
        │
        ▼
4. Return summary report:
   {
     totalProcessed: 50,
     successfulUpdates: 42,
     failures: 3,
     skipped: 5,
     errors: [...]
   }
```

### 5.2 MongoDB Query
```javascript
db.entries.find({
  type: { $in: ["word", "phrase"] },
  definition: { $exists: false }
}).limit(100)
```

### 5.3 Update Operation
```javascript
db.entries.updateOne(
  { _id: entry._id },
  {
    $set: {
      definition: "The occurrence and development...",
      updatedAt: new Date()
    }
  }
)
```

---

## 6. Error Handling & Logging

### 6.1 Error Categories

| Error Type | Handling Strategy | Example |
|------------|------------------|---------|
| Network Error | Retry once, then skip entry | API timeout |
| API Rate Limit | Stop execution, log, resume next run | 429 Too Many Requests |
| Invalid Response | Log error, skip entry | Malformed JSON |
| MongoDB Error | Fail entire execution | Connection lost |
| No Definition Found | Skip, log to summary | Obscure term |

### 6.2 Logging Strategy
```typescript
// Structured logging format
interface LogEntry {
  timestamp: Date;
  level: "info" | "warn" | "error";
  function: "scheduled-update-definitions";
  message: string;
  metadata?: Record<string, any>;
}

// Example logs:
console.log({
  level: "info",
  message: "Starting definition update",
  metadata: { totalEntries: 50, provider: "free-dictionary" }
});

console.warn({
  level: "warn",
  message: "Definition not found",
  metadata: { term: "cromulent", slug: "cromulent-word" }
});

console.error({
  level: "error",
  message: "API call failed",
  metadata: { term: "example", error: "Network timeout" }
});
```

### 6.3 Execution Summary
```typescript
interface ExecutionSummary {
  timestamp: Date;
  duration: number;                      // milliseconds
  config: UpdateConfig;
  result: UpdateResult;
  apiProvider: string;
}

// Stored in logs and optionally in MongoDB collection "definition_runs"
```

---

## 7. Testing Strategy

### 7.1 Unit Tests
```typescript
// tests/definition-updater.test.ts
describe("DefinitionUpdater", () => {
  it("should fetch and update definition for word entry");
  it("should fetch and update definition for phrase entry");
  it("should skip entries that already have definitions");
  it("should handle API errors gracefully");
  it("should respect rate limits");
  it("should stop at maxRequests limit");
});

// tests/free-dictionary-adapter.test.ts
describe("FreeDictionaryAdapter", () => {
  it("should fetch definition for valid word");
  it("should return null for non-existent word");
  it("should handle API errors");
  it("should parse complex responses correctly");
});
```

### 7.2 Integration Tests
```typescript
// tests/integration/scheduled-function.test.ts
describe("Scheduled Definition Update", () => {
  it("should update definitions for entries without them");
  it("should not overwrite existing definitions");
  it("should handle database connection issues");
  it("should process batch within execution time limit");
});
```

### 7.3 Manual Testing Checklist
- [ ] Create test entries without definitions
- [ ] Trigger scheduled function manually via Netlify
- [ ] Verify definitions are populated in MongoDB
- [ ] Check logs for errors/warnings
- [ ] Test with non-existent words
- [ ] Test with phrases (multi-word)
- [ ] Verify rate limiting works
- [ ] Test API provider switching

---

## 8. Deployment

### 8.1 Pre-deployment Checklist
- [ ] Set environment variables in Netlify
- [ ] Test function locally with `netlify dev`
- [ ] Verify MongoDB indexes exist for query performance
- [ ] Review scheduled interval (weekly vs monthly)
- [ ] Set up monitoring/alerts for failures

### 8.2 Deployment Steps
```bash
# 1. Install dependencies
npm install

# 2. Test locally
netlify dev

# 3. Deploy to Netlify
git add .
git commit -m "feat: add scheduled definition updates"
git push origin main

# 4. Verify in Netlify Dashboard
# - Check Functions tab for scheduled function
# - Review execution logs
# - Trigger manual execution for testing
```

### 8.3 Monitoring
- Monitor Netlify function logs for errors
- Track API usage to avoid hitting limits
- Set up alerts for consecutive failures
- Review execution summaries weekly

---

## 9. Future Enhancements

### 9.1 Phase 2 Features
- **Multiple Definitions**: Store array of definitions from different sources
- **Part of Speech**: Add `partOfSpeech` field to WordEntry
- **Etymology**: Populate `etymology` field when available
- **Pronunciation**: Add phonetic pronunciation field
- **Examples**: Store usage examples
- **Confidence Scoring**: Rate definition quality

### 9.2 Advanced Features
- **Manual Override**: UI to manually edit auto-populated definitions
- **Approval Workflow**: Review auto-populated definitions before publishing
- **Translation Support**: Multi-language definitions
- **Semantic Search**: Use definitions for better search results
- **AI Enhancement**: Use Claude to improve/simplify definitions
- **Bulk Import**: Import definitions from dictionary dumps

### 9.3 Optimization Opportunities
- **Incremental Updates**: Track last processed entry to resume
- **Priority Queue**: Process popular entries first
- **Caching**: Cache API responses to reduce duplicate calls
- **Parallel Processing**: Use Promise.all for batch requests
- **Webhook Notifications**: Alert on completion or failures

---

## 10. Success Metrics

### 10.1 Key Performance Indicators
- **Coverage**: % of entries with definitions (target: 80%+)
- **Success Rate**: % of API calls that succeed (target: 95%+)
- **Execution Time**: Average function execution time (target: <5 min)
- **Cost Efficiency**: API calls per definition added (target: <1.5)

### 10.2 Monitoring Queries
```javascript
// Calculate definition coverage
db.entries.aggregate([
  { $match: { type: { $in: ["word", "phrase"] } } },
  {
    $group: {
      _id: null,
      total: { $sum: 1 },
      withDefinition: {
        $sum: { $cond: [{ $ne: ["$definition", null] }, 1, 0] }
      }
    }
  },
  {
    $project: {
      coverage: { $multiply: [{ $divide: ["$withDefinition", "$total"] }, 100] }
    }
  }
]);

// Find entries still missing definitions
db.entries.find({
  type: { $in: ["word", "phrase"] },
  definition: { $exists: false }
}).count();
```

---

## 11. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| API rate limit hit | Medium | Medium | Configurable rate limiting, use free tier |
| API service downtime | Low | Medium | Implement retry logic, fallback providers |
| Definition quality issues | Medium | Low | Manual review workflow, user feedback |
| Execution timeout (10s Netlify limit) | Low | High | Background functions (15 min limit), batch processing |
| MongoDB connection pooling issues | Low | High | Proper connection handling, error recovery |
| Cost overrun on paid APIs | Low | Medium | Start with free tier, set hard limits |

---

## 12. Acceptance Criteria

### 12.1 Must Have (MVP)
- [x] Scheduled function executes weekly
- [x] Queries entries without definitions
- [x] Fetches definitions from Free Dictionary API
- [x] Updates MongoDB with fetched definitions
- [x] Respects rate limits
- [x] Logs execution summary
- [x] Handles errors gracefully

### 12.2 Should Have
- [ ] Support for multiple API providers
- [ ] Configurable via environment variables
- [ ] Comprehensive error logging
- [ ] Unit and integration tests

### 12.3 Nice to Have
- [ ] Monitoring dashboard
- [ ] Manual trigger UI
- [ ] Definition quality scoring
- [ ] Multi-language support

---

## Appendix A: Sample API Responses

### Free Dictionary API
```json
GET https://api.dictionaryapi.dev/api/v2/entries/en/serendipity

[
  {
    "word": "serendipity",
    "phonetic": "/ˌsɛɹənˈdɪpɪti/",
    "phonetics": [...],
    "meanings": [
      {
        "partOfSpeech": "noun",
        "definitions": [
          {
            "definition": "The occurrence and development of events by chance in a happy or beneficial way.",
            "synonyms": [],
            "antonyms": [],
            "example": "a fortunate stroke of serendipity"
          }
        ],
        "synonyms": ["fortuitousness"],
        "antonyms": []
      }
    ],
    "license": {...},
    "sourceUrls": [...]
  }
]
```

### 404 Response (Word Not Found)
```json
{
  "title": "No Definitions Found",
  "message": "Sorry pal, we couldn't find definitions for the word you were looking for.",
  "resolution": "You can try the search again at later time or head to the web instead."
}
```

---

## Appendix B: Database Queries for Testing

```javascript
// Insert test entries without definitions
db.entries.insertMany([
  {
    _id: new ObjectId(),
    type: "word",
    name: "ephemeral",
    slug: "ephemeral",
    tags: ["test"],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: new ObjectId(),
    type: "phrase",
    body: "break the ice",
    slug: "break-the-ice",
    tags: ["test"],
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

// Check which entries need definitions
db.entries.find({
  type: { $in: ["word", "phrase"] },
  definition: { $exists: false }
});

// Verify updates after function runs
db.entries.find({
  slug: { $in: ["ephemeral", "break-the-ice"] }
});
```

---

**Document Version**: 1.0
**Last Updated**: 2025-12-10
**Author**: Claude Code
**Status**: Draft - Pending Review
