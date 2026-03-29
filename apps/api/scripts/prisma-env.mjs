/**
 * Loads apps/api/.env, then apps/api/.env.example if DATABASE_URL is still unset
 * (matches server.ts / seed.ts). Then runs: prisma <...args>
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const apiRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const envFile = join(apiRoot, ".env");
const exampleFile = join(apiRoot, ".env.example");

dotenv.config({ path: envFile });
if (!process.env.DATABASE_URL?.trim()) {
  dotenv.config({ path: exampleFile });
}

const prismaArgs = process.argv.slice(2);
if (!prismaArgs.length) {
  console.error("Usage: node scripts/prisma-env.mjs <prisma subcommand> [...]");
  process.exit(1);
}

const r = spawnSync("pnpm", ["exec", "prisma", ...prismaArgs], {
  cwd: apiRoot,
  stdio: "inherit",
  shell: true,
  env: process.env,
});

process.exit(r.status ?? 1);
