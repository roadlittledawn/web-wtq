"use client";

import { useState, FormEvent } from "react";

interface LoginFormProps {
  onSuccess?: () => void;
}

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/.netlify/functions/auth-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error?.message || "Login failed");
        setIsLoading(false);
        return;
      }

      // Store JWT token in localStorage
      if (data.token) {
        localStorage.setItem("auth_token", data.token);

        // Call success callback if provided
        if (onSuccess) {
          onSuccess();
        }
      } else {
        setError("No token received from server");
      }
    } catch (err) {
      setError("Network error. Please try again.");
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md">
      <div>
        <label
          htmlFor="username"
          className="block text-sm font-semibold text-white mb-1"
        >
          Username
        </label>
        <input
          type="text"
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className="w-full px-3 py-2 bg-dark-bg-secondary border-2 border-dark-border rounded-md focus:outline-none focus:border-accent-teal text-dark-text"
          disabled={isLoading}
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-semibold text-white mb-1"
        >
          Password
        </label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full px-3 py-2 bg-dark-bg-secondary border-2 border-dark-border rounded-md focus:outline-none focus:border-accent-teal text-dark-text"
          disabled={isLoading}
        />
      </div>

      {error && (
        <div className="p-3 bg-accent-pink/10 border-2 border-accent-pink rounded-md">
          <p className="text-sm text-accent-pink">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-2 px-4 bg-accent-teal text-dark-bg font-semibold rounded-md hover:bg-accent-teal-dark focus:outline-none focus:ring-2 focus:ring-accent-teal disabled:bg-dark-border disabled:cursor-not-allowed disabled:text-dark-text-muted"
      >
        {isLoading ? "Logging in..." : "Log In"}
      </button>
    </form>
  );
}
