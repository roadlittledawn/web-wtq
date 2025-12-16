"use client";

import { useState, FormEvent } from "react";
import SlugInput from "./SlugInput";
import TagInput from "./TagInput";
import MarkdownEditor from "./MarkdownEditor";
import { HypotheticalEntry } from "@/types/models";

interface HypotheticalFormProps {
  initialData?: Partial<HypotheticalEntry>;
  onSubmit: (data: HypotheticalFormData) => Promise<void>;
  onCancel?: () => void;
  onDelete?: () => void;
}

export interface HypotheticalFormData {
  type: "hypothetical";
  slug: string;
  body: string;
  source?: string;
  notes?: string;
  tags: string[];
}

/**
 * HypotheticalForm component for creating/editing hypothetical entries
 * Requirement: 2.5
 */
export default function HypotheticalForm({
  initialData,
  onSubmit,
  onCancel,
  onDelete,
}: HypotheticalFormProps) {
  const [formData, setFormData] = useState<HypotheticalFormData>({
    type: "hypothetical",
    slug: initialData?.slug || "",
    body: initialData?.body || "",
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

    if (!formData.slug.trim()) {
      newErrors.slug = "Slug is required";
    }
    if (!formData.body.trim()) {
      newErrors.body = "Body is required";
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
          htmlFor="body"
          className="block text-sm font-semibold text-white mb-1"
        >
          Hypothetical Scenario <span className="text-red-500">*</span>
        </label>
        <MarkdownEditor
          id="body"
          name="body"
          value={formData.body}
          onChange={handleChange}
          disabled={isSubmitting}
          rows={5}
          placeholder="Describe the hypothetical scenario with Markdown formatting..."
          error={errors.body}
        />
        {errors.body && (
          <p className="text-sm text-red-600 mt-1">{errors.body}</p>
        )}
      </div>

      <SlugInput
        value={formData.slug}
        onChange={handleSlugChange}
        sourceText={formData.body}
        excludeId={initialData?._id?.toString()}
        error={errors.slug}
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
          placeholder="Where did this hypothetical come from?"
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

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Saving..." : "Save Hypothetical"}
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
