"use client";

import { useState } from "react";
import TagFilter from "./TagFilter";

interface SearchBarProps {
  onSearch: (query: string, type?: string, tags?: string[]) => void;
  initialQuery?: string;
  initialType?: string;
  initialTags?: string[];
}

export default function SearchBar({
  onSearch,
  initialQuery = "",
  initialType = "",
  initialTags = [],
}: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const [selectedType, setSelectedType] = useState(initialType);
  const [selectedTags, setSelectedTags] = useState<string[]>(initialTags);

  // Handle search submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(
      query,
      selectedType || undefined,
      selectedTags.length > 0 ? selectedTags : undefined
    );
  };

  // Handle tag toggle
  const handleTagToggle = (tagName: string) => {
    setSelectedTags((prev) => {
      if (prev.includes(tagName)) {
        return prev.filter((t) => t !== tagName);
      } else {
        return [...prev, tagName];
      }
    });
  };

  // Handle clear filters
  const handleClearFilters = () => {
    setSelectedType("");
    setSelectedTags([]);
  };

  // Handle clear tags only
  const handleClearTags = () => {
    setSelectedTags([]);
  };

  const hasFilters = selectedType || selectedTags.length > 0;

  return (
    <div className="bg-dark-bg-secondary border-2 border-dark-border rounded-lg p-6 space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Search Input */}
        <div>
          <label
            htmlFor="search-query"
            className="block text-sm font-medium text-dark-text mb-2"
          >
            Search
          </label>
          <input
            id="search-query"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search entries..."
            className="w-full px-4 py-2 bg-dark-bg-tertiary border-2 border-dark-border rounded-lg focus:outline-none focus:border-accent-teal text-dark-text placeholder:text-dark-text-muted"
          />
        </div>

        {/* Entry Type Filter */}
        <div>
          <label
            htmlFor="entry-type"
            className="block text-sm font-medium text-dark-text mb-2"
          >
            Entry Type
          </label>
          <select
            id="entry-type"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full px-4 py-2 bg-dark-bg-tertiary border-2 border-dark-border rounded-lg focus:outline-none focus:border-accent-teal text-dark-text"
          >
            <option value="">All Types</option>
            <option value="word">Words</option>
            <option value="phrase">Phrases</option>
            <option value="quote">Quotes</option>
            <option value="hypothetical">Hypotheticals</option>
          </select>
        </div>

        {/* Tag Filter Selection */}
        <TagFilter
          selectedTags={selectedTags}
          onTagToggle={handleTagToggle}
          onClearFilters={handleClearTags}
        />

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            type="submit"
            className="flex-1 bg-accent-teal text-dark-bg px-6 py-2 rounded-lg hover:bg-accent-teal-dark transition-colors font-semibold"
          >
            Search
          </button>
          {hasFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="px-6 py-2 border-2 border-dark-border text-dark-text rounded-lg hover:bg-dark-border transition-colors font-medium"
            >
              Clear Filters
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
