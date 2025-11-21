"use client";

import { QuoteEntry } from "@/types/models";
import Link from "next/link";
import AuthorImage from "./AuthorImage";
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
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex gap-4">
        {/* Author Image */}
        <div className="flex-shrink-0">
          <AuthorImage author={entry.author} />
        </div>

        {/* Quote Content */}
        <div className="flex-1">
          <Link
            href={`/entries/${entry.slug}`}
            className="text-xl font-semibold text-slate-800 hover:text-slate-600 block mb-2"
          >
            {entry.name}
          </Link>

          <blockquote className="pl-4 border-l-4 border-slate-300 text-slate-700 italic mb-3">
            {entry.body}
          </blockquote>

          <p className="text-slate-600">
            <span className="font-semibold">— {entry.author}</span>
            {entry.source && <span className="text-sm"> ({entry.source})</span>}
          </p>

          {entry.notes && (
            <p className="mt-2 text-sm text-slate-600">{entry.notes}</p>
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
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-200">
          {entry.tags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 bg-slate-100 text-slate-700 text-sm rounded-full hover:bg-slate-200 transition-colors"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
