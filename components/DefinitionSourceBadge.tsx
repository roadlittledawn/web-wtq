/**
 * Definition Source Badge Component
 *
 * Displays a subtle caption indicating the source of a word's definition:
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

  const label = isManual
    ? "Definition entered manually"
    : entry.apiProvider
      ? `Definition sourced from ${entry.apiProvider}`
      : "Definition sourced from external API";

  return (
    <span
      className={`text-xs text-dark-text-muted ${className}`}
      title={label}
    >
      {label}
    </span>
  );
}
