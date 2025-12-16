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
            const tagOptions = data.tags.map((tag: { name: string }) => ({
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
          const tagOptions = data.tags.map((tag: { name: string }) => ({
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
        className="block text-sm font-semibold text-white mb-1"
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
            backgroundColor: "#161b22",
            borderColor: error
              ? "#ff006e"
              : state.isFocused
              ? "#06ffa5"
              : "#30363d",
            borderWidth: "2px",
            boxShadow: "none",
            color: "#e6edf3",
            "&:hover": {
              borderColor: error ? "#ff006e" : "#06ffa5",
            },
          }),
          menu: (base) => ({
            ...base,
            backgroundColor: "#161b22",
            border: "2px solid #30363d",
          }),
          option: (base, state) => ({
            ...base,
            backgroundColor: state.isFocused
              ? "#21262d"
              : state.isSelected
              ? "#06ffa5"
              : "#161b22",
            color: state.isSelected ? "#0d1117" : "#e6edf3",
            "&:hover": {
              backgroundColor: "#21262d",
            },
          }),
          input: (base) => ({
            ...base,
            color: "#e6edf3",
          }),
          placeholder: (base) => ({
            ...base,
            color: "#6e7681",
          }),
          singleValue: (base) => ({
            ...base,
            color: "#e6edf3",
          }),
          multiValue: (base) => ({
            ...base,
            backgroundColor: "#06ffa5",
            border: "1px solid #00d98a",
          }),
          multiValueLabel: (base) => ({
            ...base,
            color: "#0d1117",
            fontWeight: "600",
          }),
          multiValueRemove: (base) => ({
            ...base,
            color: "#0d1117",
            "&:hover": {
              backgroundColor: "#00d98a",
              color: "#0d1117",
            },
          }),
          loadingIndicator: (base) => ({
            ...base,
            color: "#06ffa5",
          }),
          dropdownIndicator: (base) => ({
            ...base,
            color: "#8b949e",
            "&:hover": {
              color: "#06ffa5",
            },
          }),
          clearIndicator: (base) => ({
            ...base,
            color: "#8b949e",
            "&:hover": {
              color: "#ff006e",
            },
          }),
        }}
      />
      {error && <p className="text-sm text-accent-pink mt-1">{error}</p>}
      <p className="text-sm text-dark-text-secondary mt-1">
        Select existing tags or type to create new ones
      </p>
    </div>
  );
}
