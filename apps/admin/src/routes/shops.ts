import { Hono } from "hono";
import {
  validateShopCreate,
  validateShopUpdate,
  validateShopId,
  type Shop,
  type PublicShop,
  type SocialLinks,
} from "@myshop/shared";
import { requireAuth } from "../middleware/auth.js";
import { deliveryUrl } from "../lib/images.js";

const app = new Hono<{ Bindings: Env; Variables: { userId: string; userEmail: string } }>();

function rowToShop(row: Record<string, unknown>): Shop {
  return {
    id: row.id as string,
    name_lo: row.name_lo as string,
    name_en: row.name_en as string,
    bio_lo: row.bio_lo as string,
    bio_en: row.bio_en as string,
    whatsapp_phone: row.whatsapp_phone as string,
    whatsapp_message_lo: row.whatsapp_message_lo as string,
    whatsapp_message_en: row.whatsapp_message_en as string,
    profile_image_id: (row.profile_image_id as string) ?? null,
    cover_image_id: (row.cover_image_id as string) ?? null,
    social_json: (row.social_json as string) ?? "{}",
    created_at: row.created_at as number,
    updated_at: row.updated_at as number,
  };
}

function toPublicShop(shop: Shop, env: Env): PublicShop {
  const social = (JSON.parse(shop.social_json || "{}") || {}) as SocialLinks;
  const accountHash = env.IMAGES_ACCOUNT_HASH || "";
  const avatarV = env.IMAGES_VARIANT_AVATAR || "avatar";
  const coverV = env.IMAGES_VARIANT_COVER || "cover";
  return {
    id: shop.id,
    name_lo: shop.name_lo,
    name_en: shop.name_en,
    bio_lo: shop.bio_lo,
    bio_en: shop.bio_en,
    whatsapp_phone: shop.whatsapp_phone,
    whatsapp_message_lo: shop.whatsapp_message_lo,
    whatsapp_message_en: shop.whatsapp_message_en,
    profile_image_url: shop.profile_image_id && accountHash
      ? deliveryUrl(accountHash, shop.profile_image_id, avatarV)
      : null,
    cover_image_url: shop.cover_image_id && accountHash
      ? deliveryUrl(accountHash, shop.cover_image_id, coverV)
      : null,
    social,
  };
}

// Public: no auth
app.get("/public/shops/:id", async (c) => {
  let id: string;
  try {
    id = validateShopId(c.req.param("id"));
  } catch (e) {
    return c.json({ error: (e as Error).message }, 400);
  }
  const row = await c.env.DB.prepare(
    "SELECT * FROM shops WHERE id = ?"
  )
    .bind(id)
    .first();
  if (!row) {
    return c.json({ error: "Shop not found" }, 404);
  }
  const shop = rowToShop(row as Record<string, unknown>);
  return c.json(toPublicShop(shop, c.env));
});

// Admin: create shop
app.post("/api/shops", requireAuth, async (c) => {
  let body: ReturnType<typeof validateShopCreate>;
  try {
    body = validateShopCreate(await c.req.json());
  } catch (e) {
    return c.json({ error: (e as Error).message }, 400);
  }
  const id = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
  const now = Math.floor(Date.now() / 1000);
  const social = typeof body.social_json === "string" ? body.social_json : JSON.stringify(body.social_json ?? {});
  await c.env.DB.prepare(
    `INSERT INTO shops (id, name_lo, name_en, bio_lo, bio_en, whatsapp_phone, whatsapp_message_lo, whatsapp_message_en, profile_image_id, cover_image_id, social_json, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?, ?, ?)`
  )
    .bind(
      id,
      body.name_lo,
      body.name_en,
      body.bio_lo,
      body.bio_en,
      body.whatsapp_phone,
      body.whatsapp_message_lo,
      body.whatsapp_message_en,
      social,
      now,
      now
    )
    .run();
  const row = await c.env.DB.prepare("SELECT * FROM shops WHERE id = ?").bind(id).first();
  const shop = rowToShop(row as Record<string, unknown>);
  return c.json({ id: shop.id, shop: toPublicShop(shop, c.env) }, 201);
});

// Admin: get shop
app.get("/api/shops/:id", requireAuth, async (c) => {
  let id: string;
  try {
    id = validateShopId(c.req.param("id"));
  } catch (e) {
    return c.json({ error: (e as Error).message }, 400);
  }
  const row = await c.env.DB.prepare("SELECT * FROM shops WHERE id = ?").bind(id).first();
  if (!row) return c.json({ error: "Shop not found" }, 404);
  const shop = rowToShop(row as Record<string, unknown>);
  return c.json(shop);
});

// Admin: update shop
app.put("/api/shops/:id", requireAuth, async (c) => {
  let id: string;
  try {
    id = validateShopId(c.req.param("id"));
  } catch (e) {
    return c.json({ error: (e as Error).message }, 400);
  }
  let updates: ReturnType<typeof validateShopUpdate>;
  try {
    updates = validateShopUpdate(await c.req.json());
  } catch (e) {
    return c.json({ error: (e as Error).message }, 400);
  }
  const row = await c.env.DB.prepare("SELECT * FROM shops WHERE id = ?").bind(id).first();
  if (!row) return c.json({ error: "Shop not found" }, 404);

  const shop = row as Record<string, unknown>;
  const now = Math.floor(Date.now() / 1000);
  const name_lo = updates.name_lo ?? (shop.name_lo as string);
  const name_en = updates.name_en ?? (shop.name_en as string);
  const bio_lo = updates.bio_lo ?? (shop.bio_lo as string);
  const bio_en = updates.bio_en ?? (shop.bio_en as string);
  const whatsapp_phone = updates.whatsapp_phone ?? (shop.whatsapp_phone as string);
  const whatsapp_message_lo = updates.whatsapp_message_lo ?? (shop.whatsapp_message_lo as string);
  const whatsapp_message_en = updates.whatsapp_message_en ?? (shop.whatsapp_message_en as string);
  const social_json = updates.social_json !== undefined
    ? (typeof updates.social_json === "string" ? updates.social_json : JSON.stringify(updates.social_json))
    : (shop.social_json as string);

  await c.env.DB.prepare(
    `UPDATE shops SET name_lo=?, name_en=?, bio_lo=?, bio_en=?, whatsapp_phone=?, whatsapp_message_lo=?, whatsapp_message_en=?, social_json=?, updated_at=? WHERE id=?`
  )
    .bind(name_lo, name_en, bio_lo, bio_en, whatsapp_phone, whatsapp_message_lo, whatsapp_message_en, social_json, now, id)
    .run();

  const updated = await c.env.DB.prepare("SELECT * FROM shops WHERE id = ?").bind(id).first();
  return c.json(rowToShop(updated as Record<string, unknown>));
});

// Admin: list shops (basic)
app.get("/api/shops", requireAuth, async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT id, name_lo, name_en, updated_at FROM shops ORDER BY updated_at DESC"
  ).all();
  return c.json({ shops: results ?? [] });
});

// Admin: get direct upload URL for profile image
app.post("/api/shops/:id/images/profile", requireAuth, async (c) => {
  let id: string;
  try {
    id = validateShopId(c.req.param("id"));
  } catch (e) {
    return c.json({ error: (e as Error).message }, 400);
  }
  const row = await c.env.DB.prepare("SELECT id FROM shops WHERE id = ?").bind(id).first();
  if (!row) return c.json({ error: "Shop not found" }, 404);

  const { createDirectUploadUrl } = await import("../lib/images.js");
  const { id: imageId, uploadURL } = await createDirectUploadUrl(
    c.env.IMAGES_ACCOUNT_ID,
    c.env.IMAGES_API_TOKEN,
    { shopId: id, type: "profile" }
  );

  return c.json({ imageId, uploadURL });
});

// Admin: get direct upload URL for cover image
app.post("/api/shops/:id/images/cover", requireAuth, async (c) => {
  let id: string;
  try {
    id = validateShopId(c.req.param("id"));
  } catch (e) {
    return c.json({ error: (e as Error).message }, 400);
  }
  const row = await c.env.DB.prepare("SELECT id FROM shops WHERE id = ?").bind(id).first();
  if (!row) return c.json({ error: "Shop not found" }, 404);

  const { createDirectUploadUrl } = await import("../lib/images.js");
  const { id: imageId, uploadURL } = await createDirectUploadUrl(
    c.env.IMAGES_ACCOUNT_ID,
    c.env.IMAGES_API_TOKEN,
    { shopId: id, type: "cover" }
  );

  return c.json({ imageId, uploadURL });
});

// Admin: set profile image_id after client uploads
app.put("/api/shops/:id/images/profile", requireAuth, async (c) => {
  let id: string;
  try {
    id = validateShopId(c.req.param("id"));
  } catch (e) {
    return c.json({ error: (e as Error).message }, 400);
  }
  const body = (await c.req.json()) as { imageId?: string };
  if (typeof body.imageId !== "string" || !body.imageId.trim()) {
    return c.json({ error: "imageId is required" }, 400);
  }
  const now = Math.floor(Date.now() / 1000);
  await c.env.DB.prepare(
    "UPDATE shops SET profile_image_id = ?, updated_at = ? WHERE id = ?"
  )
    .bind(body.imageId.trim(), now, id)
    .run();
  const row = await c.env.DB.prepare("SELECT * FROM shops WHERE id = ?").bind(id).first();
  return c.json(rowToShop(row as Record<string, unknown>));
});

// Admin: set cover image_id after client uploads
app.put("/api/shops/:id/images/cover", requireAuth, async (c) => {
  let id: string;
  try {
    id = validateShopId(c.req.param("id"));
  } catch (e) {
    return c.json({ error: (e as Error).message }, 400);
  }
  const body = (await c.req.json()) as { imageId?: string };
  if (typeof body.imageId !== "string" || !body.imageId.trim()) {
    return c.json({ error: "imageId is required" }, 400);
  }
  const now = Math.floor(Date.now() / 1000);
  await c.env.DB.prepare(
    "UPDATE shops SET cover_image_id = ?, updated_at = ? WHERE id = ?"
  )
    .bind(body.imageId.trim(), now, id)
    .run();
  const row = await c.env.DB.prepare("SELECT * FROM shops WHERE id = ?").bind(id).first();
  return c.json(rowToShop(row as Record<string, unknown>));
});

export default app;
