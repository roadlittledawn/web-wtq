"use client";

import { useState, useEffect } from "react";
import Select from "react-select";

interface Tag {
  name: string;
  usageCount: number;
}

interface TagOption {
  label: string;
  value: string;
  usageCount: number;
}

interface TagFilterProps {
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
  onClearFilters: () => void;
  entryType?: "word" | "phrase" | "quote" | "hypothetical";
}

export default function TagFilter({
  selectedTags,
  onTagToggle,
  onClearFilters,
  entryType,
}: TagFilterProps) {
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTags() {
      try {
        setIsLoading(true);
        const url = entryType
          ? `/.netlify/functions/tags?type=${entryType}`
          : "/.netlify/functions/tags";
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error("Failed to fetch tags");
        }
        const data = await response.json();
        setAvailableTags(data.tags || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load tags");
      } finally {
        setIsLoading(false);
      }
    }

    fetchTags();
  }, [entryType]);

  // Convert tags to options format with usage count in label
  const tagOptions: TagOption[] = availableTags.map((tag) => ({
    label: `${tag.name} (${tag.usageCount})`,
    value: tag.name,
    usageCount: tag.usageCount,
  }));

  // Convert selected tags to option format
  const selectedOptions: TagOption[] = selectedTags
    .map((tagName) => {
      const tag = availableTags.find((t) => t.name === tagName);
      return tag
        ? {
            label: `${tag.name} (${tag.usageCount})`,
            value: tag.name,
            usageCount: tag.usageCount,
          }
        : null;
    })
    .filter((opt): opt is TagOption => opt !== null);

  // Handle tag selection
  const handleChange = (newValue: readonly TagOption[] | null) => {
    if (!newValue) {
      onClearFilters();
      return;
    }

    const newTags = newValue.map((option) => option.value);
    const currentTags = selectedTags;

    // Find added tags
    const addedTags = newTags.filter((tag) => !currentTags.includes(tag));
    // Find removed tags
    const removedTags = currentTags.filter((tag) => !newTags.includes(tag));

    // Toggle added tags
    addedTags.forEach((tag) => onTagToggle(tag));
    // Toggle removed tags
    removedTags.forEach((tag) => onTagToggle(tag));
  };

  if (error) {
    return (
      <div className="bg-dark-bg-secondary border-2 border-dark-border rounded-lg p-4">
        <h3 className="text-lg font-semibold text-dark-text mb-3">
          Filter by Tags
        </h3>
        <p className="text-accent-pink text-sm">{error}</p>
      </div>
    );
  }

  if (!isLoading && availableTags.length === 0) {
    return (
      <div className="bg-dark-bg-secondary border-2 border-dark-border rounded-lg p-4">
        <h3 className="text-lg font-semibold text-dark-text mb-3">
          Filter by Tags
        </h3>
        <p className="text-dark-text-secondary text-sm">No tags available</p>
      </div>
    );
  }

  return (
    <div className="bg-dark-bg-secondary border-2 border-dark-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-dark-text">Filter by Tags</h3>
        {selectedTags.length > 0 && (
          <button
            onClick={onClearFilters}
            className="text-sm text-accent-teal hover:text-accent-teal-dark underline"
          >
            Clear all
          </button>
        )}
      </div>

      <Select
        isMulti
        value={selectedOptions}
        onChange={handleChange}
        options={tagOptions}
        isLoading={isLoading}
        placeholder="Search and select tags..."
        className="react-select-container"
        classNamePrefix="react-select"
        styles={{
          control: (base, state) => ({
            ...base,
            backgroundColor: "#161b22",
            borderColor: state.isFocused ? "#06ffa5" : "#30363d",
            borderWidth: "2px",
            boxShadow: "none",
            color: "#e6edf3",
            "&:hover": {
              borderColor: "#06ffa5",
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

      <p className="text-sm text-dark-text-secondary mt-2">
        {availableTags.length} tag{availableTags.length !== 1 ? "s" : ""}{" "}
        available
        {selectedTags.length > 0 && ` • ${selectedTags.length} selected`}
      </p>
    </div>
  );
}
