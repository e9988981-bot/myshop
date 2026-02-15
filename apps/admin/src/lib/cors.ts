function parseAllowedOrigins(origins: string): string[] {
  return origins
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
}

export function getAllowedOrigins(env: Env): string[] {
  return parseAllowedOrigins(env.ALLOWED_ORIGINS || "");
}

export function isOriginAllowed(env: Env, origin: string | null): boolean {
  if (!origin) return false;
  const allowed = getAllowedOrigins(env);
  if (allowed.length === 0) return false;
  return allowed.includes(origin);
}

export function corsHeaders(env: Env, req: Request): Record<string, string> {
  const origin = req.headers.get("Origin");
  const allowed = getAllowedOrigins(env);
  const allowOrigin = origin && allowed.includes(origin) ? origin : allowed[0] ?? "";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "86400",
  };
}
