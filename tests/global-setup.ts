import { execSync } from "node:child_process";

const TEST_DATABASE_URL = "file:./test.db";

// Syncs the schema into prisma/test.db (created on first run). The tests clear
// every row before each case, so dropping columns from this disposable file is
// safe. The child process gets only TEST_DATABASE_URL, never the dev database.
export default function setup() {
  if (!TEST_DATABASE_URL.endsWith("/test.db")) {
    throw new Error("Refusing to sync schema outside prisma/test.db.");
  }
  execSync("npx prisma db push --skip-generate --accept-data-loss", {
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
    stdio: "pipe",
  });
}
