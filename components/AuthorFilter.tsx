"use client";

import { useState, useEffect } from "react";
import Select from "react-select";

interface Author {
  _id: string;
  firstName: string;
  lastName: string;
  quoteCount: number;
}

interface AuthorOption {
  label: string;
  value: string;
  quoteCount: number;
}

interface AuthorFilterProps {
  selectedAuthors: string[];
  onAuthorToggle: (authorId: string) => void;
  onClearFilters: () => void;
}

export default function AuthorFilter({
  selectedAuthors,
  onAuthorToggle,
  onClearFilters,
}: AuthorFilterProps) {
  const [availableAuthors, setAvailableAuthors] = useState<Author[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAuthors() {
      try {
        setIsLoading(true);
        const response = await fetch("/.netlify/functions/authors?sort=name");
        if (!response.ok) {
          throw new Error("Failed to fetch authors");
        }
        const data = await response.json();
        setAvailableAuthors(data.authors || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load authors");
      } finally {
        setIsLoading(false);
      }
    }

    fetchAuthors();
  }, []);

  // Convert authors to options format with quote count in label
  const authorOptions: AuthorOption[] = availableAuthors.map((author) => {
    const displayName = author.firstName
      ? `${author.lastName}, ${author.firstName}`
      : author.lastName;

    return {
      label: `${displayName} (${author.quoteCount})`,
      value: author._id,
      quoteCount: author.quoteCount,
    };
  });

  // Convert selected authors to option format
  const selectedOptions: AuthorOption[] = selectedAuthors
    .map((authorId) => {
      const author = availableAuthors.find((a) => a._id === authorId);
      if (!author) return null;

      const displayName = author.firstName
        ? `${author.lastName}, ${author.firstName}`
        : author.lastName;

      return {
        label: `${displayName} (${author.quoteCount})`,
        value: author._id,
        quoteCount: author.quoteCount,
      };
    })
    .filter((opt): opt is AuthorOption => opt !== null);

  // Handle author selection
  const handleChange = (newValue: readonly AuthorOption[] | null) => {
    if (!newValue) {
      onClearFilters();
      return;
    }

    const newAuthors = newValue.map((option) => option.value);
    const currentAuthors = selectedAuthors;

    // Find added authors
    const addedAuthors = newAuthors.filter(
      (author) => !currentAuthors.includes(author)
    );
    // Find removed authors
    const removedAuthors = currentAuthors.filter(
      (author) => !newAuthors.includes(author)
    );

    // Toggle added authors
    addedAuthors.forEach((author) => onAuthorToggle(author));
    // Toggle removed authors
    removedAuthors.forEach((author) => onAuthorToggle(author));
  };

  if (error) {
    return (
      <div className="bg-dark-bg-secondary border-2 border-dark-border rounded-lg p-4">
        <h3 className="text-lg font-semibold text-dark-text mb-3">
          Filter by Author
        </h3>
        <p className="text-accent-pink text-sm">{error}</p>
      </div>
    );
  }

  if (!isLoading && availableAuthors.length === 0) {
    return (
      <div className="bg-dark-bg-secondary border-2 border-dark-border rounded-lg p-4">
        <h3 className="text-lg font-semibold text-dark-text mb-3">
          Filter by Author
        </h3>
        <p className="text-dark-text-secondary text-sm">No authors available</p>
      </div>
    );
  }

  return (
    <div className="bg-dark-bg-secondary border-2 border-dark-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-dark-text">
          Filter by Author
        </h3>
        {selectedAuthors.length > 0 && (
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
        options={authorOptions}
        isLoading={isLoading}
        placeholder="Search and select authors..."
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
        {availableAuthors.length} author
        {availableAuthors.length !== 1 ? "s" : ""} available
        {selectedAuthors.length > 0 && ` • ${selectedAuthors.length} selected`}
      </p>
    </div>
  );
}
