"use client";

import { useState, useEffect } from "react";
import Header from "./Header";

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
      <Header isAuthenticated={isAuthenticated} />

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
