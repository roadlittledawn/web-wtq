"use client";

interface AlphabetNavProps {
  selectedLetter?: string;
  onLetterSelect: (letter: string | undefined) => void;
}

export default function AlphabetNav({
  selectedLetter,
  onLetterSelect,
}: AlphabetNavProps) {
  // Generate array of letters A-Z
  const letters = Array.from({ length: 26 }, (_, i) =>
    String.fromCharCode(65 + i)
  );

  return (
    <div className="bg-dark-bg-secondary border-2 border-dark-border rounded-lg p-4 sticky top-4 z-10">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-dark-text">
          Browse by Letter
        </h3>
        {selectedLetter && (
          <button
            onClick={() => onLetterSelect(undefined)}
            className="text-sm text-accent-teal hover:text-accent-teal-dark underline"
          >
            Show all
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {letters.map((letter) => {
          const isSelected = selectedLetter === letter;
          return (
            <button
              key={letter}
              onClick={() => onLetterSelect(isSelected ? undefined : letter)}
              className={`w-10 h-10 flex items-center justify-center rounded-md font-semibold transition-colors ${
                isSelected
                  ? "bg-accent-pink text-white hover:bg-accent-pink-light"
                  : "bg-dark-bg-tertiary text-dark-text hover:bg-dark-border"
              }`}
              aria-label={`Filter by letter ${letter}`}
              aria-pressed={isSelected}
            >
              {letter}
            </button>
          );
        })}
      </div>

      {selectedLetter && (
        <div className="mt-3 pt-3 border-t border-dark-border">
          <p className="text-sm text-dark-text-secondary">
            Showing words starting with{" "}
            <span className="font-semibold text-accent-teal">
              {selectedLetter}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
