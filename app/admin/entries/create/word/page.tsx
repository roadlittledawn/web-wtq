"use client";

import AdminLayout from "@/components/AdminLayout";
import AdminNav from "@/components/AdminNav";
import EntryForm from "@/components/EntryForm";

/**
 * Word entry creation page
 * Integrates EntryForm component for word type
 * Requirements: 2.6, 2.7
 */
export default function CreateWordPage() {
  return (
    <AdminLayout>
      <AdminNav />
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-semibold mb-6">Create Word Entry</h2>
        <EntryForm entryType="word" mode="create" />
      </div>
    </AdminLayout>
  );
}
