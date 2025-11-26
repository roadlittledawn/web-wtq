/**
 * Test Name Parsing Logic
 *
 * This script tests the name parsing logic used in the migration
 * to show how different name formats will be parsed.
 *
 * Run with: node scripts/test-name-parsing.js
 */

function parseAuthorName(name) {
  if (!name || typeof name !== "string") {
    return { firstName: "", lastName: "" };
  }

  const trimmedName = name.trim();

  // Check if name contains a comma (format: "LastName, FirstName")
  if (trimmedName.includes(",")) {
    const parts = trimmedName.split(",").map((p) => p.trim());
    return {
      lastName: parts[0] || "",
      firstName: parts[1] || "",
    };
  }

  // Check if name has multiple words (format: "FirstName LastName")
  const words = trimmedName.split(/\s+/);
  if (words.length >= 2) {
    // Last word is last name, everything else is first name
    return {
      firstName: words.slice(0, -1).join(" "),
      lastName: words[words.length - 1],
    };
  }

  // Single word name - treat as last name
  return {
    firstName: "",
    lastName: trimmedName,
  };
}

// Test cases
const testNames = [
  "Doe, John",
  "Smith, Jane Marie",
  "John Doe",
  "Jane Marie Smith",
  "Madonna",
  "Martin Luther King Jr.",
  "King, Martin Luther Jr.",
  "Shakespeare",
  "von Goethe, Johann Wolfgang",
  "Oscar Wilde",
];

console.log("Name Parsing Test Results");
console.log("═".repeat(70));
console.log("");

testNames.forEach((name) => {
  const { firstName, lastName } = parseAuthorName(name);
  console.log(`Input:     "${name}"`);
  console.log(`First:     "${firstName}"`);
  console.log(`Last:      "${lastName}"`);
  console.log("─".repeat(70));
});

console.log("");
console.log("Note: If any names are parsed incorrectly, you can manually");
console.log("update them in the database after running the migration.");
