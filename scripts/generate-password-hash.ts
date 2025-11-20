#!/usr/bin/env node

/**
 * Generate bcrypt password hash for admin user
 *
 * Usage: npx tsx scripts/generate-password-hash.ts <password>
 * Example: npx tsx scripts/generate-password-hash.ts mySecurePassword123
 */

import bcrypt from "bcrypt";

async function main() {
  const password = process.argv[2];

  if (!password) {
    console.error("Error: Password is required");
    console.log(
      "\nUsage: npx tsx scripts/generate-password-hash.ts <password>"
    );
    console.log(
      "Example: npx tsx scripts/generate-password-hash.ts mySecurePassword123"
    );
    process.exit(1);
  }

  if (password.length < 8) {
    console.error("Error: Password should be at least 8 characters long");
    process.exit(1);
  }

  try {
    console.log("Generating password hash...\n");

    const saltRounds = 10;
    const hash = await bcrypt.hash(password, saltRounds);

    console.log("✓ Password hash generated successfully!\n");
    console.log("Add these to your .env file:\n");
    console.log("ADMIN_USERNAME=admin");
    console.log(`ADMIN_PASSWORD_HASH=${hash}`);
    console.log("\nYou can change ADMIN_USERNAME to whatever you prefer.");
  } catch (error) {
    console.error("Error generating hash:", error);
    process.exit(1);
  }
}

main();
