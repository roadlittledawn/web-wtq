"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Entry } from "@/types/models";
import EntryCard from "./EntryCard";
import LoadingSpinner from "./LoadingSpinner";
import EndOfList from "./EndOfList";

interface SearchResultsProps {
  query: string;
  type?: string;
  tags?: string[];
}

export default function SearchResults({
  query,
  type,
  tags,
}: SearchResultsProps) {
  const [results, setResults] = useState<Entry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const limit = 30;

  // Fetch search results from API
  const fetchResults = useCallback(
    async (reset: boolean = false) => {
      try {
        setIsLoading(true);
        const currentOffset = reset ? 0 : offset;

        // Build query parameters
        const params = new URLSearchParams({
          q: query,
          limit: limit.toString(),
          offset: currentOffset.toString(),
        });

        // Add type filter if specified
        if (type) {
          params.append("type", type);
        }

        // Add tag filters if specified
        if (tags && tags.length > 0) {
          params.append("tags", tags.join(","));
        }

        const response = await fetch(
          `/.netlify/functions/search?${params.toString()}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch search results");
        }

        const data = await response.json();
        const fetchedResults = data.results as Entry[];

        if (reset) {
          setResults(fetchedResults);
          setOffset(limit);
        } else {
          setResults((prev) => [...prev, ...fetchedResults]);
          setOffset((prev) => prev + limit);
        }

        setTotal(data.total);
        setHasMore(currentOffset + fetchedResults.length < data.total);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load search results"
        );
      } finally {
        setIsLoading(false);
      }
    },
    [offset, query, type, tags, limit]
  );

  // Reset and fetch when search parameters change
  useEffect(() => {
    setResults([]);
    setOffset(0);
    setHasMore(true);
    setTotal(0);
    fetchResults(true);
  }, [query, type, tags]);

  // Load more results
  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      fetchResults(false);
    }
  }, [isLoading, hasMore, fetchResults]);

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

  // Show error state
  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  // Show loading state for initial load
  if (isLoading && results.length === 0) {
    return <LoadingSpinner />;
  }

  // Show empty results message
  if (!isLoading && results.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-2">
          No results found
        </h3>
        <p className="text-slate-600">
          {query
            ? `No entries match your search for "${query}"`
            : "Try adjusting your filters or search query"}
        </p>
      </div>
    );
  }

  // Show results with relevance indicator
  return (
    <div className="space-y-6">
      {/* Results count and relevance indicator */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <p className="text-slate-700">
          Found <span className="font-semibold">{total}</span>{" "}
          {total === 1 ? "result" : "results"}
          {query && (
            <>
              {" "}
              for <span className="font-semibold">"{query}"</span>
            </>
          )}
        </p>
        {(type || (tags && tags.length > 0)) && (
          <p className="text-sm text-slate-500 mt-1">
            Filtered by:{" "}
            {type && (
              <span className="font-medium">
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </span>
            )}
            {type && tags && tags.length > 0 && ", "}
            {tags && tags.length > 0 && (
              <span className="font-medium">{tags.join(", ")}</span>
            )}
          </p>
        )}
      </div>

      {/* Results list */}
      <div className="space-y-4">
        {results.map((entry) => (
          <EntryCard key={entry._id.toString()} entry={entry} />
        ))}
      </div>

      {/* Infinite scroll trigger */}
      <div ref={observerTarget} className="h-4" />

      {/* Loading indicator */}
      {isLoading && <LoadingSpinner />}

      {/* End of list indicator */}
      {!isLoading && !hasMore && results.length > 0 && <EndOfList />}
    </div>
  );
}
