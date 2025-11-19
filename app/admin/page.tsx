"use client";

import AdminLayout from "@/components/AdminLayout";
import AdminNav from "@/components/AdminNav";

export default function AdminDashboard() {
  return (
    <AdminLayout>
      <AdminNav />
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">
          Welcome to Clinton Lexicon Admin
        </h2>
        <p className="text-gray-600">
          You are successfully authenticated. Use the navigation above to manage
          your collection.
        </p>
      </div>
    </AdminLayout>
  );
}
