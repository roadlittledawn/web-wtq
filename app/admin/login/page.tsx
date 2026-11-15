"use client";

import { useEffect } from "react";
import { redirectToLogin } from "@/lib/auth-client";

/**
 * Sign-in now happens at the shared clang-auth service. This route stays so
 * existing links and bookmarks keep working: it sends you there and you come
 * back to the admin dashboard.
 */
export default function AdminLoginPage() {
  useEffect(() => {
    redirectToLogin(`${window.location.origin}/admin`);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-bg">
      <p className="text-dark-text-secondary">Redirecting to sign in…</p>
    </div>
  );
}
