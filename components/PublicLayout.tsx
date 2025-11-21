"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

interface PublicLayoutProps {
  children: React.ReactNode;
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const expirationTime = payload.exp * 1000;
        const currentTime = Date.now();
        setIsAuthenticated(currentTime < expirationTime);
      } catch (error) {
        setIsAuthenticated(false);
      }
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-dark-bg">
      <header className="bg-dark-bg-secondary border-b border-dark-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="text-2xl font-bold text-dark-text hover:text-accent-teal transition-colors"
            >
              Clinton Lexicon
            </Link>
            <nav>
              <ul className="flex items-center space-x-6">
                <li>
                  <Link
                    href="/words"
                    className="text-dark-text hover:text-accent-teal transition-colors"
                  >
                    Words
                  </Link>
                </li>
                <li>
                  <Link
                    href="/phrases"
                    className="text-dark-text hover:text-accent-teal transition-colors"
                  >
                    Phrases
                  </Link>
                </li>
                <li>
                  <Link
                    href="/quotes"
                    className="text-dark-text hover:text-accent-teal transition-colors"
                  >
                    Quotes
                  </Link>
                </li>
                <li>
                  <Link
                    href="/hypotheticals"
                    className="text-dark-text hover:text-accent-teal transition-colors"
                  >
                    Hypotheticals
                  </Link>
                </li>
                <li>
                  <Link
                    href="/search"
                    className="text-dark-text hover:text-accent-teal transition-colors"
                    title="Search"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </Link>
                </li>
                {isAuthenticated && (
                  <li>
                    <Link
                      href="/admin"
                      className="px-3 py-1 bg-accent-pink text-white rounded hover:bg-accent-pink-light transition-colors"
                    >
                      Admin
                    </Link>
                  </li>
                )}
              </ul>
            </nav>
          </div>
        </div>
      </header>

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
