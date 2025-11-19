"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { PhraseEntry } from "@/types/models";
import EntryCard from "./EntryCard";
import LoadingSpinner from "./LoadingSpinner";
import EndOfList from "./EndOfList";

interface PhraseBrowserProps {
  selectedTags?: string[];
}

interface PhrasesByLetter {
  [letter: string]: PhraseEntry[];
}

export default function PhraseBrowser({
  selectedTags = [],
}: PhraseBrowserProps) {
  const [phrases, setPhrases] = useState<PhraseEntry[]>([]);
  const [groupedPhrases, setGroupedPhrases] = useState<PhrasesByLetter>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const limit = 30;

  // Fetch phrases from API
  const fetchPhrases = useCallback(
    async (reset: boolean = false) => {
      try {
        setIsLoading(true);
        const currentOffset = reset ? 0 : offset;

        // Build query parameters
        const params = new URLSearchParams({
          type: "phrase",
          limit: limit.toString(),
          offset: currentOffset.toString(),
          sortBy: "name",
        });

        // Add tag filters if selected
        if (selectedTags.length > 0) {
          params.append("tags", selectedTags.join(","));
        }

        const response = await fetch(
          `/.netlify/functions/entries?${params.toString()}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch phrases");
        }

        const data = await response.json();
        const fetchedPhrases = data.entries as PhraseEntry[];

        if (reset) {
          setPhrases(fetchedPhrases);
          setOffset(limit);
        } else {
          setPhrases((prev) => [...prev, ...fetchedPhrases]);
          setOffset((prev) => prev + limit);
        }

        // Check if there are more phrases to load
        setHasMore(currentOffset + fetchedPhrases.length < data.total);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load phrases");
      } finally {
        setIsLoading(false);
      }
    },
    [offset, selectedTags, limit]
  );

  // Group phrases by first letter
  useEffect(() => {
    const grouped: PhrasesByLetter = {};

    phrases.forEach((phrase) => {
      const firstLetter = phrase.name.charAt(0).toUpperCase();
      if (!grouped[firstLetter]) {
        grouped[firstLetter] = [];
      }
      grouped[firstLetter].push(phrase);
    });

    setGroupedPhrases(grouped);
  }, [phrases]);

  // Initial load and when tag filters change
  useEffect(() => {
    setPhrases([]);
    setOffset(0);
    setHasMore(true);
    fetchPhrases(true);
  }, [selectedTags]);

  // Load more phrases
  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      fetchPhrases(false);
    }
  }, [isLoading, hasMore, fetchPhrases]);

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

  if (isLoading && phrases.length === 0) {
    return <LoadingSpinner />;
  }

  if (phrases.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-slate-500">
          {selectedTags.length > 0
            ? `No phrases found with the selected tags`
            : "No phrases found"}
        </p>
      </div>
    );
  }

  // Get sorted letters
  const letters = Object.keys(groupedPhrases).sort();

  return (
    <div className="space-y-8">
      {letters.map((letter) => (
        <div key={letter} id={`letter-${letter}`}>
          <h2 className="text-3xl font-bold text-slate-800 mb-4 pb-2 border-b-2 border-slate-300">
            {letter}
          </h2>
          <div className="space-y-4">
            {groupedPhrases[letter].map((phrase) => (
              <EntryCard key={phrase._id.toString()} entry={phrase} />
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
