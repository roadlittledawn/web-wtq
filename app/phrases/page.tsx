"use client";

import { useState } from "react";
import PhraseBrowser from "@/components/PhraseBrowser";
import TagFilter from "@/components/TagFilter";
import PublicLayout from "@/components/PublicLayout";

export default function PhrasesPage() {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleClearFilters = () => {
    setSelectedTags([]);
  };

  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-slate-800 mb-8">Phrases</h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Tag Filter - Sidebar on large screens */}
          <div className="lg:col-span-1">
            <TagFilter
              selectedTags={selectedTags}
              onTagToggle={handleTagToggle}
              onClearFilters={handleClearFilters}
            />
          </div>

          {/* Phrase Browser - Main content */}
          <div className="lg:col-span-3">
            <PhraseBrowser selectedTags={selectedTags} />
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
