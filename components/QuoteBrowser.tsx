"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { QuoteEntry } from "@/types/models";
import QuoteCard from "./QuoteCard";
import LoadingSpinner from "./LoadingSpinner";
import EndOfList from "./EndOfList";
import Heading from "./Heading";

interface QuoteBrowserProps {
  selectedTags?: string[];
}

interface QuotesByAuthor {
  [author: string]: QuoteEntry[];
}

export default function QuoteBrowser({ selectedTags = [] }: QuoteBrowserProps) {
  const [quotes, setQuotes] = useState<QuoteEntry[]>([]);
  const [groupedQuotes, setGroupedQuotes] = useState<QuotesByAuthor>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const limit = 30;

  // Fetch quotes from API
  const fetchQuotes = useCallback(
    async (reset: boolean = false) => {
      try {
        setIsLoading(true);
        const currentOffset = reset ? 0 : offset;

        // Build query parameters
        const params = new URLSearchParams({
          type: "quote",
          limit: limit.toString(),
          offset: currentOffset.toString(),
          sortBy: "author",
        });

        // Add tag filters if selected
        if (selectedTags.length > 0) {
          params.append("tags", selectedTags.join(","));
        }

        const response = await fetch(
          `/.netlify/functions/entries?${params.toString()}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch quotes");
        }

        const data = await response.json();
        const fetchedQuotes = data.entries as QuoteEntry[];

        if (reset) {
          setQuotes(fetchedQuotes);
          setOffset(limit);
        } else {
          setQuotes((prev) => [...prev, ...fetchedQuotes]);
          setOffset((prev) => prev + limit);
        }

        // Check if there are more quotes to load
        setHasMore(currentOffset + fetchedQuotes.length < data.total);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load quotes");
      } finally {
        setIsLoading(false);
      }
    },
    [offset, selectedTags, limit]
  );

  // Group quotes by author
  useEffect(() => {
    const grouped: QuotesByAuthor = {};

    quotes.forEach((quote) => {
      const author = quote.author;
      if (!grouped[author]) {
        grouped[author] = [];
      }
      grouped[author].push(quote);
    });

    setGroupedQuotes(grouped);
  }, [quotes]);

  // Initial load and when tag filters change
  useEffect(() => {
    setQuotes([]);
    setOffset(0);
    setHasMore(true);
    fetchQuotes(true);
  }, [selectedTags]);

  // Load more quotes
  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      fetchQuotes(false);
    }
  }, [isLoading, hasMore, fetchQuotes]);

  // Infinite scroll implementation using Intersection Observer
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, isLoading, loadMore]);

  if (error) {
    return (
      <div className="bg-dark-bg-secondary border-2 border-dark-border rounded-lg p-6">
        <p className="text-accent-pink">{error}</p>
      </div>
    );
  }

  if (isLoading && quotes.length === 0) {
    return <LoadingSpinner />;
  }

  if (quotes.length === 0) {
    return (
      <div className="bg-dark-bg-secondary border-2 border-dark-border rounded-lg p-6">
        <p className="text-dark-text-secondary">
          {selectedTags.length > 0
            ? `No quotes found with the selected tags`
            : "No quotes found"}
        </p>
      </div>
    );
  }

  // Get sorted authors
  const authors = Object.keys(groupedQuotes).sort();

  return (
    <div className="space-y-8">
      {authors.map((author) => (
        <div key={author} id={`author-${author.replace(/\s+/g, "-")}`}>
          <Heading
            level={2}
            className="mb-4 pb-2 border-b-2 border-accent-purple"
          >
            {author}
          </Heading>
          <div className="space-y-4">
            {groupedQuotes[author].map((quote) => (
              <QuoteCard key={quote._id.toString()} entry={quote} />
            ))}
          </div>
        </div>
      ))}

      {/* Infinite scroll trigger */}
      <div ref={observerTarget} className="h-4" />

      {isLoading && <LoadingSpinner />}
      {!isLoading && !hasMore && <EndOfList />}
    </div>
  );
}
