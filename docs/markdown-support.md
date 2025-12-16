# Markdown Support Documentation

This document describes the Markdown formatting support available in the application.

## Overview

The application supports Markdown formatting in the **notes** field across all entry types (words, phrases, quotes, and hypotheticals). This allows for richer content presentation including headings, lists, links, code, and other formatting.

## Supported Markdown Syntax

### Basic Formatting

| Syntax | Result |
|--------|--------|
| `**bold**` | **bold text** |
| `*italic*` | *italic text* |
| `~~strikethrough~~` | ~~strikethrough~~ |
| `` `code` `` | inline code |

### Headings

```markdown
## Heading 2
### Heading 3
```

### Lists

**Bullet List:**
```markdown
- Item 1
- Item 2
- Item 3
```

**Numbered List:**
```markdown
1. First item
2. Second item
3. Third item
```

### Links

```markdown
[Link text](https://example.com)
```

All links automatically open in new tabs with security attributes (`target="_blank"` and `rel="noopener noreferrer"`).

### Code Blocks

````markdown
```
code block
with multiple lines
```
````

### Blockquotes

```markdown
> This is a quoted text
```

### Tables (GitHub Flavored Markdown)

```markdown
| Column 1 | Column 2 |
|----------|----------|
| Data 1   | Data 2   |
```

## Editing Interface

### Toolbar

The Markdown editor provides a formatting toolbar with the following buttons:

- **B** - Insert bold text
- **I** - Insert italic text  
- **H** - Insert heading
- **—** - Insert strikethrough
- **•** - Insert bullet list item
- **1.** - Insert numbered list item
- **<>** - Insert inline code
- **🔗** - Insert link
- **❝** - Insert blockquote

### Preview Mode

Click the "Preview" button to see a live preview of your Markdown content. Click "Edit" to return to the editing mode.

## Security

All Markdown content is sanitized before rendering to prevent XSS (Cross-Site Scripting) vulnerabilities:

- HTML tags are escaped or removed
- JavaScript code is not executed
- Links are opened safely with `noopener noreferrer`

The sanitization is performed using DOMPurify, a trusted XSS sanitization library.

## Components

### MarkdownRenderer

A component for displaying Markdown content. Used in entry cards to render the notes field.

```tsx
import MarkdownRenderer from "@/components/MarkdownRenderer";

<MarkdownRenderer content="**Bold** and *italic*" />
```

### MarkdownEditor

A component for editing Markdown content with toolbar and preview functionality. Used in form components.

```tsx
import MarkdownEditor from "@/components/MarkdownEditor";

<MarkdownEditor
  id="notes"
  name="notes"
  value={value}
  onChange={handleChange}
  rows={3}
  placeholder="Add notes with Markdown formatting..."
/>
```

## Fields Supporting Markdown

Currently, Markdown formatting is supported in the following fields:

| Entry Type | Field |
|------------|-------|
| Word | notes |
| Phrase | notes |
| Quote | notes |
| Hypothetical | notes |

## Testing

Tests for Markdown rendering and sanitization are available in `components/__tests__/markdown.test.tsx`. Run with:

```bash
npm run test -- components/__tests__/markdown.test.tsx
```
