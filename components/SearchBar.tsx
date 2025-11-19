"use client";

import { useState, useEffect } from "react";

interface Tag {
  name: string;
  usageCount: number;
}

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
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [isLoadingTags, setIsLoadingTags] = useState(true);

  // Fetch available tags
  useEffect(() => {
    async function fetchTags() {
      try {
        setIsLoadingTags(true);
        const response = await fetch("/.netlify/functions/tags");
        if (!response.ok) {
          throw new Error("Failed to fetch tags");
        }
        const data = await response.json();
        setAvailableTags(data.tags || []);
      } catch (err) {
        console.error("Error fetching tags:", err);
      } finally {
        setIsLoadingTags(false);
      }
    }

    fetchTags();
  }, []);

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

  const hasFilters = selectedType || selectedTags.length > 0;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Search Input */}
        <div>
          <label
            htmlFor="search-query"
            className="block text-sm font-medium text-slate-700 mb-2"
          >
            Search
          </label>
          <input
            id="search-query"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search entries..."
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
          />
        </div>

        {/* Entry Type Filter */}
        <div>
          <label
            htmlFor="entry-type"
            className="block text-sm font-medium text-slate-700 mb-2"
          >
            Entry Type
          </label>
          <select
            id="entry-type"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent bg-white"
          >
            <option value="">All Types</option>
            <option value="word">Words</option>
            <option value="phrase">Phrases</option>
            <option value="quote">Quotes</option>
            <option value="hypothetical">Hypotheticals</option>
          </select>
        </div>

        {/* Tag Filter Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Filter by Tags
          </label>
          {isLoadingTags ? (
            <p className="text-sm text-slate-500">Loading tags...</p>
          ) : availableTags.length === 0 ? (
            <p className="text-sm text-slate-500">No tags available</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => {
                const isSelected = selectedTags.includes(tag.name);
                return (
                  <button
                    key={tag.name}
                    type="button"
                    onClick={() => handleTagToggle(tag.name)}
                    className={`px-3 py-1 text-sm rounded-full transition-colors ${
                      isSelected
                        ? "bg-slate-700 text-white hover:bg-slate-600"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {tag.name} ({tag.usageCount})
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            type="submit"
            className="flex-1 bg-slate-700 text-white px-6 py-2 rounded-lg hover:bg-slate-600 transition-colors font-medium"
          >
            Search
          </button>
          {hasFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
            >
              Clear Filters
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
