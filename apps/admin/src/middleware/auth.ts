import type { Context, Next } from "hono";
import { verifyJwt, getCookieToken } from "../lib/auth.js";

export async function requireAuth(c: Context<{ Bindings: Env }>, next: Next) {
  const secret = typeof c.env.JWT_SECRET === "string" ? c.env.JWT_SECRET : "";
  if (!secret || secret.trim() === "") {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const token = getCookieToken(c);
  if (!token) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  try {
    const payload = await verifyJwt(token, secret);
    if (!payload) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    c.set("userId", payload.sub);
    c.set("userEmail", payload.email);
    await next();
  } catch {
    return c.json({ error: "Unauthorized" }, 401);
  }
}
