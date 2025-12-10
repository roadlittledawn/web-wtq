"use client";

import Link from "next/link";
import { useState } from "react";

interface HeaderProps {
  isAuthenticated: boolean;
}

export default function Header({ isAuthenticated }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="bg-dark-bg-secondary border-b border-dark-border">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo - full on desktop, abbreviated on mobile */}
          <Link
            href="/"
            className="text-2xl font-bold text-dark-text hover:text-accent-teal transition-colors"
          >
            <span className="hidden sm:inline">Clinton Lexicon</span>
            <span className="sm:hidden">CL</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:block">
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
              {isAuthenticated ? (
                <li>
                  <Link
                    href="/admin"
                    className="px-3 py-1 bg-accent-pink text-white rounded hover:bg-accent-pink-light transition-colors"
                  >
                    Admin
                  </Link>
                </li>
              ) : (
                <li>
                  <Link
                    href="/login"
                    className="px-3 py-1 bg-accent-teal text-white rounded hover:opacity-90 transition-opacity"
                  >
                    Login
                  </Link>
                </li>
              )}
            </ul>
          </nav>

          {/* Mobile Hamburger Button */}
          <button
            onClick={toggleMobileMenu}
            className="md:hidden text-dark-text hover:text-accent-teal transition-colors focus:outline-none"
            aria-label="Toggle menu"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isMobileMenuOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Slide-in Menu */}
      <div
        className={`fixed inset-0 bg-dark-bg z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Mobile Menu Header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-dark-border">
            <Link
              href="/"
              className="text-2xl font-bold text-dark-text hover:text-accent-teal transition-colors"
              onClick={closeMobileMenu}
            >
              CL
            </Link>
            <button
              onClick={closeMobileMenu}
              className="text-dark-text hover:text-accent-teal transition-colors focus:outline-none"
              aria-label="Close menu"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Mobile Menu Navigation */}
          <nav className="flex-grow overflow-y-auto">
            <ul className="flex flex-col py-4">
              <li>
                <Link
                  href="/words"
                  className="block px-6 py-4 text-lg text-dark-text hover:bg-dark-bg-secondary hover:text-accent-teal transition-colors border-b border-dark-border"
                  onClick={closeMobileMenu}
                >
                  Words
                </Link>
              </li>
              <li>
                <Link
                  href="/phrases"
                  className="block px-6 py-4 text-lg text-dark-text hover:bg-dark-bg-secondary hover:text-accent-teal transition-colors border-b border-dark-border"
                  onClick={closeMobileMenu}
                >
                  Phrases
                </Link>
              </li>
              <li>
                <Link
                  href="/quotes"
                  className="block px-6 py-4 text-lg text-dark-text hover:bg-dark-bg-secondary hover:text-accent-teal transition-colors border-b border-dark-border"
                  onClick={closeMobileMenu}
                >
                  Quotes
                </Link>
              </li>
              <li>
                <Link
                  href="/hypotheticals"
                  className="block px-6 py-4 text-lg text-dark-text hover:bg-dark-bg-secondary hover:text-accent-teal transition-colors border-b border-dark-border"
                  onClick={closeMobileMenu}
                >
                  Hypotheticals
                </Link>
              </li>
              <li>
                <Link
                  href="/search"
                  className="block px-6 py-4 text-lg text-dark-text hover:bg-dark-bg-secondary hover:text-accent-teal transition-colors border-b border-dark-border"
                  onClick={closeMobileMenu}
                >
                  Search
                </Link>
              </li>
              {isAuthenticated && (
                <li>
                  <Link
                    href="/admin"
                    className="block px-6 py-4 text-lg text-dark-text hover:bg-dark-bg-secondary hover:text-accent-teal transition-colors border-b border-dark-border"
                    onClick={closeMobileMenu}
                  >
                    Admin
                  </Link>
                </li>
              )}
            </ul>
          </nav>

          {/* Mobile Menu Footer with Login/Admin Button */}
          <div className="px-6 py-6 border-t border-dark-border">
            {isAuthenticated ? (
              <Link
                href="/admin"
                className="block w-full text-center px-4 py-3 bg-accent-pink text-white rounded hover:bg-accent-pink-light transition-colors"
                onClick={closeMobileMenu}
              >
                Admin Dashboard
              </Link>
            ) : (
              <Link
                href="/login"
                className="block w-full text-center px-4 py-3 bg-accent-teal text-white rounded hover:opacity-90 transition-opacity"
                onClick={closeMobileMenu}
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
