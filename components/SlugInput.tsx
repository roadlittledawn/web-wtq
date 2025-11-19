"use client";

import { useState, useEffect } from "react";
import { generateSlug } from "@/lib/slug";

interface SlugInputProps {
  value: string;
  onChange: (slug: string) => void;
  sourceText?: string; // Text to auto-generate slug from (name or body)
  excludeId?: string; // Entry ID to exclude when checking uniqueness (for updates)
  error?: string;
  disabled?: boolean;
}

/**
 * SlugInput component with auto-generation and uniqueness validation
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6
 */
export default function SlugInput({
  value,
  onChange,
  sourceText,
  excludeId,
  error,
  disabled = false,
}: SlugInputProps) {
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string>("");
  const [isManuallyEdited, setIsManuallyEdited] = useState(false);

  // Auto-generate slug from sourceText when it changes
  // Requirements: 10.1, 10.2
  useEffect(() => {
    if (sourceText && !isManuallyEdited && !value) {
      const generatedSlug = generateSlug(sourceText);
      onChange(generatedSlug);
    }
  }, [sourceText, isManuallyEdited, value, onChange]);

  // Validate slug uniqueness on blur
  // Requirement: 10.4
  const handleBlur = async () => {
    if (!value) {
      setValidationError("Slug is required");
      return;
    }

    setIsValidating(true);
    setValidationError("");

    try {
      const params = new URLSearchParams({ slug: value });
      if (excludeId) {
        params.append("excludeId", excludeId);
      }

      const response = await fetch(
        `/.netlify/functions/validate-slug?${params.toString()}`
      );
      const data = await response.json();

      if (!response.ok) {
        setValidationError(data.error?.message || "Validation failed");
        return;
      }

      // Requirement: 10.5
      if (!data.isUnique) {
        setValidationError(
          "This slug is already in use. Please choose a different one."
        );
      }
    } catch (err) {
      console.error("Slug validation error:", err);
      setValidationError("Failed to validate slug uniqueness");
    } finally {
      setIsValidating(false);
    }
  };

  // Handle manual editing
  // Requirement: 10.3
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setIsManuallyEdited(true);
    setValidationError("");
    onChange(newValue);
  };

  const displayError = error || validationError;

  return (
    <div>
      <label
        htmlFor="slug"
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        Slug
        <span className="text-gray-500 text-xs ml-2">
          (URL-friendly identifier)
        </span>
      </label>
      <input
        type="text"
        id="slug"
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        disabled={disabled || isValidating}
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
          displayError
            ? "border-red-300 focus:ring-red-500"
            : "border-gray-300 focus:ring-blue-500"
        } disabled:bg-gray-100 disabled:cursor-not-allowed`}
        placeholder="auto-generated-from-name"
      />
      {isValidating && (
        <p className="text-sm text-gray-500 mt-1">Validating slug...</p>
      )}
      {displayError && (
        <p className="text-sm text-red-600 mt-1">{displayError}</p>
      )}
      {!displayError && !isValidating && value && (
        <p className="text-sm text-gray-500 mt-1">URL: /entries/{value}</p>
      )}
    </div>
  );
}
