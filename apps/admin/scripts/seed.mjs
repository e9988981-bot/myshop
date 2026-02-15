#!/usr/bin/env node
/**
 * Seed script: creates first admin user and optionally first shop.
 * Usage: node scripts/seed.mjs [email] [password]
 * Or set ADMIN_EMAIL and ADMIN_PASSWORD env vars.
 * Requires: pnpm exec wrangler d1 execute (run from apps/admin with wrangler configured).
 */

import { randomBytes, pbkdf2Sync } from "node:crypto";
import { execSync } from "node:child_process";
import { writeFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const email = process.env.ADMIN_EMAIL || process.argv[2];
const password = process.env.ADMIN_PASSWORD || process.argv[3];

if (!email || !password) {
  console.error("Usage: node scripts/seed.mjs <email> <password>");
  console.error("Or set ADMIN_EMAIL and ADMIN_PASSWORD.");
  process.exit(1);
}

if (password.length < 8) {
  console.error("Password must be at least 8 characters.");
  process.exit(1);
}

const salt = randomBytes(16);
const hash = pbkdf2Sync(password, salt, 100000, 32, "sha256");
const saltHex = salt.toString("hex");
const hashHex = hash.toString("hex");

const userId = randomBytes(8).toString("hex");
const shopId = randomBytes(6).toString("hex");
const now = Math.floor(Date.now() / 1000);

const userSql = `INSERT INTO users (id, email, password_hash, password_salt, created_at) VALUES ('${userId}', '${email.replace(/'/g, "''")}', '${hashHex}', '${saltHex}', ${now});`;

const shopSql = `INSERT INTO shops (id, name_lo, name_en, bio_lo, bio_en, whatsapp_phone, whatsapp_message_lo, whatsapp_message_en, social_json, created_at, updated_at) VALUES ('${shopId}', 'ຮ້ານຕົວຢ່າງ', 'Sample Shop', 'ຄຳອະທິບາຍ', 'Short bio', '8562012345678', 'ສະບາຍດີ', 'Hello', '{}', ${now}, ${now});`;

const fullSql = `-- Seed admin user and first shop\n${userSql}\n${shopSql}`;

const tmpFile = join(tmpdir(), `myshop-seed-${Date.now()}.sql`);
writeFileSync(tmpFile, fullSql, "utf8");

try {
  execSync(`pnpm exec wrangler d1 execute myshop-d1 --remote --file=${tmpFile}`, {
    stdio: "inherit",
    cwd: join(__dirname, ".."),
  });
  console.log("Seed OK.");
  console.log("Admin user:", email);
  console.log("First shop ID (use as PUBLIC_SHOP_ID for Pages):", shopId);
} finally {
  try {
    unlinkSync(tmpFile);
  } catch (_) {}
}
