"use client";

import Header from "./Header";
import { useAuth } from "./AuthProvider";

interface PublicLayoutProps {
  children: React.ReactNode;
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  const { isAdmin } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-dark-bg">
      <Header isAuthenticated={isAdmin} />

      <main className="flex-grow container mx-auto px-4 py-8">{children}</main>

      <footer className="bg-dark-bg-secondary border-t border-dark-border">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-dark-text-secondary">
            <p>
              &copy; {new Date().getFullYear()} Clinton Lexicon. All rights
              reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
