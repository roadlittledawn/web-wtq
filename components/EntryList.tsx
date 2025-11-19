"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Entry } from "@/types/models";
import EditButton from "./EditButton";
import DeleteConfirmationModal from "./DeleteConfirmationModal";

interface EntryListProps {
  entries: Entry[];
  onDelete?: (entryId: string) => void;
}

/**
 * EntryList component displays a list of entries with edit and delete actions
 * Provides a table view with entry details and action buttons
 * Requirements: 2.10, 4.1, 4.2, 4.3
 */
export default function EntryList({ entries, onDelete }: EntryListProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<Entry | null>(null);
  const [error, setError] = useState<string | null>(null);

  const openDeleteModal = (entry: Entry) => {
    setEntryToDelete(entry);
    setDeleteModalOpen(true);
    setError(null);
  };

  const closeDeleteModal = () => {
    if (deletingId) return; // Prevent closing while deleting
    setDeleteModalOpen(false);
    setEntryToDelete(null);
    setError(null);
  };

  const handleDeleteConfirm = async () => {
    if (!entryToDelete) return;

    const entryId = entryToDelete._id.toString();
    setDeletingId(entryId);
    setError(null);

    try {
      // Call delete API endpoint
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token not found");
      }

      const response = await fetch(
        `/.netlify/functions/entries-delete/${entryId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to delete entry");
      }

      // Call optional onDelete callback
      if (onDelete) {
        await onDelete(entryId);
      }

      // Close modal and refresh the page
      setDeleteModalOpen(false);
      setEntryToDelete(null);
      router.refresh();
    } catch (err) {
      console.error("Error deleting entry:", err);
      setError(err instanceof Error ? err.message : "Failed to delete entry");
    } finally {
      setDeletingId(null);
    }
  };

  const getEntryTitle = (entry: Entry): string => {
    switch (entry.type) {
      case "word":
        return entry.name;
      case "phrase":
        return (
          entry.body.substring(0, 50) + (entry.body.length > 50 ? "..." : "")
        );
      case "quote":
        return entry.name;
      case "hypothetical":
        return (
          entry.body.substring(0, 50) + (entry.body.length > 50 ? "..." : "")
        );
      default:
        return "Unknown";
    }
  };

  const getEntryPreview = (entry: Entry): string => {
    switch (entry.type) {
      case "word":
      case "phrase":
        return entry.definition;
      case "quote":
        return entry.body;
      case "hypothetical":
        return entry.body;
      default:
        return "";
    }
  };

  if (entries.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <p className="text-gray-500">No entries found.</p>
      </div>
    );
  }

  return (
    <>
      {/* Error message display */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setError(null)}
                className="inline-flex text-red-400 hover:text-red-500"
              >
                <span className="sr-only">Dismiss</span>
                <svg
                  className="h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Preview
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tags
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {entries.map((entry) => (
              <tr key={entry._id.toString()} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                    {entry.type}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">
                    {getEntryTitle(entry)}
                  </div>
                  <div className="text-sm text-gray-500">{entry.slug}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-700 max-w-md truncate">
                    {getEntryPreview(entry)}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {entry.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                      >
                        {tag}
                      </span>
                    ))}
                    {entry.tags.length > 3 && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        +{entry.tags.length - 3}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-2">
                    <EditButton entryId={entry._id.toString()} />
                    <button
                      onClick={() => openDeleteModal(entry)}
                      disabled={deletingId !== null}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Delete entry"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Delete confirmation modal */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteConfirm}
        entryTitle={entryToDelete ? getEntryTitle(entryToDelete) : ""}
        isDeleting={deletingId !== null}
      />
    </>
  );
}
