"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * AdminNav component provides navigation links for admin interface
 * Includes links to create and list entries
 * Requirements: 2.10
 */
export default function AdminNav() {
  const pathname = usePathname();

  const navItems = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/entries", label: "All Entries" },
    { href: "/admin/entries/create", label: "Create Entry" },
  ];

  return (
    <nav className="bg-white rounded-lg shadow mb-6">
      <div className="px-4 py-3">
        <ul className="flex flex-wrap gap-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`inline-block px-4 py-2 rounded-md transition-colors ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
