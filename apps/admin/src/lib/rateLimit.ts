/**
 * Simple IP-based login rate limit using KV.
 * Key: rate:login:<ip>, Value: attempt count, TTL: 15 minutes.
 * Max 5 attempts per 15 min per IP.
 */

const PREFIX = "rate:login:";
const WINDOW_SEC = 15 * 60;
const MAX_ATTEMPTS = 5;

export async function checkLoginRateLimit(kv: KVNamespace | undefined, ip: string): Promise<{ allowed: boolean }> {
  if (!kv) return { allowed: true };
  const key = PREFIX + ip;
  const raw = await kv.get(key);
  const count = raw ? parseInt(raw, 10) : 0;
  if (count >= MAX_ATTEMPTS) {
    return { allowed: false };
  }
  return { allowed: true };
}

export async function recordLoginAttempt(kv: KVNamespace | undefined, ip: string): Promise<void> {
  if (!kv) return;
  const key = PREFIX + ip;
  const raw = await kv.get(key);
  const count = raw ? parseInt(raw, 10) + 1 : 1;
  await kv.put(key, String(count), { expirationTtl: WINDOW_SEC });
}
