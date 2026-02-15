import { Hono } from "hono";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import authRoutes from "./routes/auth.js";
import shopRoutes from "./routes/shops.js";
import seedRoutes from "./routes/seed.js";

const app = new Hono<{ Bindings: Env }>();

// CORS: allow configured origins and credentials
app.use("*", async (c, next) => {
  const origin = c.req.header("Origin");
  const allowed = (c.env.ALLOWED_ORIGINS || "").split(",").map((o) => o.trim()).filter(Boolean);
  const originToUse = origin && allowed.includes(origin) ? origin : (allowed[0] ?? "*");
  return cors({
    origin: originToUse,
    credentials: true,
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    maxAge: 86400,
  })(c, next);
});

app.use("*", secureHeaders());

// API and public routes
app.route("/", authRoutes);
app.route("/", shopRoutes);
app.route("/", seedRoutes);

// Serve Admin UI static assets (SPA). Run worker first for /api and /public.
app.get("*", async (c) => {
  const url = new URL(c.req.url);
  const path = url.pathname;
  if (path.startsWith("/api") || path.startsWith("/public")) {
    return c.text("Not Found", 404);
  }
  const assets = (c.env as { ASSETS?: Fetcher }).ASSETS;
  if (!assets) {
    return c.text("Admin UI not configured", 404);
  }
  let assetReq = c.req.raw;
  // SPA fallback: serve index.html for paths under / that don't match a file
  const res = await assets.fetch(assetReq);
  if (res.status === 404 && !path.includes(".")) {
    const indexUrl = new URL("/index.html", url.origin);
    return assets.fetch(new Request(indexUrl, { headers: c.req.raw.headers }));
  }
  return res;
});

export default app;
