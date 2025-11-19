"use client";

import { useState, FormEvent } from "react";
import SlugInput from "./SlugInput";
import TagInput from "./TagInput";
import { WordEntry } from "@/types/models";

interface WordFormProps {
  initialData?: Partial<WordEntry>;
  onSubmit: (data: WordFormData) => Promise<void>;
  onCancel?: () => void;
}

export interface WordFormData {
  type: "word";
  name: string;
  slug: string;
  definition: string;
  partOfSpeech?: string;
  etymology?: string;
  notes?: string;
  tags: string[];
}

/**
 * WordForm component for creating/editing word entries
 * Requirement: 2.2
 */
export default function WordForm({
  initialData,
  onSubmit,
  onCancel,
}: WordFormProps) {
  const [formData, setFormData] = useState<WordFormData>({
    type: "word",
    name: initialData?.name || "",
    slug: initialData?.slug || "",
    definition: initialData?.definition || "",
    partOfSpeech: initialData?.partOfSpeech || "",
    etymology: initialData?.etymology || "",
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
    // Clear error for this field
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
    if (!formData.definition.trim()) {
      newErrors.definition = "Definition is required";
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
          htmlFor="definition"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Definition <span className="text-red-500">*</span>
        </label>
        <textarea
          id="definition"
          name="definition"
          value={formData.definition}
          onChange={handleChange}
          disabled={isSubmitting}
          rows={3}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
            errors.definition
              ? "border-red-300 focus:ring-red-500"
              : "border-gray-300 focus:ring-blue-500"
          } disabled:bg-gray-100`}
        />
        {errors.definition && (
          <p className="text-sm text-red-600 mt-1">{errors.definition}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="partOfSpeech"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Part of Speech
        </label>
        <input
          type="text"
          id="partOfSpeech"
          name="partOfSpeech"
          value={formData.partOfSpeech}
          onChange={handleChange}
          disabled={isSubmitting}
          placeholder="e.g., noun, verb, adjective"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
        />
      </div>

      <div>
        <label
          htmlFor="etymology"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Etymology
        </label>
        <textarea
          id="etymology"
          name="etymology"
          value={formData.etymology}
          onChange={handleChange}
          disabled={isSubmitting}
          rows={2}
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
          {isSubmitting ? "Saving..." : "Save Word"}
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
