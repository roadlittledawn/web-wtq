"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import AdminNav from "@/components/AdminNav";
import Link from "next/link";
import { Entry } from "@/types/models";

interface Stats {
  words: number;
  phrases: number;
  quotes: number;
  hypotheticals: number;
  total: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    words: 0,
    phrases: 0,
    quotes: 0,
    hypotheticals: 0,
    total: 0,
  });
  const [recentEntries, setRecentEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch stats for each type
        const [wordsRes, phrasesRes, quotesRes, hypotheticalsRes, recentRes] =
          await Promise.all([
            fetch("/api/entries?type=word&limit=1"),
            fetch("/api/entries?type=phrase&limit=1"),
            fetch("/api/entries?type=quote&limit=1"),
            fetch("/api/entries?type=hypothetical&limit=1"),
            fetch("/api/entries?sortBy=createdAt&limit=10"),
          ]);

        const [words, phrases, quotes, hypotheticals, recent] =
          await Promise.all([
            wordsRes.json(),
            phrasesRes.json(),
            quotesRes.json(),
            hypotheticalsRes.json(),
            recentRes.json(),
          ]);

        setStats({
          words: words.total || 0,
          phrases: phrases.total || 0,
          quotes: quotes.total || 0,
          hypotheticals: hypotheticals.total || 0,
          total:
            (words.total || 0) +
            (phrases.total || 0) +
            (quotes.total || 0) +
            (hypotheticals.total || 0),
        });

        setRecentEntries(recent.entries || []);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const statCards = [
    {
      label: "Words",
      value: stats.words,
      icon: "📖",
      color: "border-accent-pink",
    },
    {
      label: "Phrases",
      value: stats.phrases,
      icon: "💬",
      color: "border-accent-teal",
    },
    {
      label: "Quotes",
      value: stats.quotes,
      icon: "💭",
      color: "border-accent-purple",
    },
    {
      label: "Hypotheticals",
      value: stats.hypotheticals,
      icon: "🤔",
      color: "border-accent-blue",
    },
  ];

  return (
    <AdminLayout>
      <AdminNav />

      <div className="space-y-6">
        {/* Stats Grid */}
        <div>
          <h2 className="text-2xl font-bold text-dark-text mb-4">
            Collection Stats
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((stat) => (
              <div
                key={stat.label}
                className={`bg-dark-bg-secondary border-2 ${stat.color} rounded-lg p-6 hover:bg-dark-bg-tertiary transition-colors`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-dark-text-secondary text-sm font-medium">
                      {stat.label}
                    </p>
                    <p className="text-3xl font-bold text-dark-text mt-2">
                      {loading ? "..." : stat.value}
                    </p>
                  </div>
                  <div className="text-4xl">{stat.icon}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="mt-4 bg-dark-bg-secondary border-2 border-accent-teal rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-dark-text-secondary text-sm font-medium">
                  Total Entries
                </p>
                <p className="text-4xl font-bold text-accent-teal mt-2">
                  {loading ? "..." : stats.total}
                </p>
              </div>
              <div className="text-5xl">🎯</div>
            </div>
          </div>
        </div>

        {/* Recent Entries */}
        <div>
          <h2 className="text-2xl font-bold text-dark-text mb-4">
            Recent Entries
          </h2>
          <div className="bg-dark-bg-secondary border border-dark-border rounded-lg overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-dark-text-secondary">
                Loading...
              </div>
            ) : recentEntries.length === 0 ? (
              <div className="p-8 text-center text-dark-text-secondary">
                No entries yet. Create your first entry!
              </div>
            ) : (
              <div className="divide-y divide-dark-border">
                {recentEntries.map((entry) => {
                  const displayName =
                    "name" in entry
                      ? entry.name
                      : "text" in entry
                      ? entry.text
                      : "body" in entry
                      ? entry.body
                      : "Unknown";
                  const displayDefinition =
                    "definition" in entry ? entry.definition : undefined;
                  const displayAuthor =
                    "author" in entry ? entry.author : undefined;

                  return (
                    <Link
                      key={entry._id.toString()}
                      href={`/admin/entries/${entry._id}`}
                      className="block p-4 hover:bg-dark-bg-tertiary transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`inline-block px-2 py-1 text-xs font-semibold rounded ${
                                entry.type === "word"
                                  ? "bg-accent-pink/20 text-accent-pink"
                                  : entry.type === "phrase"
                                  ? "bg-accent-teal/20 text-accent-teal"
                                  : entry.type === "quote"
                                  ? "bg-accent-purple/20 text-accent-purple"
                                  : "bg-accent-blue/20 text-accent-blue"
                              }`}
                            >
                              {entry.type}
                            </span>
                            <h3 className="text-dark-text font-semibold">
                              {displayName}
                            </h3>
                          </div>
                          {displayDefinition && (
                            <p className="text-dark-text-secondary text-sm line-clamp-2">
                              {displayDefinition}
                            </p>
                          )}
                          {displayAuthor && (
                            <p className="text-dark-text-muted text-xs mt-1">
                              by {displayAuthor}
                            </p>
                          )}
                        </div>
                        <div className="text-dark-text-muted text-xs ml-4">
                          {new Date(entry.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
