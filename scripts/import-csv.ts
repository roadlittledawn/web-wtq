#!/usr/bin/env tsx

import "dotenv/config";
import { MongoClient, ObjectId } from "mongodb";
import { createReadStream } from "fs";
import { parse } from "csv-parse";
import { resolve } from "path";

interface ImportOptions {
  filePath: string;
  type: "word" | "phrase" | "quote" | "hypothetical";
  dryRun?: boolean;
}

interface CSVRow {
  [key: string]: string;
}

// Field mappings for each type
const FIELD_MAPPINGS = {
  word: {
    required: ["name"],
    optional: [
      "slug",
      "definition",
      "partOfSpeech",
      "etymology",
      "notes",
      "tags",
      "context",
      "conveyance",
      "topic",
      "tone",
    ],
  },
  phrase: {
    required: ["body"],
    optional: [
      "slug",
      "definition",
      "source",
      "notes",
      "tags",
      "context",
      "conveyance",
      "topic",
      "tone",
    ],
  },
  quote: {
    required: ["body", "author"],
    optional: [
      "slug",
      "name",
      "source",
      "notes",
      "tags",
      "topic",
      "authorType",
      "tone",
    ],
  },
  hypothetical: {
    required: ["body"],
    optional: ["slug", "source", "notes", "tags"],
  },
};

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseTags(tagsString: string): string[] {
  if (!tagsString || !tagsString.trim()) return [];
  return tagsString
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
}

function collectTags(row: CSVRow): string[] {
  const tagSources = [
    row.tags,
    row.context,
    row.conveyance,
    row.topic,
    row.tone,
    row.authorType,
  ];

  const allTags: string[] = [];

  for (const source of tagSources) {
    if (source && source.trim()) {
      const tags = parseTags(source);
      allTags.push(...tags);
    }
  }

  // Remove duplicates and return
  return Array.from(new Set(allTags));
}

async function validateRow(
  row: CSVRow,
  type: string,
  rowNumber: number
): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];
  const mapping = FIELD_MAPPINGS[type as keyof typeof FIELD_MAPPINGS];

  // Check required fields
  for (const field of mapping.required) {
    if (!row[field] || !row[field].trim()) {
      errors.push(`Row ${rowNumber}: Missing required field '${field}'`);
    }
  }

  return { valid: errors.length === 0, errors };
}

function transformRow(row: CSVRow, type: string) {
  const now = new Date();
  const baseEntry = {
    _id: new ObjectId(),
    type,
    slug: row.slug?.trim() || generateSlug(row.name || row.body),
    tags: collectTags(row),
    createdAt: now,
    updatedAt: now,
  };

  switch (type) {
    case "word":
      return {
        ...baseEntry,
        name: row.name.trim(),
        definition: row.definition?.trim() || undefined,
        partOfSpeech: row.partOfSpeech?.trim() || undefined,
        etymology: row.etymology?.trim() || undefined,
        notes: row.notes?.trim() || undefined,
      };

    case "phrase":
      return {
        ...baseEntry,
        body: row.body.trim(),
        definition: row.definition?.trim() || undefined,
        source: row.source?.trim() || undefined,
        notes: row.notes?.trim() || undefined,
      };

    case "quote":
      return {
        ...baseEntry,
        name: row.name?.trim() || undefined,
        body: row.body.trim(),
        author: row.author.trim(),
        source: row.source?.trim() || undefined,
        notes: row.notes?.trim() || undefined,
      };

    case "hypothetical":
      return {
        ...baseEntry,
        body: row.body.trim(),
        source: row.source?.trim() || undefined,
        notes: row.notes?.trim() || undefined,
      };

    default:
      throw new Error(`Unknown type: ${type}`);
  }
}

async function importCSV(options: ImportOptions): Promise<void> {
  const { filePath, type, dryRun = false } = options;

  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI environment variable is not set");
  }

  console.log(`\n📊 Starting CSV import...`);
  console.log(`   File: ${filePath}`);
  console.log(`   Type: ${type}`);
  console.log(`   Mode: ${dryRun ? "DRY RUN" : "LIVE"}\n`);

  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();
    const db = client.db();
    const collection = db.collection("entries");

    const rows: CSVRow[] = [];
    const errors: string[] = [];

    // Read and parse CSV
    await new Promise<void>((resolve, reject) => {
      createReadStream(filePath)
        .pipe(
          parse({
            columns: true,
            skip_empty_lines: true,
            trim: true,
          })
        )
        .on("data", (row: CSVRow) => rows.push(row))
        .on("error", reject)
        .on("end", resolve);
    });

    console.log(`✓ Parsed ${rows.length} rows from CSV\n`);

    // Validate all rows
    console.log("🔍 Validating rows...");
    for (let i = 0; i < rows.length; i++) {
      const validation = await validateRow(rows[i], type, i + 1);
      if (!validation.valid) {
        errors.push(...validation.errors);
      }
    }

    if (errors.length > 0) {
      console.error("\n❌ Validation errors found:\n");
      errors.forEach((error) => console.error(`   ${error}`));
      throw new Error("Validation failed");
    }

    console.log(`✓ All rows validated successfully\n`);

    // Transform and prepare entries
    const entries = rows.map((row) => transformRow(row, type));

    // Check for duplicate slugs in the import
    const slugs = entries.map((e) => e.slug);
    const duplicateSlugs = slugs.filter(
      (slug, index) => slugs.indexOf(slug) !== index
    );
    if (duplicateSlugs.length > 0) {
      const uniqueDuplicates = Array.from(new Set(duplicateSlugs));
      console.warn(
        `\n⚠️  Warning: Duplicate slugs in import: ${uniqueDuplicates.join(
          ", "
        )}`
      );
    }

    // Check for existing slugs in database
    const existingSlugs = await collection
      .find({ slug: { $in: slugs } })
      .project({ slug: 1 })
      .toArray();

    if (existingSlugs.length > 0) {
      console.warn(
        `\n⚠️  Warning: ${existingSlugs.length} slug(s) already exist in database:`
      );
      existingSlugs.forEach((doc) => console.warn(`   - ${doc.slug}`));
      console.warn("   These entries will be skipped.\n");

      // Filter out existing slugs
      const existingSlugSet = new Set(existingSlugs.map((doc) => doc.slug));
      const filteredEntries = entries.filter(
        (entry) => !existingSlugSet.has(entry.slug)
      );

      if (filteredEntries.length === 0) {
        console.log("❌ No new entries to import after filtering duplicates.");
        return;
      }

      console.log(
        `📝 Proceeding with ${filteredEntries.length} new entries...\n`
      );
      entries.length = 0;
      entries.push(...filteredEntries);
    }

    if (dryRun) {
      console.log("🔍 DRY RUN - Preview of entries to be imported:\n");
      entries.slice(0, 3).forEach((entry, i) => {
        console.log(`Entry ${i + 1}:`);
        console.log(JSON.stringify(entry, null, 2));
        console.log();
      });
      if (entries.length > 3) {
        console.log(`... and ${entries.length - 3} more entries\n`);
      }
      console.log(
        `✓ Dry run complete. ${entries.length} entries would be imported.`
      );
    } else {
      // Insert entries
      const result = await collection.insertMany(entries);
      console.log(`✅ Successfully imported ${result.insertedCount} entries!`);

      // Update tag usage counts
      const allTags = Array.from(new Set(entries.flatMap((e) => e.tags)));
      if (allTags.length > 0) {
        const tagCollection = db.collection("tags");
        for (const tagName of allTags) {
          await tagCollection.updateOne(
            { name: tagName },
            {
              $inc: { usageCount: 1 },
              $setOnInsert: { createdAt: new Date() },
            },
            { upsert: true }
          );
        }
        console.log(`✓ Updated ${allTags.length} tag(s)`);
      }
    }
  } catch (error) {
    console.error("\n❌ Import failed:", error);
    throw error;
  } finally {
    await client.close();
  }
}

// CLI interface
const args = process.argv.slice(2);

if (args.length < 2 || args.includes("--help") || args.includes("-h")) {
  console.log(`
CSV Import Tool for WTQ Database

Usage:
  npm run import -- <file-path> <type> [--dry-run]

Arguments:
  file-path    Path to CSV file
  type         Entry type: word, phrase, quote, or hypothetical
  --dry-run    Preview import without making changes

CSV Format Requirements:

  Words:
    Required: name
    Optional: slug, definition, partOfSpeech, etymology, notes, tags, context, conveyance, topic, tone

  Phrases:
    Required: body
    Optional: slug, definition, source, notes, tags, context, conveyance, topic, tone

  Quotes:
    Required: body, author
    Optional: slug, name, source, notes, tags, topic, authorType, tone

  Hypotheticals:
    Required: body
    Optional: slug, source, notes, tags

  Tags: Comma-separated list (e.g., "philosophy,ethics,ancient")

Examples:
  npm run import -- ./data/words.csv word
  npm run import -- ./data/quotes.csv quote --dry-run
  npm run import -- ../backup/phrases.csv phrase

Note: Slugs are auto-generated if not provided.
`);
  process.exit(0);
}

const filePath = resolve(args[0]);
const type = args[1] as "word" | "phrase" | "quote" | "hypothetical";
const dryRun = args.includes("--dry-run");

const validTypes = ["word", "phrase", "quote", "hypothetical"];
if (!validTypes.includes(type)) {
  console.error(`❌ Invalid type: ${type}`);
  console.error(`   Valid types: ${validTypes.join(", ")}`);
  process.exit(1);
}

importCSV({ filePath, type, dryRun })
  .then(() => {
    console.log("\n✨ Done!\n");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Fatal error:", error.message);
    process.exit(1);
  });
