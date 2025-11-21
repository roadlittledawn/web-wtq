"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
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
      <div className="min-h-screen bg-dark-bg">
        <header className="bg-dark-bg-secondary border-b border-dark-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <div className="flex items-center gap-6">
              <h1 className="text-2xl font-bold text-dark-text">
                Clinton Lexicon Admin
              </h1>
              <Link
                href="/"
                className="text-sm text-accent-teal hover:text-accent-teal-dark transition-colors flex items-center gap-1"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                View Site
              </Link>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-accent-pink text-white rounded-md hover:bg-accent-pink-light focus:outline-none focus:ring-2 focus:ring-accent-pink transition-colors"
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
