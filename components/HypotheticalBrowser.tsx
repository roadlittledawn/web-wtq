"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { HypotheticalEntry } from "@/types/models";
import EntryCard from "./EntryCard";
import LoadingSpinner from "./LoadingSpinner";
import EndOfList from "./EndOfList";

interface HypotheticalBrowserProps {
  selectedTags?: string[];
}

export default function HypotheticalBrowser({
  selectedTags = [],
}: HypotheticalBrowserProps) {
  const [hypotheticals, setHypotheticals] = useState<HypotheticalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const limit = 30;

  // Fetch hypotheticals from API
  const fetchHypotheticals = useCallback(
    async (reset: boolean = false) => {
      try {
        setIsLoading(true);
        const currentOffset = reset ? 0 : offset;

        // Build query parameters
        const params = new URLSearchParams({
          type: "hypothetical",
          limit: limit.toString(),
          offset: currentOffset.toString(),
        });

        // Add tag filters if selected
        if (selectedTags.length > 0) {
          params.append("tags", selectedTags.join(","));
        }

        const response = await fetch(
          `/.netlify/functions/entries?${params.toString()}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch hypotheticals");
        }

        const data = await response.json();
        const fetchedHypotheticals = data.entries as HypotheticalEntry[];

        if (reset) {
          setHypotheticals(fetchedHypotheticals);
          setOffset(limit);
        } else {
          setHypotheticals((prev) => [...prev, ...fetchedHypotheticals]);
          setOffset((prev) => prev + limit);
        }

        // Check if there are more hypotheticals to load
        setHasMore(currentOffset + fetchedHypotheticals.length < data.total);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load hypotheticals"
        );
      } finally {
        setIsLoading(false);
      }
    },
    [offset, selectedTags, limit]
  );

  // Initial load and when tag filters change
  useEffect(() => {
    setHypotheticals([]);
    setOffset(0);
    setHasMore(true);
    fetchHypotheticals(true);
  }, [selectedTags]);

  // Load more hypotheticals
  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      fetchHypotheticals(false);
    }
  }, [isLoading, hasMore, fetchHypotheticals]);

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
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (isLoading && hypotheticals.length === 0) {
    return <LoadingSpinner />;
  }

  if (hypotheticals.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-slate-500">
          {selectedTags.length > 0
            ? `No hypotheticals found with the selected tags`
            : "No hypotheticals found"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {hypotheticals.map((hypothetical) => (
        <EntryCard key={hypothetical._id.toString()} entry={hypothetical} />
      ))}

      {/* Infinite scroll trigger */}
      <div ref={observerTarget} className="h-4" />

      {isLoading && <LoadingSpinner />}
      {!isLoading && !hasMore && <EndOfList />}
    </div>
  );
}
