"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import DOMPurify from "isomorphic-dompurify";
import { useMemo } from "react";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

/**
 * MarkdownRenderer component for safely rendering Markdown content
 * Features:
 * - Supports GitHub Flavored Markdown (GFM) including tables, strikethrough, and task lists
 * - Sanitizes HTML to prevent XSS vulnerabilities
 * - Consistent styling for markdown elements
 */
export default function MarkdownRenderer({
  content,
  className = "",
}: MarkdownRendererProps) {
  // Sanitize content before rendering to prevent XSS
  // Uses isomorphic-dompurify which works on both server and client
  const sanitizedContent = useMemo(() => {
    return DOMPurify.sanitize(content);
  }, [content]);

  if (!content) {
    return null;
  }

  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Style headings
          h1: ({ children }) => (
            <h1 className="text-xl font-bold mb-2 mt-4 text-dark-text">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-bold mb-2 mt-3 text-dark-text">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-bold mb-1 mt-2 text-dark-text">
              {children}
            </h3>
          ),
          // Style paragraphs
          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
          // Style links
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-teal hover:text-accent-teal-dark underline"
            >
              {children}
            </a>
          ),
          // Style lists
          ul: ({ children }) => (
            <ul className="list-disc list-inside mb-2 ml-2">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside mb-2 ml-2">{children}</ol>
          ),
          li: ({ children }) => <li className="mb-1">{children}</li>,
          // Style code
          code: ({ children, className }) => {
            // Check if this is inline code (no className) or a code block
            const isInline = !className;
            if (isInline) {
              return (
                <code className="bg-dark-bg-tertiary px-1.5 py-0.5 rounded text-sm text-accent-pink font-mono">
                  {children}
                </code>
              );
            }
            return (
              <code className={`${className} font-mono text-sm`}>
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="bg-dark-bg-tertiary p-3 rounded-md overflow-x-auto mb-2 text-sm">
              {children}
            </pre>
          ),
          // Style blockquotes
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-accent-purple pl-4 italic text-dark-text-secondary my-2">
              {children}
            </blockquote>
          ),
          // Style strong/emphasis
          strong: ({ children }) => (
            <strong className="font-bold">{children}</strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
          // Style horizontal rules
          hr: () => <hr className="border-dark-border my-4" />,
          // Style tables (GFM)
          table: ({ children }) => (
            <div className="overflow-x-auto mb-2">
              <table className="min-w-full border border-dark-border">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-dark-bg-tertiary">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="px-3 py-2 text-left border-b border-dark-border font-semibold">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 border-b border-dark-border">{children}</td>
          ),
        }}
      >
        {sanitizedContent}
      </ReactMarkdown>
    </div>
  );
}
