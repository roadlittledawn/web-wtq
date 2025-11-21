"use client";

import { useRouter } from "next/navigation";
import AdminLayout from "@/components/AdminLayout";
import AdminNav from "@/components/AdminNav";

/**
 * Entry type selection page
 * Displays buttons for each entry type and navigates to appropriate form
 * Requirements: 2.1
 */
export default function CreateEntryPage() {
  const router = useRouter();

  const entryTypes = [
    {
      type: "word",
      label: "Word",
      description: "Add a word with definition, etymology, and notes",
      icon: "📖",
    },
    {
      type: "phrase",
      label: "Phrase",
      description: "Add a phrase with definition and source",
      icon: "💬",
    },
    {
      type: "quote",
      label: "Quote",
      description: "Add a quote with author and source",
      icon: "💭",
    },
    {
      type: "hypothetical",
      label: "Hypothetical",
      description: "Add a hypothetical scenario",
      icon: "🤔",
    },
  ];

  const handleTypeSelect = (type: string) => {
    router.push(`/admin/entries/create/${type}`);
  };

  return (
    <AdminLayout>
      <AdminNav />
      <div className="bg-dark-bg-secondary border-2 border-dark-border rounded-lg p-6">
        <h2 className="text-2xl font-semibold text-dark-text mb-2">
          Create New Entry
        </h2>
        <p className="text-dark-text-secondary mb-6">
          Select the type of entry you want to create
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {entryTypes.map((entry, index) => {
            const colors = [
              {
                border: "border-accent-pink",
                hover: "hover:border-accent-pink-light hover:bg-accent-pink/10",
                text: "group-hover:text-accent-pink",
              },
              {
                border: "border-accent-teal",
                hover: "hover:border-accent-teal-dark hover:bg-accent-teal/10",
                text: "group-hover:text-accent-teal",
              },
              {
                border: "border-accent-purple",
                hover: "hover:border-accent-purple hover:bg-accent-purple/10",
                text: "group-hover:text-accent-purple",
              },
              {
                border: "border-accent-blue",
                hover: "hover:border-accent-blue hover:bg-accent-blue/10",
                text: "group-hover:text-accent-blue",
              },
            ];
            const color = colors[index];

            return (
              <button
                key={entry.type}
                onClick={() => handleTypeSelect(entry.type)}
                className={`p-6 border-2 ${color.border} rounded-lg ${color.hover} transition-all text-left group`}
              >
                <div className="flex items-start gap-4">
                  <span className="text-4xl">{entry.icon}</span>
                  <div className="flex-1">
                    <h3
                      className={`text-lg font-semibold text-dark-text ${color.text} mb-1`}
                    >
                      {entry.label}
                    </h3>
                    <p className="text-sm text-dark-text-secondary">
                      {entry.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
}
