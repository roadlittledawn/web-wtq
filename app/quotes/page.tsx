"use client";

import { useState } from "react";
import QuoteBrowser from "@/components/QuoteBrowser";
import TagFilter from "@/components/TagFilter";
import PublicLayout from "@/components/PublicLayout";
import Heading from "@/components/Heading";

export default function QuotesPage() {
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
        <Heading level={1} className="mb-8">
          Quotes
        </Heading>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Tag Filter - Sidebar on large screens */}
          <div className="lg:col-span-1">
            <TagFilter
              selectedTags={selectedTags}
              onTagToggle={handleTagToggle}
              onClearFilters={handleClearFilters}
            />
          </div>

          {/* Quote Browser - Main content */}
          <div className="lg:col-span-3">
            <QuoteBrowser selectedTags={selectedTags} />
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
