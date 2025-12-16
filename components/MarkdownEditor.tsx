"use client";

import React, { useState, useCallback } from "react";
import MarkdownRenderer from "./MarkdownRenderer";

interface MarkdownEditorProps {
  id: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  disabled?: boolean;
  rows?: number;
  placeholder?: string;
  className?: string;
  error?: string;
}

/**
 * MarkdownEditor component for editing Markdown content with preview
 * Features:
 * - Live preview toggle
 * - Markdown formatting toolbar
 * - Consistent styling with form inputs
 */
export default function MarkdownEditor({
  id,
  name,
  value,
  onChange,
  disabled = false,
  rows = 3,
  placeholder = "",
  className = "",
  error,
}: MarkdownEditorProps) {
  const [showPreview, setShowPreview] = useState(false);

  const insertMarkdown = useCallback(
    (before: string, after: string = "", placeholder: string = "") => {
      const textarea = document.getElementById(id) as HTMLTextAreaElement;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = value.substring(start, end);
      const textToInsert = selectedText || placeholder;
      const newValue =
        value.substring(0, start) +
        before +
        textToInsert +
        after +
        value.substring(end);

      // Create a synthetic event to trigger onChange
      const syntheticEvent = {
        target: {
          name,
          value: newValue,
        },
      } as React.ChangeEvent<HTMLTextAreaElement>;

      onChange(syntheticEvent);

      // Set cursor position after the inserted text
      setTimeout(() => {
        textarea.focus();
        const cursorPos = start + before.length + textToInsert.length + after.length;
        textarea.setSelectionRange(cursorPos, cursorPos);
      }, 0);
    },
    [id, name, value, onChange]
  );

  const toolbarButtons = [
    { label: "B", title: "Bold", action: () => insertMarkdown("**", "**", "bold text") },
    { label: "I", title: "Italic", action: () => insertMarkdown("*", "*", "italic text") },
    { label: "H", title: "Heading", action: () => insertMarkdown("## ", "", "heading") },
    { label: "—", title: "Strikethrough", action: () => insertMarkdown("~~", "~~", "strikethrough") },
    { label: "•", title: "Bullet List", action: () => insertMarkdown("\n- ", "", "list item") },
    { label: "1.", title: "Numbered List", action: () => insertMarkdown("\n1. ", "", "list item") },
    { label: "<>", title: "Code", action: () => insertMarkdown("`", "`", "code") },
    { label: "🔗", title: "Link", action: () => insertMarkdown("[", "](url)", "link text") },
    { label: "❝", title: "Quote", action: () => insertMarkdown("\n> ", "", "quote") },
  ];

  return (
    <div className={`markdown-editor ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-1 flex-wrap gap-1">
        <div className="flex items-center gap-1">
          {toolbarButtons.map((btn) => (
            <button
              key={btn.title}
              type="button"
              title={btn.title}
              onClick={btn.action}
              disabled={disabled || showPreview}
              className="px-2 py-1 text-xs bg-dark-bg-tertiary border border-dark-border rounded hover:bg-dark-border disabled:opacity-50 disabled:cursor-not-allowed text-dark-text font-mono"
            >
              {btn.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setShowPreview(!showPreview)}
          className={`px-2 py-1 text-xs rounded ${
            showPreview
              ? "bg-accent-teal text-dark-bg"
              : "bg-dark-bg-tertiary border border-dark-border text-dark-text"
          } hover:opacity-80`}
        >
          {showPreview ? "Edit" : "Preview"}
        </button>
      </div>

      {/* Editor or Preview */}
      {showPreview ? (
        <div
          className={`w-full px-3 py-2 bg-dark-bg-secondary border-2 rounded-md min-h-[${rows * 24}px] ${
            error ? "border-accent-pink" : "border-dark-border"
          }`}
        >
          {value ? (
            <MarkdownRenderer content={value} className="text-sm text-dark-text-secondary" />
          ) : (
            <p className="text-dark-text-muted italic text-sm">No content to preview</p>
          )}
        </div>
      ) : (
        <textarea
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          rows={rows}
          placeholder={placeholder}
          className={`w-full px-3 py-2 bg-dark-bg-secondary border-2 rounded-md focus:outline-none text-dark-text font-mono text-sm ${
            error
              ? "border-accent-pink focus:border-accent-pink"
              : "border-dark-border focus:border-accent-teal"
          } disabled:bg-dark-bg-tertiary disabled:text-dark-text-muted`}
        />
      )}

      {/* Markdown help hint */}
      <p className="text-xs text-dark-text-muted mt-1">
        Supports Markdown: **bold**, *italic*, `code`, [links](url), lists, and more.
      </p>
    </div>
  );
}
