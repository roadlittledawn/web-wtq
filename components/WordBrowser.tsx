"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { WordEntry } from "@/types/models";
import EntryCard from "./EntryCard";
import LoadingSpinner from "./LoadingSpinner";
import EndOfList from "./EndOfList";
import Heading from "./Heading";

interface WordBrowserProps {
  selectedLetter?: string;
  onLetterChange?: (letter: string | undefined) => void;
}

interface WordsByLetter {
  [letter: string]: WordEntry[];
}

export default function WordBrowser({
  selectedLetter,
  onLetterChange,
}: WordBrowserProps) {
  const [words, setWords] = useState<WordEntry[]>([]);
  const [groupedWords, setGroupedWords] = useState<WordsByLetter>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const limit = 30;

  // Fetch words from API
  const fetchWords = useCallback(
    async (reset: boolean = false) => {
      try {
        setIsLoading(true);
        const currentOffset = reset ? 0 : offset;

        // Build query parameters
        const params = new URLSearchParams({
          type: "word",
          limit: limit.toString(),
          offset: currentOffset.toString(),
          sortBy: "name",
        });

        // Add letter filter if selected
        if (selectedLetter) {
          params.append("letter", selectedLetter);
        }

        const response = await fetch(
          `/.netlify/functions/entries?${params.toString()}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch words");
        }

        const data = await response.json();
        const fetchedWords = data.entries as WordEntry[];

        if (reset) {
          setWords(fetchedWords);
          setOffset(limit);
        } else {
          setWords((prev) => [...prev, ...fetchedWords]);
          setOffset((prev) => prev + limit);
        }

        // Check if there are more words to load
        setHasMore(currentOffset + fetchedWords.length < data.total);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load words");
      } finally {
        setIsLoading(false);
      }
    },
    [offset, selectedLetter, limit]
  );

  // Group words by first letter
  useEffect(() => {
    const grouped: WordsByLetter = {};

    words.forEach((word) => {
      const firstLetter = word.name.charAt(0).toUpperCase();
      if (!grouped[firstLetter]) {
        grouped[firstLetter] = [];
      }
      grouped[firstLetter].push(word);
    });

    setGroupedWords(grouped);
  }, [words]);

  // Initial load and when letter filter changes
  useEffect(() => {
    setWords([]);
    setOffset(0);
    setHasMore(true);
    fetchWords(true);
  }, [selectedLetter]);

  // Load more words
  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      fetchWords(false);
    }
  }, [isLoading, hasMore, fetchWords]);

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

  if (isLoading && words.length === 0) {
    return <LoadingSpinner />;
  }

  if (words.length === 0) {
    return (
      <div className="bg-dark-bg-secondary border-2 border-dark-border rounded-lg p-6">
        <p className="text-dark-text-secondary">
          {selectedLetter
            ? `No words found starting with "${selectedLetter}"`
            : "No words found"}
        </p>
      </div>
    );
  }

  // Get sorted letters
  const letters = Object.keys(groupedWords).sort();

  return (
    <div className="space-y-8">
      {letters.map((letter) => (
        <div key={letter} id={`letter-${letter}`}>
          <Heading
            level={2}
            className="mb-4 pb-2 border-b-2 border-accent-pink"
          >
            {letter}
          </Heading>
          <div className="space-y-4">
            {groupedWords[letter].map((word) => (
              <EntryCard key={word._id.toString()} entry={word} />
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
