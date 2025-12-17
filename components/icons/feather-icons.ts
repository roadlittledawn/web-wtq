/**
 * Feather Icons SVG Paths
 *
 * This file contains SVG path data for Feather icons used throughout the application.
 * Icons are sourced from https://feathericons.com/
 *
 * To add a new icon:
 * 1. Find the icon at https://feathericons.com/
 * 2. Copy the path elements from the SVG
 * 3. Add a new entry to the featherIcons object below
 */

export type FeatherIconName = keyof typeof featherIcons;

export const featherIcons = {
  /**
   * edit-3: Pencil icon for editing/manual entry
   */
  "edit-3": [
    "M12 20h9",
    "M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z",
  ],

  /**
   * download-cloud: Cloud download icon for API-sourced content
   */
  "download-cloud": [
    "M8 17l4 4 4-4",
    "M12 12v9",
    "M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29",
  ],

  /**
   * book-open: Open book icon for dictionary/reference
   */
  "book-open": [
    "M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z",
    "M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z",
  ],

  /**
   * search: Magnifying glass icon for search
   */
  search: ["M21 21l-6-6", "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z"],

  /**
   * x: Close/remove icon
   */
  x: ["M18 6L6 18", "M6 6l12 12"],

  /**
   * check: Checkmark icon for confirmation
   */
  check: ["M20 6L9 17l-5-5"],

  /**
   * plus: Plus icon for adding
   */
  plus: ["M12 5v14", "M5 12h14"],

  /**
   * trash-2: Trash icon for delete
   */
  "trash-2": [
    "M3 6h18",
    "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",
    "M10 11v6",
    "M14 11v6",
  ],
} as const;
