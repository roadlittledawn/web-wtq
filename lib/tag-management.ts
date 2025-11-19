import { Db, ObjectId } from "mongodb";
import { Tag } from "../types/models";

/**
 * Create new tags when they don't exist and update usage counts
 * Associates tags with entries
 * Requirements: 9.2, 9.3
 */
export async function syncTags(
  db: Db,
  newTags: string[],
  oldTags: string[] = []
): Promise<void> {
  if (newTags.length === 0 && oldTags.length === 0) {
    return;
  }

  const tagsCollection = db.collection<Tag>("tags");

  // Determine which tags were added and which were removed
  const addedTags = newTags.filter((tag) => !oldTags.includes(tag));
  const removedTags = oldTags.filter((tag) => !newTags.includes(tag));

  // Process added tags
  for (const tagName of addedTags) {
    const existingTag = await tagsCollection.findOne({ name: tagName });

    if (existingTag) {
      // Tag exists, increment usage count
      await tagsCollection.updateOne(
        { name: tagName },
        { $inc: { usageCount: 1 } }
      );
    } else {
      // Tag doesn't exist, create it
      const newTag: Tag = {
        _id: new ObjectId(),
        name: tagName,
        usageCount: 1,
        createdAt: new Date(),
      };
      await tagsCollection.insertOne(newTag);
    }
  }

  // Process removed tags
  for (const tagName of removedTags) {
    const existingTag = await tagsCollection.findOne({ name: tagName });

    if (existingTag && existingTag.usageCount > 0) {
      // Decrement usage count
      await tagsCollection.updateOne(
        { name: tagName },
        { $inc: { usageCount: -1 } }
      );
    }
  }
}

/**
 * Remove tag associations from entries and update tag usage counts
 * Requirements: 9.4
 */
export async function removeTagsFromEntry(
  db: Db,
  tags: string[]
): Promise<void> {
  if (tags.length === 0) {
    return;
  }

  const tagsCollection = db.collection<Tag>("tags");

  // Decrement usage count for each tag
  for (const tagName of tags) {
    const existingTag = await tagsCollection.findOne({ name: tagName });

    if (existingTag && existingTag.usageCount > 0) {
      await tagsCollection.updateOne(
        { name: tagName },
        { $inc: { usageCount: -1 } }
      );
    }
  }
}
