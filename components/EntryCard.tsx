"use client";

import { Entry } from "@/types/models";
import EditButton from "./EditButton";
import DefinitionSourceBadge from "./DefinitionSourceBadge";
import MarkdownRenderer from "./MarkdownRenderer";
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
    <div className="bg-dark-bg-secondary border-2 border-dark-border rounded-lg p-6 hover:border-accent-teal transition-all">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          {entry.type === "word" && (
            <>
              <h3 className="text-2xl font-bold text-dark-text">
                {entry.name}
              </h3>
              {entry.partOfSpeech && (
                <span className="ml-2 text-sm text-accent-pink italic">
                  ({entry.partOfSpeech})
                </span>
              )}
              <div className="mt-2">
                <p className="text-dark-text inline">{entry.definition}</p>
                {entry.definition && (
                  <DefinitionSourceBadge entry={entry} className="ml-2" />
                )}
              </div>
              {entry.etymology && (
                <p className="mt-2 text-sm text-dark-text-secondary">
                  <span className="font-semibold text-accent-teal">
                    Etymology:
                  </span>{" "}
                  {entry.etymology}
                </p>
              )}
              {entry.notes && (
                <div className="mt-2 text-sm text-dark-text-secondary">
                  <MarkdownRenderer content={entry.notes} />
                </div>
              )}
            </>
          )}

          {entry.type === "phrase" && (
            <>
              <h3 className="text-2xl font-bold text-dark-text">
                {entry.body}
              </h3>
              <p className="mt-2 text-dark-text">{entry.definition}</p>
              {entry.source && (
                <p className="mt-2 text-sm text-dark-text-secondary">
                  <span className="font-semibold text-accent-teal">
                    Source:
                  </span>{" "}
                  {entry.source}
                </p>
              )}
              {entry.notes && (
                <div className="mt-2 text-sm text-dark-text-secondary">
                  <MarkdownRenderer content={entry.notes} />
                </div>
              )}
            </>
          )}

          {entry.type === "quote" && (
            <>
              <h3 className="text-xl font-semibold text-dark-text">
                {entry.name}
              </h3>
              <blockquote className="mt-3 pl-4 border-l-4 border-accent-pink text-dark-text italic">
                {entry.body}
              </blockquote>
              <p className="mt-2 text-dark-text-secondary">
                <span className="font-semibold text-accent-teal">
                  — {entry.author}
                </span>
                {entry.source && (
                  <span className="text-sm"> ({entry.source})</span>
                )}
              </p>
              {entry.notes && (
                <div className="mt-2 text-sm text-dark-text-secondary">
                  <MarkdownRenderer content={entry.notes} />
                </div>
              )}
            </>
          )}

          {entry.type === "hypothetical" && (
            <>
              <h3 className="text-xl font-semibold text-dark-text mb-2">
                Hypothetical
              </h3>
              <p className="text-dark-text">{entry.body}</p>
              {entry.source && (
                <p className="mt-2 text-sm text-dark-text-secondary">
                  <span className="font-semibold text-accent-teal">
                    Source:
                  </span>{" "}
                  {entry.source}
                </p>
              )}
              {entry.notes && (
                <div className="mt-2 text-sm text-dark-text-secondary">
                  <MarkdownRenderer content={entry.notes} />
                </div>
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
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-dark-border">
          {entry.tags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 bg-dark-bg-tertiary border border-accent-teal text-accent-teal text-sm rounded-full hover:bg-accent-teal hover:text-dark-bg transition-colors"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
