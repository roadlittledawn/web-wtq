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
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
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
          className="block text-sm font-medium text-dark-text mb-1"
        >
          Name <span className="text-accent-pink">*</span>
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          disabled={isSubmitting}
          className={`w-full px-3 py-2 bg-dark-bg-secondary border-2 rounded-md focus:outline-none text-dark-text ${
            errors.name
              ? "border-accent-pink focus:border-accent-pink"
              : "border-dark-border focus:border-accent-teal"
          } disabled:bg-dark-bg-tertiary disabled:text-dark-text-muted`}
        />
        {errors.name && (
          <p className="text-sm text-accent-pink mt-1">{errors.name}</p>
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
          className="block text-sm font-medium text-dark-text mb-1"
        >
          Definition <span className="text-accent-pink">*</span>
        </label>
        <textarea
          id="definition"
          name="definition"
          value={formData.definition}
          onChange={handleChange}
          disabled={isSubmitting}
          rows={3}
          className={`w-full px-3 py-2 bg-dark-bg-secondary border-2 rounded-md focus:outline-none text-dark-text ${
            errors.definition
              ? "border-accent-pink focus:border-accent-pink"
              : "border-dark-border focus:border-accent-teal"
          } disabled:bg-dark-bg-tertiary disabled:text-dark-text-muted`}
        />
        {errors.definition && (
          <p className="text-sm text-accent-pink mt-1">{errors.definition}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="partOfSpeech"
          className="block text-sm font-medium text-dark-text mb-1"
        >
          Part of Speech
        </label>
        <select
          id="partOfSpeech"
          name="partOfSpeech"
          value={formData.partOfSpeech}
          onChange={handleChange}
          disabled={isSubmitting}
          className="w-full px-3 py-2 bg-dark-bg-secondary border-2 border-dark-border rounded-md focus:outline-none focus:border-accent-teal text-dark-text disabled:bg-dark-bg-tertiary disabled:text-dark-text-muted"
        >
          <option value="">Select part of speech</option>
          <option value="noun">noun</option>
          <option value="pronoun">pronoun</option>
          <option value="verb">verb</option>
          <option value="adjective">adjective</option>
          <option value="adverb">adverb</option>
          <option value="interjection">interjection</option>
        </select>
      </div>

      <div>
        <label
          htmlFor="etymology"
          className="block text-sm font-medium text-dark-text mb-1"
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
          className="w-full px-3 py-2 bg-dark-bg-secondary border-2 border-dark-border rounded-md focus:outline-none focus:border-accent-teal text-dark-text disabled:bg-dark-bg-tertiary disabled:text-dark-text-muted"
        />
      </div>

      <div>
        <label
          htmlFor="notes"
          className="block text-sm font-medium text-dark-text mb-1"
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
          className="w-full px-3 py-2 bg-dark-bg-secondary border-2 border-dark-border rounded-md focus:outline-none focus:border-accent-teal text-dark-text disabled:bg-dark-bg-tertiary disabled:text-dark-text-muted"
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
          className="px-6 py-2 bg-accent-teal text-dark-bg font-semibold rounded-md hover:bg-accent-teal-dark focus:outline-none focus:ring-2 focus:ring-accent-teal disabled:bg-dark-border disabled:cursor-not-allowed disabled:text-dark-text-muted"
        >
          {isSubmitting ? "Saving..." : "Save Word"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-6 py-2 bg-dark-bg-tertiary text-dark-text border-2 border-dark-border rounded-md hover:bg-dark-border focus:outline-none focus:ring-2 focus:ring-dark-border disabled:bg-dark-bg-tertiary disabled:cursor-not-allowed disabled:text-dark-text-muted"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
