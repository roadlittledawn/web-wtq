"use client";

import { useEffect } from "react";
import { useAuth } from "./AuthProvider";
import { logout, redirectToLogin } from "@/lib/auth-client";

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * Protects admin routes. Signed-out users are sent to the clang-auth login
 * page and come back here afterwards. Signed-in users without the admin role
 * see a message instead (redirecting them would loop).
 */
export default function AuthGuard({ children }: AuthGuardProps) {
  const { status, isAdmin } = useAuth();

  useEffect(() => {
    if (status === "signed-out") redirectToLogin();
  }, [status]);

  if (status === "signed-in" && isAdmin) {
    return <>{children}</>;
  }

  if (status === "signed-in" || status === "no-access") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-dark-text">You&apos;re signed in, but you don&apos;t have admin access to Lexicon.</p>
          <button
            onClick={async () => {
              await logout();
              window.location.assign("/");
            }}
            className="px-4 py-2 bg-accent-pink text-white rounded-md hover:bg-accent-pink-light transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Checking authentication...</p>
      </div>
    </div>
  );
}
