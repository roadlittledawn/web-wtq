"use client";

import { useState, FormEvent } from "react";
import SlugInput from "./SlugInput";
import TagInput from "./TagInput";
import { QuoteEntry } from "@/types/models";

interface QuoteFormProps {
  initialData?: Partial<QuoteEntry>;
  onSubmit: (data: QuoteFormData) => Promise<void>;
  onCancel?: () => void;
}

export interface QuoteFormData {
  type: "quote";
  name: string;
  slug: string;
  body: string;
  author: string;
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
}: QuoteFormProps) {
  const [formData, setFormData] = useState<QuoteFormData>({
    type: "quote",
    name: initialData?.name || "",
    slug: initialData?.slug || "",
    body: initialData?.body || "",
    author: initialData?.author || "",
    source: initialData?.source || "",
    notes: initialData?.notes || "",
    tags: initialData?.tags || [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }
    if (!formData.slug.trim()) {
      newErrors.slug = "Slug is required";
    }
    if (!formData.body.trim()) {
      newErrors.body = "Body is required";
    }
    if (!formData.author.trim()) {
      newErrors.author = "Author is required";
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
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Name <span className="text-red-500">*</span>
          <span className="text-gray-500 text-xs ml-2">
            (Title or identifier for this quote)
          </span>
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          disabled={isSubmitting}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
            errors.name
              ? "border-red-300 focus:ring-red-500"
              : "border-gray-300 focus:ring-blue-500"
          } disabled:bg-gray-100`}
        />
        {errors.name && (
          <p className="text-sm text-red-600 mt-1">{errors.name}</p>
        )}
      </div>

      <SlugInput
        value={formData.slug}
        onChange={handleSlugChange}
        sourceText={formData.name}
        excludeId={initialData?._id?.toString()}
        error={errors.slug}
        disabled={isSubmitting}
      />

      <div>
        <label
          htmlFor="body"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Quote Text <span className="text-red-500">*</span>
        </label>
        <textarea
          id="body"
          name="body"
          value={formData.body}
          onChange={handleChange}
          disabled={isSubmitting}
          rows={4}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
            errors.body
              ? "border-red-300 focus:ring-red-500"
              : "border-gray-300 focus:ring-blue-500"
          } disabled:bg-gray-100`}
          placeholder="The actual quote text..."
        />
        {errors.body && (
          <p className="text-sm text-red-600 mt-1">{errors.body}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="author"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Author <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="author"
          name="author"
          value={formData.author}
          onChange={handleChange}
          disabled={isSubmitting}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
            errors.author
              ? "border-red-300 focus:ring-red-500"
              : "border-gray-300 focus:ring-blue-500"
          } disabled:bg-gray-100`}
        />
        {errors.author && (
          <p className="text-sm text-red-600 mt-1">{errors.author}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="source"
          className="block text-sm font-medium text-gray-700 mb-1"
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
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          disabled={isSubmitting}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
        />
      </div>

      <TagInput
        value={formData.tags}
        onChange={handleTagsChange}
        disabled={isSubmitting}
      />

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
      </div>
    </form>
  );
}
