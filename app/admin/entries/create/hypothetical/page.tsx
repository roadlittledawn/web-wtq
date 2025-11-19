"use client";

import AdminLayout from "@/components/AdminLayout";
import AdminNav from "@/components/AdminNav";
import EntryForm from "@/components/EntryForm";

/**
 * Hypothetical entry creation page
 * Integrates EntryForm component for hypothetical type
 * Requirements: 2.6, 2.7
 */
export default function CreateHypotheticalPage() {
  return (
    <AdminLayout>
      <AdminNav />
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-semibold mb-6">
          Create Hypothetical Entry
        </h2>
        <EntryForm entryType="hypothetical" mode="create" />
      </div>
    </AdminLayout>
  );
}
