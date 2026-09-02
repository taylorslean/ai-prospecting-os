import { execSync } from "node:child_process";

// This script is run with: node --env-file=.env scripts/db-migrate.mjs
// It ensures DATABASE_URL is available and runs prisma migrate deploy
if (!process.env.DATABASE_URL) {
  console.error("✖ DATABASE_URL is not set. Check your .env file.");
  process.exit(1);
}

console.log("Running Prisma migrate deploy...");
execSync("pnpm --filter @prospecting/db migrate", { stdio: "inherit", env: process.env });
