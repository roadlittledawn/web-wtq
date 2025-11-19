"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AdminLayout from "@/components/AdminLayout";
import AdminNav from "@/components/AdminNav";
import EntryForm from "@/components/EntryForm";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Entry } from "@/types/models";

/**
 * Edit entry page
 * Fetches existing entry data and pre-populates EntryForm
 * Requirements: 3.1, 3.2, 3.3, 3.5
 */
export default function EditEntryPage() {
  const params = useParams();
  const id = params?.id as string;

  const [entry, setEntry] = useState<Entry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchEntry = async () => {
      if (!id) {
        setError("Entry ID is required");
        setLoading(false);
        return;
      }

      try {
        // Fetch entry by ID
        // Requirement: 3.1 - Fetch existing entry data
        const response = await fetch(`/.netlify/functions/entries?id=${id}`);

        if (!response.ok) {
          const errorData = await response.json();
          setError(errorData.error?.message || "Failed to fetch entry");
          setLoading(false);
          return;
        }

        const data = await response.json();
        setEntry(data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching entry:", err);
        setError("Network error. Please try again.");
        setLoading(false);
      }
    };

    fetchEntry();
  }, [id]);

  if (loading) {
    return (
      <AdminLayout>
        <AdminNav />
        <div className="flex justify-center items-center min-h-[400px]">
          <LoadingSpinner />
        </div>
      </AdminLayout>
    );
  }

  if (error || !entry) {
    return (
      <AdminLayout>
        <AdminNav />
        <div className="bg-white rounded-lg shadow p-6">
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error || "Entry not found"}</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <AdminNav />
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-semibold mb-6">
          Edit {entry.type.charAt(0).toUpperCase() + entry.type.slice(1)} Entry
        </h2>
        {/* Pre-populate EntryForm with existing data */}
        {/* Requirements: 3.1, 3.2, 3.3, 3.5 */}
        <EntryForm entryType={entry.type} initialData={entry} mode="edit" />
      </div>
    </AdminLayout>
  );
}
