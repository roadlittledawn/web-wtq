"use client";

interface FilterPanelProps {
  type?: string;
  tags?: string[];
  onClearType?: () => void;
  onClearTag?: (tag: string) => void;
  onClearAll?: () => void;
}

export default function FilterPanel({
  type,
  tags = [],
  onClearType,
  onClearTag,
  onClearAll,
}: FilterPanelProps) {
  const hasFilters = type || tags.length > 0;

  // Don't render if no filters are active
  if (!hasFilters) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-slate-800">Active Filters</h3>
        {onClearAll && (
          <button
            onClick={onClearAll}
            className="text-sm text-slate-600 hover:text-slate-800 underline"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {/* Entry Type Filter */}
        {type && (
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-700 text-white text-sm rounded-full">
            <span className="font-medium">Type:</span>
            <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
            {onClearType && (
              <button
                onClick={onClearType}
                className="ml-1 hover:text-slate-300 transition-colors"
                aria-label="Clear type filter"
              >
                ✕
              </button>
            )}
          </div>
        )}

        {/* Tag Filters */}
        {tags.map((tag) => (
          <div
            key={tag}
            className="flex items-center gap-2 px-3 py-1 bg-slate-700 text-white text-sm rounded-full"
          >
            <span className="font-medium">Tag:</span>
            <span>{tag}</span>
            {onClearTag && (
              <button
                onClick={() => onClearTag(tag)}
                className="ml-1 hover:text-slate-300 transition-colors"
                aria-label={`Clear ${tag} filter`}
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
