"use client";

import { useState, useEffect } from "react";

interface Tag {
  name: string;
  usageCount: number;
}

interface TagFilterProps {
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
  onClearFilters: () => void;
}

export default function TagFilter({
  selectedTags,
  onTagToggle,
  onClearFilters,
}: TagFilterProps) {
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTags() {
      try {
        setIsLoading(true);
        const response = await fetch("/.netlify/functions/tags");
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
  }, []);

  if (isLoading) {
    return (
      <div className="bg-dark-bg-secondary border-2 border-dark-border rounded-lg p-4">
        <h3 className="text-lg font-semibold text-dark-text mb-3">
          Filter by Tags
        </h3>
        <p className="text-dark-text-secondary text-sm">Loading tags...</p>
      </div>
    );
  }

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

  if (availableTags.length === 0) {
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

      {selectedTags.length > 0 && (
        <div className="mb-4 pb-4 border-b border-dark-border">
          <p className="text-sm text-dark-text-secondary mb-2">
            Active filters:
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedTags.map((tag) => (
              <button
                key={tag}
                onClick={() => onTagToggle(tag)}
                className="px-3 py-1 bg-accent-pink text-white text-sm rounded-full hover:bg-accent-pink-light transition-colors flex items-center gap-1"
              >
                {tag}
                <span className="text-xs">✕</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {availableTags.map((tag) => {
          const isSelected = selectedTags.includes(tag.name);
          return (
            <button
              key={tag.name}
              onClick={() => onTagToggle(tag.name)}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                isSelected
                  ? "bg-accent-teal text-dark-bg hover:bg-accent-teal-dark"
                  : "bg-dark-bg-tertiary text-dark-text hover:bg-dark-border"
              }`}
            >
              {tag.name} ({tag.usageCount})
            </button>
          );
        })}
      </div>
    </div>
  );
}
