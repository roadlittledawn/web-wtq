"use client";

import { Entry } from "@/types/models";
import Link from "next/link";
import EditButton from "./EditButton";
import { useState, useEffect } from "react";

interface EntryCardProps {
  entry: Entry;
}

export default function EntryCard({ entry }: EntryCardProps) {
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
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          {entry.type === "word" && (
            <>
              <Link
                href={`/entries/${entry.slug}`}
                className="text-2xl font-bold text-slate-800 hover:text-slate-600"
              >
                {entry.name}
              </Link>
              {entry.partOfSpeech && (
                <span className="ml-2 text-sm text-slate-500 italic">
                  ({entry.partOfSpeech})
                </span>
              )}
              <p className="mt-2 text-slate-700">{entry.definition}</p>
              {entry.etymology && (
                <p className="mt-2 text-sm text-slate-600">
                  <span className="font-semibold">Etymology:</span>{" "}
                  {entry.etymology}
                </p>
              )}
              {entry.notes && (
                <p className="mt-2 text-sm text-slate-600">{entry.notes}</p>
              )}
            </>
          )}

          {entry.type === "phrase" && (
            <>
              <Link
                href={`/entries/${entry.slug}`}
                className="text-2xl font-bold text-slate-800 hover:text-slate-600"
              >
                {entry.body}
              </Link>
              <p className="mt-2 text-slate-700">{entry.definition}</p>
              {entry.source && (
                <p className="mt-2 text-sm text-slate-600">
                  <span className="font-semibold">Source:</span> {entry.source}
                </p>
              )}
              {entry.notes && (
                <p className="mt-2 text-sm text-slate-600">{entry.notes}</p>
              )}
            </>
          )}

          {entry.type === "quote" && (
            <>
              <Link
                href={`/entries/${entry.slug}`}
                className="text-xl font-semibold text-slate-800 hover:text-slate-600"
              >
                {entry.name}
              </Link>
              <blockquote className="mt-3 pl-4 border-l-4 border-slate-300 text-slate-700 italic">
                {entry.body}
              </blockquote>
              <p className="mt-2 text-slate-600">
                <span className="font-semibold">— {entry.author}</span>
                {entry.source && (
                  <span className="text-sm"> ({entry.source})</span>
                )}
              </p>
              {entry.notes && (
                <p className="mt-2 text-sm text-slate-600">{entry.notes}</p>
              )}
            </>
          )}

          {entry.type === "hypothetical" && (
            <>
              <Link
                href={`/entries/${entry.slug}`}
                className="text-xl font-semibold text-slate-800 hover:text-slate-600 block mb-2"
              >
                Hypothetical
              </Link>
              <p className="text-slate-700">{entry.body}</p>
              {entry.source && (
                <p className="mt-2 text-sm text-slate-600">
                  <span className="font-semibold">Source:</span> {entry.source}
                </p>
              )}
              {entry.notes && (
                <p className="mt-2 text-sm text-slate-600">{entry.notes}</p>
              )}
            </>
          )}
        </div>
        {isAuthenticated && (
          <div className="ml-4 flex-shrink-0">
            <EditButton entryId={entry._id.toString()} />
          </div>
        )}
      </div>

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
