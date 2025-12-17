/**
 * Definition Source Badge Component
 *
 * Displays a subtle caption indicating the source of a word's definition:
 * - Manual: User-entered definition (with edit icon)
 * - API: Fetched from external dictionary API (with book icon)
 *
 * Only shown when a definition exists.
 */

import type { WordEntry } from "@/types/models";

// Feather icon: edit-3 (pencil)
function EditIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-3 w-3 inline-block mr-1"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}

// Feather icon: book-open
function BookIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-3 w-3 inline-block mr-1"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}

interface DefinitionSourceBadgeProps {
  entry: WordEntry;
  className?: string;
}

export default function DefinitionSourceBadge({
  entry,
  className = "",
}: DefinitionSourceBadgeProps) {
  // Don't show badge if there's no definition
  if (!entry.definition) {
    return null;
  }

  // Don't show badge if source is not set (legacy entries before this feature)
  if (!entry.definitionSource) {
    return null;
  }

  const isManual = entry.definitionSource === "manual";

  const label = isManual
    ? "Definition entered manually"
    : entry.apiProvider
      ? `Definition sourced from ${entry.apiProvider}`
      : "Definition sourced from external API";

  return (
    <span
      className={`text-xs text-dark-text-muted inline-flex items-center ${className}`}
      title={label}
    >
      {isManual ? <EditIcon /> : <BookIcon />}
      {label}
    </span>
  );
}
