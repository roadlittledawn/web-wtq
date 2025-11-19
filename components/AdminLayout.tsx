"use client";

import { useRouter } from "next/navigation";
import AuthGuard from "./AuthGuard";

interface AdminLayoutProps {
  children: React.ReactNode;
}

/**
 * AdminLayout component that wraps admin pages with authentication
 * Provides consistent header with logout functionality
 * Requirements: 2.8
 */
export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    router.push("/admin/login");
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Clinton Lexicon Admin
            </h1>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
            >
              Logout
            </button>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
