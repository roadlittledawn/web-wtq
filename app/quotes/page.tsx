"use client";

import { useState } from "react";
import QuoteBrowser from "@/components/QuoteBrowser";
import TagFilter from "@/components/TagFilter";
import AuthorFilter from "@/components/AuthorFilter";
import PublicLayout from "@/components/PublicLayout";
import Heading from "@/components/Heading";

export default function QuotesPage() {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedAuthors, setSelectedAuthors] = useState<string[]>([]);

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleClearTagFilters = () => {
    setSelectedTags([]);
  };

  const handleAuthorToggle = (authorId: string) => {
    setSelectedAuthors((prev) =>
      prev.includes(authorId)
        ? prev.filter((a) => a !== authorId)
        : [...prev, authorId]
    );
  };

  const handleClearAuthorFilters = () => {
    setSelectedAuthors([]);
  };

  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-8">
        <Heading level={1} className="mb-8">
          Quotes
        </Heading>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters - Sidebar on large screens */}
          <div className="lg:col-span-1 space-y-4">
            <AuthorFilter
              selectedAuthors={selectedAuthors}
              onAuthorToggle={handleAuthorToggle}
              onClearFilters={handleClearAuthorFilters}
            />
            <TagFilter
              selectedTags={selectedTags}
              onTagToggle={handleTagToggle}
              onClearFilters={handleClearTagFilters}
              entryType="quote"
            />
          </div>

          {/* Quote Browser - Main content */}
          <div className="lg:col-span-3">
            <QuoteBrowser
              selectedTags={selectedTags}
              selectedAuthors={selectedAuthors}
            />
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
