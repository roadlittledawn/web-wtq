/**
 * Definition Source Badge Component
 *
 * Displays a badge indicating the source of a word's definition:
 * - Manual: User-entered definition
 * - API: Fetched from external dictionary API (e.g., Free Dictionary)
 *
 * Only shown when a definition exists.
 */

import type { WordEntry } from "@/types/models";

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
  const isAPI = entry.definitionSource === "api";

  // Determine badge appearance based on source
  const badgeClasses = isManual
    ? "bg-blue-100 text-blue-800 border-blue-300"
    : "bg-green-100 text-green-800 border-green-300";

  const icon = isManual ? "✍️" : "📚";

  const label = isManual
    ? "Manual"
    : entry.apiProvider
    ? `${entry.apiProvider}`
    : "API";

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border ${badgeClasses} ${className}`}
      title={
        isManual
          ? "Definition entered manually"
          : `Definition fetched from ${entry.apiProvider || "external API"}`
      }
    >
      <span className="text-sm" aria-hidden="true">
        {icon}
      </span>
      <span>{label}</span>
    </span>
  );
}
