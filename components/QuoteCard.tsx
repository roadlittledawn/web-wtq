"use client";

import { QuoteEntry } from "@/types/models";
import EditButton from "./EditButton";
import { useState, useEffect } from "react";

interface QuoteCardProps {
  entry: QuoteEntry;
}

export default function QuoteCard({ entry }: QuoteCardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem("auth_token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const expirationTime = payload.exp * 1000;
        const currentTime = Date.now();
        setIsAuthenticated(currentTime < expirationTime);
      } catch (error) {
        setIsAuthenticated(false);
      }
    }
  }, []);

  return (
    <div className="bg-dark-bg-secondary border-2 border-dark-border rounded-lg p-6 hover:border-accent-purple transition-all">
      <div className="flex gap-4">
        {/* Quote Content */}
        <div className="flex-1">
          {entry.name && (
            <h3 className="text-xl font-semibold text-dark-text mb-2">
              {entry.name}
            </h3>
          )}

          <blockquote className="pl-4 border-l-4 border-accent-purple text-dark-text italic mb-3">
            {entry.body}
          </blockquote>

          <p className="text-dark-text-secondary">
            <span className="font-semibold text-accent-teal">
              — {entry.author}
            </span>
            {entry.source && <span className="text-sm"> ({entry.source})</span>}
          </p>

          {entry.notes && (
            <p className="mt-2 text-sm text-dark-text-secondary">
              {entry.notes}
            </p>
          )}
        </div>

        {/* Edit Button */}
        {isAuthenticated && (
          <div className="flex-shrink-0">
            <EditButton entryId={entry._id.toString()} />
          </div>
        )}
      </div>

      {/* Tags */}
      {entry.tags && entry.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-dark-border">
          {entry.tags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 bg-dark-bg-tertiary border border-accent-purple text-accent-purple text-sm rounded-full hover:bg-accent-purple hover:text-dark-bg transition-colors"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
