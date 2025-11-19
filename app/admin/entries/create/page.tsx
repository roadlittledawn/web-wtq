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
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-semibold mb-2">Create New Entry</h2>
        <p className="text-gray-600 mb-6">
          Select the type of entry you want to create
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {entryTypes.map((entry) => (
            <button
              key={entry.type}
              onClick={() => handleTypeSelect(entry.type)}
              className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
            >
              <div className="flex items-start gap-4">
                <span className="text-4xl">{entry.icon}</span>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 mb-1">
                    {entry.label}
                  </h3>
                  <p className="text-sm text-gray-600">{entry.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
