"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * AuthGuard HOC that protects admin routes
 * Checks for valid JWT token and redirects to login if not authenticated
 * Handles token expiration
 */
export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("auth_token");

      if (!token) {
        // No token found, redirect to login
        router.push("/admin/login");
        return;
      }

      try {
        // Decode JWT to check expiration
        const payload = JSON.parse(atob(token.split(".")[1]));
        const expirationTime = payload.exp * 1000; // Convert to milliseconds
        const currentTime = Date.now();

        if (currentTime >= expirationTime) {
          // Token expired, clear it and redirect to login
          localStorage.removeItem("auth_token");
          router.push("/admin/login");
          return;
        }

        // Token is valid
        setIsAuthenticated(true);
      } catch (error) {
        // Invalid token format, clear it and redirect to login
        console.error("Invalid token:", error);
        localStorage.removeItem("auth_token");
        router.push("/admin/login");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
