"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AdminLayout from "@/components/AdminLayout";
import { Entry } from "@/types/models";
import Link from "next/link";
import LoadingSpinner from "@/components/LoadingSpinner";

function AdminEntriesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [entries, setEntries] = useState<Entry[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search filters
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [selectedType, setSelectedType] = useState(
    searchParams.get("type") || ""
  );
  const [selectedTags, setSelectedTags] = useState(
    searchParams.get("tags") || ""
  );
  const [page, setPage] = useState(parseInt(searchParams.get("page") || "1"));
  const [limit] = useState(parseInt(searchParams.get("limit") || "25"));
  const [sortBy, setSortBy] = useState(
    searchParams.get("sortBy") || "updatedAt"
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(
    (searchParams.get("sortOrder") as "asc" | "desc") || "desc"
  );

  // Fetch entries
  useEffect(() => {
    const fetchEntries = async () => {
      try {
        setIsLoading(true);
        const offset = (page - 1) * limit;

        const params = new URLSearchParams({
          limit: limit.toString(),
          offset: offset.toString(),
          sortBy: sortBy,
        });

        if (selectedType) {
          params.append("type", selectedType);
        }

        if (selectedTags) {
          params.append("tags", selectedTags);
        }

        let url = `/.netlify/functions/entries?${params.toString()}`;

        // Use search endpoint if there's a query
        if (searchQuery) {
          const searchParams = new URLSearchParams({
            q: searchQuery,
            limit: limit.toString(),
            offset: offset.toString(),
          });

          if (selectedType) {
            searchParams.append("type", selectedType);
          }

          if (selectedTags) {
            searchParams.append("tags", selectedTags);
          }

          url = `/.netlify/functions/search?${searchParams.toString()}`;
        }

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error("Failed to fetch entries");
        }

        const data = await response.json();
        setEntries(data.entries || data.results || []);
        setTotal(data.total);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load entries");
      } finally {
        setIsLoading(false);
      }
    };

    fetchEntries();
  }, [searchQuery, selectedType, selectedTags, page, limit, sortBy, sortOrder]);

  // Update URL with search params
  const updateURL = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (selectedType) params.set("type", selectedType);
    if (selectedTags) params.set("tags", selectedTags);
    if (page > 1) params.set("page", page.toString());
    if (limit !== 25) params.set("limit", limit.toString());
    if (sortBy !== "updatedAt") params.set("sortBy", sortBy);
    if (sortOrder !== "desc") params.set("sortOrder", sortOrder);

    const queryString = params.toString();
    router.push(`/admin/entries${queryString ? `?${queryString}` : ""}`);
  };

  // Handle column sort (only API-supported fields: name, author, createdAt, updatedAt)
  const handleSort = (column: string) => {
    if (sortBy === column) {
      // Toggle sort order
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      // New column, default to descending for dates, ascending for text
      setSortBy(column);
      setSortOrder(
        column === "updatedAt" || column === "createdAt" ? "desc" : "asc"
      );
    }
    setPage(1);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    updateURL();
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedType("");
    setSelectedTags("");
    setSortBy("updatedAt");
    setSortOrder("desc");
    setPage(1);
    router.push("/admin/entries");
  };

  // Sort icon component
  const SortIcon = ({ column }: { column: string }) => {
    if (sortBy !== column) {
      return (
        <svg
          className="w-4 h-4 ml-1 text-dark-text-muted"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
          />
        </svg>
      );
    }
    return sortOrder === "asc" ? (
      <svg
        className="w-4 h-4 ml-1 text-accent-teal"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 15l7-7 7 7"
        />
      </svg>
    ) : (
      <svg
        className="w-4 h-4 ml-1 text-accent-teal"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 9l-7 7-7-7"
        />
      </svg>
    );
  };

  const totalPages = Math.ceil(total / limit);

  const getEntryTitle = (entry: Entry) => {
    if (entry.type === "word" || entry.type === "quote") {
      return entry.name;
    }
    if (entry.type === "phrase" || entry.type === "hypothetical") {
      return (
        entry.body.substring(0, 100) + (entry.body.length > 100 ? "..." : "")
      );
    }
    return "";
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-dark-text">Manage Entries</h1>
          <div className="text-sm text-dark-text-secondary">
            Total: {total} {total === 1 ? "entry" : "entries"}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-dark-bg-secondary border-2 border-dark-border rounded-lg p-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-dark-text mb-1">
                  Search
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search entries..."
                  className="w-full px-3 py-2 bg-dark-bg-tertiary border-2 border-dark-border rounded-md focus:outline-none focus:border-accent-teal text-dark-text placeholder:text-dark-text-muted"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-text mb-1">
                  Type
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-3 py-2 bg-dark-bg-tertiary border-2 border-dark-border rounded-md focus:outline-none focus:border-accent-teal text-dark-text"
                >
                  <option value="">All Types</option>
                  <option value="word">Word</option>
                  <option value="phrase">Phrase</option>
                  <option value="quote">Quote</option>
                  <option value="hypothetical">Hypothetical</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-text mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={selectedTags}
                  onChange={(e) => setSelectedTags(e.target.value)}
                  placeholder="tag1, tag2"
                  className="w-full px-3 py-2 bg-dark-bg-tertiary border-2 border-dark-border rounded-md focus:outline-none focus:border-accent-teal text-dark-text placeholder:text-dark-text-muted"
                />
              </div>

              <div className="flex items-end gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-accent-teal text-dark-bg font-semibold rounded-md hover:bg-accent-teal-dark focus:outline-none focus:ring-2 focus:ring-accent-teal"
                >
                  Search
                </button>
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="px-4 py-2 bg-dark-bg-tertiary border-2 border-dark-border text-dark-text rounded-md hover:bg-dark-border focus:outline-none focus:ring-2 focus:ring-dark-border"
                >
                  Clear
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Results */}
        {error && (
          <div className="bg-accent-pink/10 border-2 border-accent-pink rounded-lg p-4">
            <p className="text-accent-pink">{error}</p>
          </div>
        )}

        {isLoading ? (
          <LoadingSpinner />
        ) : entries.length === 0 ? (
          <div className="bg-dark-bg-secondary border-2 border-dark-border rounded-lg p-6 text-center">
            <p className="text-dark-text-secondary">No entries found</p>
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="bg-dark-bg-secondary border-2 border-dark-border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-dark-border">
                  <thead className="bg-dark-bg-tertiary">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-dark-text-secondary uppercase tracking-wider">
                        Type
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-dark-text-secondary uppercase tracking-wider cursor-pointer hover:bg-dark-border"
                        onClick={() => handleSort("name")}
                      >
                        <div className="flex items-center">
                          Title
                          <SortIcon column="name" />
                        </div>
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-dark-text-secondary uppercase tracking-wider cursor-pointer hover:bg-dark-border"
                        onClick={() => handleSort("author")}
                      >
                        <div className="flex items-center">
                          Author
                          <SortIcon column="author" />
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-dark-text-secondary uppercase tracking-wider">
                        Tags
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-dark-text-secondary uppercase tracking-wider cursor-pointer hover:bg-dark-border"
                        onClick={() => handleSort("updatedAt")}
                      >
                        <div className="flex items-center">
                          Updated
                          <SortIcon column="updatedAt" />
                        </div>
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-dark-text-secondary uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-dark-bg-secondary divide-y divide-dark-border">
                    {entries.map((entry) => {
                      const typeColors = {
                        word: "bg-accent-pink/20 text-accent-pink",
                        phrase: "bg-accent-teal/20 text-accent-teal",
                        quote: "bg-accent-purple/20 text-accent-purple",
                        hypothetical: "bg-accent-blue/20 text-accent-blue",
                      };

                      return (
                        <tr
                          key={entry._id.toString()}
                          className="hover:bg-dark-bg-tertiary"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs font-semibold rounded-full capitalize ${
                                typeColors[entry.type]
                              }`}
                            >
                              {entry.type}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-dark-text max-w-md truncate">
                              {getEntryTitle(entry)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-dark-text">
                              {entry.type === "quote" ? entry.author : "—"}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1">
                              {entry.tags.slice(0, 3).map((tag) => (
                                <span
                                  key={tag}
                                  className="px-2 py-1 text-xs bg-dark-bg-tertiary border border-dark-border text-dark-text-secondary rounded"
                                >
                                  {tag}
                                </span>
                              ))}
                              {entry.tags.length > 3 && (
                                <span className="px-2 py-1 text-xs text-dark-text-muted">
                                  +{entry.tags.length - 3}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-text-secondary">
                            {new Date(entry.updatedAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Link
                              href={`/admin/entries/edit/${entry._id.toString()}`}
                              className="text-accent-teal hover:text-accent-teal-dark"
                            >
                              Edit
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center bg-dark-bg-secondary border-2 border-dark-border rounded-lg p-4">
                <div className="text-sm text-dark-text-secondary">
                  Page {page} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 bg-dark-bg-tertiary border-2 border-dark-border text-dark-text rounded-md hover:bg-dark-border disabled:bg-dark-bg-tertiary disabled:text-dark-text-muted disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 bg-dark-bg-tertiary border-2 border-dark-border text-dark-text rounded-md hover:bg-dark-border disabled:bg-dark-bg-tertiary disabled:text-dark-text-muted disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}

export default function AdminEntriesPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <AdminEntriesContent />
    </Suspense>
  );
}
