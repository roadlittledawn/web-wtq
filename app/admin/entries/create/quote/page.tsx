"use client";

import AdminLayout from "@/components/AdminLayout";
import AdminNav from "@/components/AdminNav";
import EntryForm from "@/components/EntryForm";

/**
 * Quote entry creation page
 * Integrates EntryForm component for quote type
 * Requirements: 2.6, 2.7
 */
export default function CreateQuotePage() {
  return (
    <AdminLayout>
      <AdminNav />
      <div className="bg-dark-bg-secondary border-2 border-dark-border rounded-lg p-6">
        <h2 className="text-2xl font-semibold text-dark-text mb-6">
          Create Quote Entry
        </h2>
        <EntryForm entryType="quote" mode="create" />
      </div>
    </AdminLayout>
  );
}
