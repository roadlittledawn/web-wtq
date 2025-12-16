"use client";

import { useState, FormEvent } from "react";
import SlugInput from "./SlugInput";
import TagInput from "./TagInput";
import AuthorSelect from "./AuthorSelect";
import SuggestedTags from "./SuggestedTags";
import MarkdownEditor from "./MarkdownEditor";
import { QuoteEntry } from "@/types/models";

interface QuoteFormProps {
  initialData?: Partial<QuoteEntry>;
  onSubmit: (data: QuoteFormData) => Promise<void>;
  onCancel?: () => void;
  onDelete?: () => void;
}

export interface QuoteFormData {
  type: "quote";
  name?: string;
  slug: string;
  body: string;
  author: string; // Kept for backward compatibility
  authorId?: string; // New field for author reference
  source?: string;
  notes?: string;
  tags: string[];
}

/**
 * QuoteForm component for creating/editing quote entries
 * Requirement: 2.4
 */
export default function QuoteForm({
  initialData,
  onSubmit,
  onCancel,
  onDelete,
}: QuoteFormProps) {
  const [formData, setFormData] = useState<QuoteFormData>({
    type: "quote",
    name: initialData?.name || "",
    slug: initialData?.slug || "",
    body: initialData?.body || "",
    author: initialData?.author || "",
    authorId: initialData?.authorId?.toString() || "",
    source: initialData?.source || "",
    notes: initialData?.notes || "",
    tags: initialData?.tags || [],
  });

  // Track the currently selected author value for the AuthorSelect component
  // This should be authorId if it exists, otherwise the author name (for new authors), otherwise null
  const authorSelectValue = formData.authorId || formData.author || null;

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [isSuggestingTags, setIsSuggestingTags] = useState(false);
  const [suggestError, setSuggestError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSlugChange = (slug: string) => {
    setFormData((prev) => ({ ...prev, slug }));
    if (errors.slug) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.slug;
        return newErrors;
      });
    }
  };

  const handleTagsChange = (tags: string[]) => {
    setFormData((prev) => ({ ...prev, tags }));
  };

  const handleSuggestTags = async () => {
    if (!formData.body.trim()) {
      setSuggestError("Please enter quote text first");
      return;
    }

    setIsSuggestingTags(true);
    setSuggestError(null);

    try {
      const response = await fetch("/.netlify/functions/suggest-tags", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          body: formData.body,
          type: "quote",
          author: formData.author || undefined,
          source: formData.source || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get tag suggestions");
      }

      const data = await response.json();
      setSuggestedTags(data.tags || []);
    } catch (err) {
      console.error("Error suggesting tags:", err);
      setSuggestError("Failed to get AI suggestions. Please try again.");
    } finally {
      setIsSuggestingTags(false);
    }
  };

  const handleSuggestedTagClick = (tag: string) => {
    if (!formData.tags.includes(tag)) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tag],
      }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.slug.trim()) {
      newErrors.slug = "Slug is required";
    }
    if (!formData.body.trim()) {
      newErrors.body = "Body is required";
    }
    // Author is required - either authorId (existing) or author (new)
    if (
      (!formData.authorId || !formData.authorId.trim()) &&
      (!formData.author || !formData.author.trim())
    ) {
      newErrors.authorId = "Author is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (err) {
      console.error("Form submission error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-semibold text-white mb-1"
        >
          Name
          <span className="text-gray-400 text-xs ml-2">
            (Optional title or identifier for this quote)
          </span>
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          disabled={isSubmitting}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
        />
      </div>

      <SlugInput
        value={formData.slug}
        onChange={handleSlugChange}
        sourceText={formData.name || formData.body}
        excludeId={initialData?._id?.toString()}
        error={errors.slug}
        disabled={isSubmitting}
      />

      <div>
        <label
          htmlFor="body"
          className="block text-sm font-semibold text-white mb-1"
        >
          Quote Text <span className="text-red-500">*</span>
        </label>
        <MarkdownEditor
          id="body"
          name="body"
          value={formData.body}
          onChange={handleChange}
          disabled={isSubmitting}
          rows={4}
          placeholder="Enter the quote with Markdown formatting..."
          error={errors.body}
        />
        {errors.body && (
          <p className="text-sm text-red-600 mt-1">{errors.body}</p>
        )}

        <AuthorSelect
          value={authorSelectValue}
          onChange={(authorId, authorName) => {
            if (authorId) {
              // Existing author selected
              setFormData((prev) => ({
                ...prev,
                authorId: authorId,
                author: "",
              }));
            } else if (authorName) {
              // New author created - store the name temporarily
              setFormData((prev) => ({
                ...prev,
                authorId: "",
                author: authorName,
              }));
            } else {
              // Cleared
              setFormData((prev) => ({ ...prev, authorId: "", author: "" }));
            }
            // Clear error when author changes
            if (errors.authorId) {
              setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors.authorId;
                return newErrors;
              });
            }
          }}
          error={errors.authorId}
          disabled={isSubmitting}
        />

        <div>
          <label
            htmlFor="source"
            className="block text-sm font-semibold text-white mb-1"
          >
            Source
          </label>
          <input
            type="text"
            id="source"
            name="source"
            value={formData.source}
            onChange={handleChange}
            disabled={isSubmitting}
            placeholder="Book, speech, interview, etc."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
        </div>

        <div>
          <label
            htmlFor="notes"
            className="block text-sm font-semibold text-white mb-1"
          >
            Notes
          </label>
          <MarkdownEditor
            id="notes"
            name="notes"
            value={formData.notes || ""}
            onChange={handleChange}
            disabled={isSubmitting}
            rows={3}
            placeholder="Add notes with Markdown formatting..."
          />
        </div>

        <TagInput
          value={formData.tags}
          onChange={handleTagsChange}
          disabled={isSubmitting}
        />

        <button
          type="button"
          onClick={handleSuggestTags}
          disabled={isSuggestingTags || isSubmitting || !formData.body.trim()}
          className="mt-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium"
        >
          {isSuggestingTags ? "Suggesting..." : "✨ Suggest Tags with AI"}
        </button>
        {suggestError && (
          <p className="text-sm text-red-600 mt-1">{suggestError}</p>
        )}
      </div>

      {suggestedTags.length > 0 && (
        <SuggestedTags
          suggestions={suggestedTags}
          onTagClick={handleSuggestedTagClick}
          selectedTags={formData.tags}
        />
      )}

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Saving..." : "Save Quote"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            disabled={isSubmitting}
            className="px-6 py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Delete
          </button>
        )}
      </div>
    </form>
  );
}
