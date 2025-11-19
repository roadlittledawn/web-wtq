"use client";

import Link from "next/link";

interface EditButtonProps {
  entryId: string;
}

/**
 * EditButton component provides a link to edit an entry
 * Displays an edit icon that navigates to the edit page
 * Requirements: 2.10
 */
export default function EditButton({ entryId }: EditButtonProps) {
  return (
    <Link
      href={`/admin/entries/edit/${entryId}`}
      className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
      title="Edit entry"
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
          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
        />
      </svg>
    </Link>
  );
}
