# CSV Import Tool

Import content into the WTQ database from CSV files.

## Quick Start

```bash
npm run import -- <file-path> <type> [--dry-run]
```

## Arguments

- `file-path`: Path to your CSV file
- `type`: Entry type (`word`, `phrase`, `quote`, or `hypothetical`)
- `--dry-run`: Preview the import without making changes (optional)

## CSV Format Requirements

### Words

**Required columns:** `name`, `definition`  
**Optional columns:** `slug`, `partOfSpeech`, `etymology`, `notes`, `tags`

### Phrases

**Required columns:** `body`, `definition`  
**Optional columns:** `slug`, `source`, `notes`, `tags`

### Quotes

**Required columns:** `name`, `body`, `author`  
**Optional columns:** `slug`, `source`, `notes`, `tags`

### Hypotheticals

**Required columns:** `body`  
**Optional columns:** `slug`, `source`, `notes`, `tags`

### Tags Format

Tags should be comma-separated within the CSV cell:

```
"philosophy,ethics,ancient"
```

### Slugs

- If not provided, slugs are auto-generated from the name or body
- Slugs must be unique across all entries
- Existing slugs in the database will be skipped

## Examples

### Test with dry run first

```bash
npm run import -- ./data/words.csv word --dry-run
```

### Import words

```bash
npm run import -- ./data/words.csv word
```

### Import quotes

```bash
npm run import -- ./data/quotes.csv quote
```

### Import from parent directory

```bash
npm run import -- ../backup/phrases.csv phrase
```

## Example CSV Files

Check the `scripts/examples/` directory for sample CSV files:

- `words-example.csv`
- `quotes-example.csv`
- `phrases-example.csv`
- `hypotheticals-example.csv`

## Features

- ✅ Validates all rows before importing
- ✅ Auto-generates slugs if not provided
- ✅ Checks for duplicate slugs in import file
- ✅ Skips entries with slugs that already exist in database
- ✅ Updates tag usage counts automatically
- ✅ Dry run mode to preview changes
- ✅ Detailed error messages and progress reporting

## Troubleshooting

### "MONGODB_URI environment variable is not set"

Make sure your `.env` file contains the `MONGODB_URI` variable.

### "Validation errors found"

Check that all required columns are present and contain values. The error message will indicate which rows and fields are missing.

### "Duplicate slugs in import"

Your CSV file contains duplicate slug values. Either provide unique slugs or remove the slug column to auto-generate them.

### Entries are skipped

If slugs already exist in the database, those entries will be skipped. This prevents accidental duplicates.
