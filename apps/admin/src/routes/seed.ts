/**
 * One-time seed: create first admin user and first shop.
 * No local Node required — call from browser or any HTTP client after deploy.
 * Set SEED_SECRET in Cloudflare (secret) and call once; then remove or leave.
 */
import { Hono } from "hono";
import { validateEmail, validatePassword } from "@myshop/shared";
import { hashPasswordForStorage } from "../lib/auth.js";

const app = new Hono<{ Bindings: Env }>();

app.post("/api/seed", async (c) => {
  const secret = c.env.SEED_SECRET;
  if (!secret) {
    return c.json({ error: "Seed not configured (SEED_SECRET missing)." }, 501);
  }

  let body: { secret?: string; email?: string; password?: string };
  try {
    body = (await c.req.json()) as { secret?: string; email?: string; password?: string };
  } catch {
    return c.json({ error: "Request body must be JSON: { secret, email, password }." }, 400);
  }

  if (typeof body.secret !== "string" || body.secret.trim() === "") {
    return c.json({ error: "secret is required." }, 400);
  }
  if (body.secret !== secret) {
    return c.json({ error: "Invalid secret." }, 403);
  }

  let email: string;
  let password: string;
  try {
    email = validateEmail(body.email);
    password = validatePassword(body.password);
  } catch (e) {
    return c.json({ error: (e as Error).message }, 400);
  }

  const existing = await c.env.DB.prepare("SELECT 1 FROM users LIMIT 1").first();
  if (existing) {
    return c.json({ error: "Already seeded. Use admin login." }, 409);
  }

  const { hash, salt } = await hashPasswordForStorage(password);
  const userId = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  const shopId = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
  const now = Math.floor(Date.now() / 1000);

  await c.env.DB.prepare(
    "INSERT INTO users (id, email, password_hash, password_salt, created_at) VALUES (?, ?, ?, ?, ?)"
  )
    .bind(userId, email, hash, salt, now)
    .run();

  await c.env.DB.prepare(
    `INSERT INTO shops (id, name_lo, name_en, bio_lo, bio_en, whatsapp_phone, whatsapp_message_lo, whatsapp_message_en, social_json, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, '{}', ?, ?)`
  )
    .bind(
      shopId,
      "ຮ້ານຕົວຢ່າງ",
      "Sample Shop",
      "ຄຳອະທິບາຍ",
      "Short bio",
      "8562012345678",
      "ສະບາຍດີ",
      "Hello",
      now,
      now
    )
    .run();

  return c.json({
    ok: true,
    email,
    shopId,
    message: "First admin user and shop created. Use PUBLIC_SHOP_ID in Landing env.",
  });
});

export default app;
