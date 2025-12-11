"use client";

import { useState } from "react";

interface SuggestedTagsProps {
  suggestions: string[];
  onTagClick: (tag: string) => void;
  selectedTags: string[];
}

/**
 * SuggestedTags component for displaying AI-suggested tags as clickable pills
 */
export default function SuggestedTags({
  suggestions,
  onTagClick,
  selectedTags,
}: SuggestedTagsProps) {
  const [clickedTags, setClickedTags] = useState<Set<string>>(new Set());

  const handleTagClick = (tag: string) => {
    setClickedTags((prev) => new Set([...Array.from(prev), tag]));
    onTagClick(tag);
  };

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-white">
        AI Suggested Tags (click to add):
      </p>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((tag) => {
          const isAlreadySelected = selectedTags.includes(tag);
          const wasClicked = clickedTags.has(tag);
          const isDisabled = isAlreadySelected || wasClicked;

          return (
            <button
              key={tag}
              type="button"
              onClick={() => !isDisabled && handleTagClick(tag)}
              disabled={isDisabled}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                isDisabled
                  ? "bg-gray-700 text-gray-500 cursor-not-allowed opacity-50"
                  : "bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
              }`}
            >
              {tag}
              {isDisabled && " ✓"}
            </button>
          );
        })}
      </div>
    </div>
  );
}
