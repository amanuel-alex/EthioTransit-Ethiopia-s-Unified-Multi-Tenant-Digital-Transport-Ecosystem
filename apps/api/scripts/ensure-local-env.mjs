/**
 * If apps/api/.env is missing, copy .env.example so Prisma CLI and tools that only read .env work.
 * Edit DATABASE_URL in .env to match your local Postgres.
 */
import { copyFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const apiRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const target = join(apiRoot, ".env");
const source = join(apiRoot, ".env.example");

if (!existsSync(target) && existsSync(source)) {
  copyFileSync(source, target);
  console.log(
    "[@ethiotransit/api] Created apps/api/.env from .env.example — set DATABASE_URL if your Postgres password differs.",
  );
}
