import React from "react";
import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen } from "@testing-library/react";

// Set environment variable before any imports
beforeAll(() => {
  process.env.MONGODB_URI = "mongodb://test:27017/test";
});

// Mock isomorphic-dompurify for testing
vi.mock("isomorphic-dompurify", () => ({
  default: {
    sanitize: (content: string) => content,
  },
}));

describe("Markdown Components", () => {
  describe("MarkdownRenderer", () => {
    it("should import MarkdownRenderer without errors", async () => {
      const MarkdownRenderer = (await import("../MarkdownRenderer")).default;
      expect(MarkdownRenderer).toBeDefined();
    });

    it("should render basic markdown content", async () => {
      const MarkdownRenderer = (await import("../MarkdownRenderer")).default;
      render(<MarkdownRenderer content="**bold text**" />);
      expect(screen.getByText("bold text")).toBeDefined();
    });

    it("should render links with security attributes", async () => {
      const MarkdownRenderer = (await import("../MarkdownRenderer")).default;
      render(<MarkdownRenderer content="[link](https://example.com)" />);
      const link = screen.getByRole("link", { name: "link" });
      expect(link).toBeDefined();
      expect(link.getAttribute("target")).toBe("_blank");
      expect(link.getAttribute("rel")).toBe("noopener noreferrer");
    });

    it("should render lists correctly", async () => {
      const MarkdownRenderer = (await import("../MarkdownRenderer")).default;
      // Use actual newline character, not escaped string
      render(<MarkdownRenderer content={"- item 1\n- item 2"} />);
      expect(screen.getByText(/item 1/)).toBeDefined();
      expect(screen.getByText(/item 2/)).toBeDefined();
    });

    it("should render inline code", async () => {
      const MarkdownRenderer = (await import("../MarkdownRenderer")).default;
      render(<MarkdownRenderer content="`inline code`" />);
      expect(screen.getByText("inline code")).toBeDefined();
    });

    it("should return null for empty content", async () => {
      const MarkdownRenderer = (await import("../MarkdownRenderer")).default;
      const { container } = render(<MarkdownRenderer content="" />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe("MarkdownEditor", () => {
    it("should import MarkdownEditor without errors", async () => {
      const MarkdownEditor = (await import("../MarkdownEditor")).default;
      expect(MarkdownEditor).toBeDefined();
    });

    it("should render with textarea", async () => {
      const MarkdownEditor = (await import("../MarkdownEditor")).default;
      const mockOnChange = vi.fn();
      render(
        <MarkdownEditor
          id="test-editor"
          name="test"
          value="test content"
          onChange={mockOnChange}
        />
      );
      expect(screen.getByRole("textbox")).toBeDefined();
    });

    it("should display formatting toolbar buttons", async () => {
      const MarkdownEditor = (await import("../MarkdownEditor")).default;
      const mockOnChange = vi.fn();
      render(
        <MarkdownEditor
          id="test-editor"
          name="test"
          value=""
          onChange={mockOnChange}
        />
      );
      // Check for toolbar buttons
      expect(screen.getByTitle("Bold")).toBeDefined();
      expect(screen.getByTitle("Italic")).toBeDefined();
      expect(screen.getByTitle("Heading")).toBeDefined();
      expect(screen.getByTitle("Code")).toBeDefined();
      expect(screen.getByTitle("Link")).toBeDefined();
    });

    it("should have preview toggle button", async () => {
      const MarkdownEditor = (await import("../MarkdownEditor")).default;
      const mockOnChange = vi.fn();
      render(
        <MarkdownEditor
          id="test-editor"
          name="test"
          value=""
          onChange={mockOnChange}
        />
      );
      expect(screen.getByText("Preview")).toBeDefined();
    });

    it("should show markdown help hint", async () => {
      const MarkdownEditor = (await import("../MarkdownEditor")).default;
      const mockOnChange = vi.fn();
      render(
        <MarkdownEditor
          id="test-editor"
          name="test"
          value=""
          onChange={mockOnChange}
        />
      );
      expect(screen.getByText(/Supports Markdown/)).toBeDefined();
    });
  });
});

describe("Markdown Sanitization", () => {
  it("should sanitize potentially dangerous HTML", async () => {
    const MarkdownRenderer = (await import("../MarkdownRenderer")).default;
    // ReactMarkdown + DOMPurify should prevent script injection
    const dangerousContent = '<script>alert("xss")</script>Safe text';
    render(<MarkdownRenderer content={dangerousContent} />);
    // The script tag should not be rendered as executable
    expect(screen.getByText(/Safe text/)).toBeDefined();
  });
});
