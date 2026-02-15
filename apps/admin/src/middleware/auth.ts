import type { Context, Next } from "hono";
import { verifyJwt, getCookieToken } from "../lib/auth.js";

export async function requireAuth(c: Context<{ Bindings: Env }>, next: Next) {
  const token = getCookieToken(c);
  const secret = c.env.JWT_SECRET;
  if (!secret) {
    return c.json({ error: "Server misconfiguration" }, 500);
  }
  if (!token) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const payload = await verifyJwt(token, secret);
  if (!payload) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  c.set("userId", payload.sub);
  c.set("userEmail", payload.email);
  await next();
}
