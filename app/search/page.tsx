"use client";

import { useState } from "react";
import PublicLayout from "@/components/PublicLayout";
import SearchBar from "@/components/SearchBar";
import SearchResults from "@/components/SearchResults";
import FilterPanel from "@/components/FilterPanel";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<string | undefined>(undefined);
  const [tags, setTags] = useState<string[] | undefined>(undefined);
  const [hasSearched, setHasSearched] = useState(false);

  // Handle search submission
  const handleSearch = (
    searchQuery: string,
    searchType?: string,
    searchTags?: string[]
  ) => {
    setQuery(searchQuery);
    setType(searchType);
    setTags(searchTags);
    setHasSearched(true);
  };

  // Handle clearing type filter
  const handleClearType = () => {
    setType(undefined);
  };

  // Handle clearing individual tag filter
  const handleClearTag = (tag: string) => {
    setTags((prev) => prev?.filter((t) => t !== tag));
  };

  // Handle clearing all filters
  const handleClearAll = () => {
    setType(undefined);
    setTags(undefined);
  };

  return (
    <PublicLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-4xl font-bold text-slate-800 mb-2">Search</h1>
          <p className="text-slate-600">
            Search across all words, phrases, quotes, and hypotheticals
          </p>
        </div>

        {/* Search Bar */}
        <SearchBar
          onSearch={handleSearch}
          initialQuery={query}
          initialType={type}
          initialTags={tags}
        />

        {/* Active Filters Panel */}
        {hasSearched && (
          <FilterPanel
            type={type}
            tags={tags}
            onClearType={handleClearType}
            onClearTag={handleClearTag}
            onClearAll={handleClearAll}
          />
        )}

        {/* Search Results */}
        {hasSearched && <SearchResults query={query} type={type} tags={tags} />}

        {/* Initial State Message */}
        {!hasSearched && (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-slate-600">
              Enter a search query above to find entries
            </p>
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
