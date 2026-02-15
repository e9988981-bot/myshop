import { Hono } from "hono";
import { validateLogin } from "@myshop/shared";
import {
  hashPasswordForStorage,
  verifyPassword,
  signJwt,
  setAuthCookie,
  clearAuthCookie,
  getCookieToken,
  verifyJwt,
} from "../lib/auth.js";
import { checkLoginRateLimit, recordLoginAttempt } from "../lib/rateLimit.js";

const app = new Hono<{ Bindings: Env }>();

app.post("/api/auth/login", async (c) => {
  if (!c.env.JWT_SECRET || c.env.JWT_SECRET.trim() === "") {
    return c.json({ error: "Server misconfiguration: JWT_SECRET not set. Add it in Worker Settings → Secrets." }, 500);
  }

  const ip = c.req.header("CF-Connecting-IP") ?? c.req.header("X-Forwarded-For") ?? "unknown";
  const { allowed } = await checkLoginRateLimit(c.env.RATE_LIMIT, ip);
  if (!allowed) {
    return c.json({ error: "Too many login attempts. Try again later." }, 429);
  }

  let email: string;
  let password: string;
  try {
    const body = await c.req.json();
    const parsed = validateLogin(body);
    email = parsed.email;
    password = parsed.password;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Invalid request";
    return c.json({ error: msg }, 400);
  }

  try {
    const row = await c.env.DB.prepare(
      "SELECT id, email, password_hash, password_salt FROM users WHERE email = ?"
    )
      .bind(email)
      .first();

    if (!row || typeof row !== "object") {
      await recordLoginAttempt(c.env.RATE_LIMIT, ip);
      return c.json({ error: "Invalid email or password" }, 401);
    }

    const password_hash = (row as Record<string, unknown>).password_hash as string | undefined;
    const password_salt = (row as Record<string, unknown>).password_salt as string | undefined;
    if (!password_hash || !password_salt) {
      await recordLoginAttempt(c.env.RATE_LIMIT, ip);
      return c.json({ error: "Invalid email or password" }, 401);
    }

    const ok = await verifyPassword(password, password_salt, password_hash);
    if (!ok) {
      await recordLoginAttempt(c.env.RATE_LIMIT, ip);
      return c.json({ error: "Invalid email or password" }, 401);
    }

    const userId = (row as Record<string, unknown>).id as string;
    const userEmail = (row as Record<string, unknown>).email as string;
    const token = await signJwt({ sub: userId, email: userEmail }, c.env.JWT_SECRET);
    setAuthCookie(c, token);
    return c.json({ ok: true, user: { id: userId, email: userEmail } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ error: "Login failed.", detail: msg }, 500);
  }
});

app.post("/api/auth/logout", (c) => {
  clearAuthCookie(c);
  return c.json({ ok: true });
});

app.get("/api/me", async (c) => {
  if (!c.env.JWT_SECRET || c.env.JWT_SECRET.trim() === "") {
    return c.json({ error: "Server misconfiguration: JWT_SECRET not set." }, 500);
  }
  const token = getCookieToken(c);
  if (!token) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const payload = await verifyJwt(token, c.env.JWT_SECRET);
  if (!payload) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  return c.json({ id: payload.sub, email: payload.email });
});

export default app;
