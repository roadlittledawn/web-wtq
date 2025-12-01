"use client";

import { useState, useEffect } from "react";
import CreatableSelect from "react-select/creatable";

interface Author {
  _id: string;
  firstName: string;
  lastName: string;
  quoteCount: number;
}

interface AuthorOption {
  label: string;
  value: string;
  author: Author;
}

interface AuthorSelectProps {
  value: string | null; // Author ID or temporary new author name
  onChange: (authorId: string | null, authorName?: string) => void;
  error?: string;
  disabled?: boolean;
}

/**
 * AuthorSelect component for selecting a single author
 * Fetches authors from API and provides searchable dropdown
 */
export default function AuthorSelect({
  value,
  onChange,
  error,
  disabled = false,
}: AuthorSelectProps) {
  const [options, setOptions] = useState<AuthorOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");

  // Fetch authors based on search input
  useEffect(() => {
    const fetchAuthors = async () => {
      setIsLoading(true);
      try {
        // Always sort alphabetically by name (lastName, firstName)
        const params = new URLSearchParams({ sort: "name" });
        if (inputValue) {
          params.append("q", inputValue);
        }
        const url = `/.netlify/functions/authors?${params.toString()}`;

        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          const authorOptions = data.authors.map((author: Author) => {
            // Format display name
            const displayName = author.firstName
              ? `${author.lastName}, ${author.firstName}`
              : author.lastName;

            return {
              label: `${displayName} (${author.quoteCount})`,
              value: author._id,
              author,
            };
          });
          setOptions(authorOptions);
        }
      } catch (err) {
        console.error("Error fetching authors:", err);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchAuthors, 300);
    return () => clearTimeout(debounceTimer);
  }, [inputValue]);

  // Fetch the selected author if value is provided but not in options
  useEffect(() => {
    const fetchSelectedAuthor = async () => {
      // Only fetch if we have a value that looks like an ObjectId and it's not in options
      if (
        value &&
        value.match(/^[0-9a-f]{24}$/i) &&
        !options.find((opt) => opt.value === value)
      ) {
        setIsLoading(true);
        try {
          const response = await fetch(
            `/.netlify/functions/authors?id=${value}`
          );
          if (response.ok) {
            const author = await response.json();
            const displayName = author.firstName
              ? `${author.lastName}, ${author.firstName}`
              : author.lastName;

            const authorOption: AuthorOption = {
              label: `${displayName} (${author.quoteCount})`,
              value: author._id,
              author,
            };

            // Add to options if not already present
            setOptions((prev) => {
              if (!prev.find((opt) => opt.value === value)) {
                return [...prev, authorOption];
              }
              return prev;
            });
          }
        } catch (err) {
          console.error("Error fetching selected author:", err);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchSelectedAuthor();
  }, [value, options]);

  // Find selected option
  // If value doesn't match any existing author, it might be a new author name
  const selectedOption =
    options.find((opt) => opt.value === value) ||
    (value && !value.match(/^[0-9a-f]{24}$/i)
      ? {
          label: value,
          value: value,
          author: null as any,
        }
      : null);

  // Handle selection change
  const handleChange = (newValue: AuthorOption | null) => {
    if (!newValue) {
      onChange(null);
      return;
    }

    // If it's an existing author (has _id), pass the ID
    // If it's a new author (created via input), pass the name
    if (newValue.author && newValue.author._id) {
      onChange(newValue.value);
    } else {
      // New author - pass null for ID and the name as second parameter
      onChange(null, newValue.value);
    }
  };

  // Handle creating a new author
  const handleCreate = (inputValue: string) => {
    // Create a temporary option for the new author
    const newOption: AuthorOption = {
      label: `${inputValue} (new author)`,
      value: inputValue,
      author: null as any,
    };

    // Add to options temporarily
    setOptions((prev) => [...prev, newOption]);

    // Notify parent with the new author name
    onChange(null, inputValue);
  };

  // Handle input change for search
  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
  };

  return (
    <div>
      <label
        htmlFor="author"
        className="block text-sm font-semibold text-white mb-1"
      >
        Author <span className="text-red-500">*</span>
      </label>
      <CreatableSelect
        id="author"
        value={selectedOption}
        onChange={handleChange}
        onInputChange={handleInputChange}
        onCreateOption={handleCreate}
        options={options}
        isLoading={isLoading}
        isDisabled={disabled}
        isClearable
        placeholder="Search or create an author..."
        className="react-select-container"
        classNamePrefix="react-select"
        formatCreateLabel={(inputValue) => `Create author "${inputValue}"`}
        noOptionsMessage={() =>
          inputValue
            ? `No authors found. Press Enter to create "${inputValue}"`
            : "Start typing to search authors..."
        }
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
      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
      <p className="text-sm text-dark-text-secondary mt-1">
        Select an existing author or type a name to create a new one
      </p>
    </div>
  );
}
