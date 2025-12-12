# Scheduled Definition Updates - Quick Start Guide

Automatically fetch and update word definitions from external dictionary APIs.

## Features

- ✅ **Automated Updates**: Weekly scheduled function fetches missing definitions
- ✅ **Manual Override**: User-entered definitions are never replaced
- ✅ **Smart Retry**: Tracks failed lookups to avoid repeated API calls
- ✅ **UI Indicators**: Shows whether definitions are manual or API-sourced
- ✅ **Free API**: Uses Free Dictionary API (no API key required)

---

## Quick Start

### 1. Environment Setup

Add to your `.env` file:

```bash
# Definition API Configuration
DEFINITION_API_PROVIDER=free-dictionary

# Definition Update Settings (optional - these are defaults)
DEF_MAX_REQUESTS=100
DEF_RATE_LIMIT_MS=1000
DEF_RETRY_NOT_FOUND_DAYS=90
DEF_RETRY_ERROR_DAYS=7
```

### 2. Initial Migration

Run the migration script to populate definitions for existing entries:

```bash
# IMPORTANT: Set MONGODB_URI environment variable when running

# Dry run first (no DB writes)
MONGODB_URI="your-connection-string" npx tsx scripts/migrate-definitions.ts --dry-run --limit 10

# Run on first 100 entries
MONGODB_URI="your-connection-string" npx tsx scripts/migrate-definitions.ts --limit 100

# Run on ALL entries (may take a while)
MONGODB_URI="your-connection-string" npx tsx scripts/migrate-definitions.ts
```

### 3. Deploy

Deploy to Netlify to enable the weekly scheduled function:

```bash
git add .
git commit -m "feat: add scheduled definition updates"
git push origin main
```

The scheduled function will run automatically every Sunday at midnight UTC.

---

## How It Works

### For Users

1. **Creating a word with a definition**: Marked as "Manual" (✍️)
2. **Editing an API definition**: Becomes "Manual" when you change it
3. **Creating a word without a definition**: API will fetch it on next run
4. **Clearing a definition**: Allows API to fetch it again

### For Developers

#### Data Flow

```
User Creates Word
     ↓
Backend sets definitionSource='manual' (if definition provided)
     ↓
Database stores entry
     ↓
Weekly: Scheduled function runs
     ↓
Queries words without definitions (excluding manual)
     ↓
Free Dictionary API call
     ↓
Update database with definition + metadata
```

#### Database Fields

Words now have these optional fields:

- `definition`: The actual definition text
- `definitionSource`: `'manual'` or `'api'`
- `apiProvider`: e.g., `'free-dictionary'`
- `apiLookupStatus`: `'found'`, `'not_found'`, or `'error'`
- `apiLookupAttemptedAt`: Timestamp of last API attempt

---

## Migration Script

### Flags

```bash
--dry-run          # Preview without DB writes
--limit <number>   # Process first N entries
--verbose          # Detailed logging
--skip-backfill    # Skip marking existing definitions as manual
--skip-fetch       # Skip fetching new definitions
```

### Examples

```bash
# Test on 5 entries
npx tsx scripts/migrate-definitions.ts --dry-run --limit 5

# Backfill existing definitions only
npx tsx scripts/migrate-definitions.ts --skip-fetch

# Fetch definitions only (skip backfill)
npx tsx scripts/migrate-definitions.ts --skip-backfill
```

---

## Monitoring

### Check Coverage

```javascript
// In MongoDB shell or Compass
db.entries.aggregate([
  { $match: { type: "word" } },
  {
    $group: {
      _id: null,
      total: { $sum: 1 },
      withDefinition: {
        $sum: { $cond: [{ $ne: ["$definition", null] }, 1, 0] },
      },
    },
  },
  {
    $project: {
      coverage: {
        $multiply: [{ $divide: ["$withDefinition", "$total"] }, 100],
      },
    },
  },
]);
```

### Check Netlify Function Logs

1. Go to Netlify Dashboard → Functions
2. Find `scheduled-update-definitions`
3. View recent executions and logs

---

## Troubleshooting

### No definitions being fetched

1. Check Netlify function logs for errors
2. Verify environment variables are set
3. Test API adapter locally:

```bash
npx tsx -e "
import { FreeDictionaryAdapter } from './lib/definition-api/free-dictionary-adapter';
const adapter = new FreeDictionaryAdapter();
adapter.getDefinition('serendipity').then(console.log);
"
```

### Migration script fails

1. Check MongoDB connection string
2. Verify you have write permissions
3. Run with `--dry-run` to test query logic

### Definitions overwriting manual entries

This shouldn't happen - check that:

1. Backend handlers are setting `definitionSource='manual'`
2. Query logic excludes manual definitions
3. Check entry in DB: `db.entries.findOne({ name: "your-word" })`

---

## API Limits

### Free Dictionary API

- **Rate Limit**: None officially, but be respectful
- **Coverage**: Good for common English words
- **Phrases**: Not supported (words only)
- **Cost**: Free

### Future: Merriam-Webster

- **Rate Limit**: 1,000 requests/day (free tier)
- **Coverage**: Authoritative dictionary
- **Cost**: Free tier available

To switch providers, update `.env`:

```bash
DEFINITION_API_PROVIDER=merriam-webster
MERRIAM_WEBSTER_API_KEY=your-api-key-here
```

---

## Development

### Adding a New API Provider

1. Create adapter in `lib/definition-api/`:

```typescript
// lib/definition-api/your-adapter.ts
import type { DefinitionAdapter } from "./adapter";

export class YourAdapter implements DefinitionAdapter {
  async getDefinition(term: string): Promise<string | null> {
    // Implementation
  }

  getName(): string {
    return "your-provider";
  }

  supportsType(type: "word" | "phrase"): boolean {
    return type === "word"; // or both
  }
}
```

2. Register in factory:

```typescript
// lib/definition-api/factory.ts
case 'your-provider':
  return new YourAdapter();
```

3. Update environment:

```bash
DEFINITION_API_PROVIDER=your-provider
```

---

## Files Reference

### Core Implementation

- `lib/definition-api/adapter.ts` - Interface
- `lib/definition-api/free-dictionary-adapter.ts` - Free Dictionary implementation
- `lib/definition-api/factory.ts` - Provider factory
- `lib/definition-updater.ts` - Core business logic
- `netlify/functions/scheduled-update-definitions.ts` - Scheduled function

### Scripts

- `scripts/migrate-definitions.ts` - One-time migration script

### Database

- `types/models.ts` - TypeScript types (WordEntry)
- `lib/validation.ts` - Zod schemas

### Frontend

- `components/DefinitionSourceBadge.tsx` - UI badge component
- `components/EntryCard.tsx` - Displays definitions with badge

### Documentation

- `docs/scheduled-definitions-spec.md` - Full technical specification
- `docs/scheduled-definitions-README.md` - This file

---

## Success Metrics

Track these over time:

- **Definition Coverage**: % of words with definitions (target: >80%)
- **API Success Rate**: % of successful API calls (target: >95%)
- **Manual Override Rate**: % of manual definitions (indicates user engagement)
- **Weekly Updates**: Number of definitions added per week

---

## Next Steps

1. ✅ Run initial migration
2. ✅ Deploy to Netlify
3. ✅ Monitor first weekly execution
4. ⏳ Add phrase support (future)
5. ⏳ Add multiple definition sources (future)
6. ⏳ Add part of speech auto-population (future)

---

## Support

- **GitHub Issue**: [#2](https://github.com/roadlittledawn/web-wtq/issues/2)
- **Technical Spec**: `docs/scheduled-definitions-spec.md`
- **Free Dictionary API Docs**: https://dictionaryapi.dev/
