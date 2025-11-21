"use client";

import { useState } from "react";
import WordBrowser from "@/components/WordBrowser";
import AlphabetNav from "@/components/AlphabetNav";
import PublicLayout from "@/components/PublicLayout";
import Heading from "@/components/Heading";

export default function WordsPage() {
  const [selectedLetter, setSelectedLetter] = useState<string | undefined>(
    undefined
  );

  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-8">
        <Heading level={1} className="mb-8">
          Words
        </Heading>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Alphabet Navigation - Sidebar on large screens */}
          <div className="lg:col-span-1">
            <AlphabetNav
              selectedLetter={selectedLetter}
              onLetterSelect={setSelectedLetter}
            />
          </div>

          {/* Word Browser - Main content */}
          <div className="lg:col-span-3">
            <WordBrowser
              selectedLetter={selectedLetter}
              onLetterChange={setSelectedLetter}
            />
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
