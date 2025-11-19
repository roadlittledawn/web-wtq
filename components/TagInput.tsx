"use client";

import { useState, useEffect } from "react";
import CreatableSelect from "react-select/creatable";

interface TagOption {
  label: string;
  value: string;
}

interface TagInputProps {
  value: string[]; // Array of selected tag names
  onChange: (tags: string[]) => void;
  error?: string;
  disabled?: boolean;
}

/**
 * TagInput component with autocomplete and tag creation
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
 */
export default function TagInput({
  value,
  onChange,
  error,
  disabled = false,
}: TagInputProps) {
  const [options, setOptions] = useState<TagOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");

  // Fetch tag suggestions based on input
  // Requirement: 9.1
  useEffect(() => {
    const fetchTags = async () => {
      if (inputValue.length === 0) {
        // Load all tags when input is empty
        try {
          const response = await fetch("/.netlify/functions/tags");
          if (response.ok) {
            const data = await response.json();
            const tagOptions = data.tags.map((tag: any) => ({
              label: tag.name,
              value: tag.name,
            }));
            setOptions(tagOptions);
          }
        } catch (err) {
          console.error("Error fetching tags:", err);
        }
        return;
      }

      // Fetch autocomplete suggestions
      setIsLoading(true);
      try {
        const response = await fetch(
          `/.netlify/functions/tags-autocomplete?q=${encodeURIComponent(
            inputValue
          )}`
        );
        if (response.ok) {
          const data = await response.json();
          const tagOptions = data.tags.map((tag: any) => ({
            label: tag.name,
            value: tag.name,
          }));
          setOptions(tagOptions);
        }
      } catch (err) {
        console.error("Error fetching tag suggestions:", err);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchTags, 300);
    return () => clearTimeout(debounceTimer);
  }, [inputValue]);

  // Convert string array to option format
  const selectedOptions: TagOption[] = value.map((tag) => ({
    label: tag,
    value: tag,
  }));

  // Handle tag selection and creation
  // Requirements: 9.2, 9.3
  const handleChange = (newValue: readonly TagOption[] | null) => {
    const tags = newValue ? newValue.map((option) => option.value) : [];
    onChange(tags);
  };

  // Handle input change for autocomplete
  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
  };

  return (
    <div>
      <label
        htmlFor="tags"
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        Tags
      </label>
      <CreatableSelect
        id="tags"
        isMulti
        value={selectedOptions}
        onChange={handleChange}
        onInputChange={handleInputChange}
        options={options}
        isLoading={isLoading}
        isDisabled={disabled}
        placeholder="Select or create tags..."
        className="react-select-container"
        classNamePrefix="react-select"
        formatCreateLabel={(inputValue) => `Create tag "${inputValue}"`}
        styles={{
          control: (base, state) => ({
            ...base,
            borderColor: error
              ? "#fca5a5"
              : state.isFocused
              ? "#3b82f6"
              : "#d1d5db",
            boxShadow: state.isFocused
              ? error
                ? "0 0 0 1px #ef4444"
                : "0 0 0 1px #3b82f6"
              : "none",
            "&:hover": {
              borderColor: error ? "#fca5a5" : "#9ca3af",
            },
          }),
          multiValue: (base) => ({
            ...base,
            backgroundColor: "#dbeafe",
          }),
          multiValueLabel: (base) => ({
            ...base,
            color: "#1e40af",
          }),
          multiValueRemove: (base) => ({
            ...base,
            color: "#1e40af",
            "&:hover": {
              backgroundColor: "#bfdbfe",
              color: "#1e3a8a",
            },
          }),
        }}
      />
      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
      <p className="text-sm text-gray-500 mt-1">
        Select existing tags or type to create new ones
      </p>
    </div>
  );
}
