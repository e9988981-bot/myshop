import * as jose from "jose";
import type { Context } from "hono";

export async function hashPassword(password: string, salt: Uint8Array): Promise<ArrayBuffer> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  return crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    key,
    256
  );
}

export function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(16));
}

export function saltToHex(salt: Uint8Array): string {
  return Array.from(salt)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function hexToSalt(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

export async function verifyPassword(
  password: string,
  saltHex: string,
  hashHex: string
): Promise<boolean> {
  const salt = hexToSalt(saltHex);
  const derived = await hashPassword(password, salt);
  const derivedHex = Array.from(new Uint8Array(derived))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return derivedHex === hashHex;
}

export async function hashPasswordForStorage(password: string): Promise<{ hash: string; salt: string }> {
  const salt = generateSalt();
  const derived = await hashPassword(password, salt);
  return {
    salt: saltToHex(salt),
    hash: Array.from(new Uint8Array(derived))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join(""),
  };
}

export async function signJwt(
  payload: { sub: string; email: string },
  secret: string
): Promise<string> {
  const key = new TextEncoder().encode(secret);
  return new jose.SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(key);
}

export async function verifyJwt(token: string, secret: string): Promise<{ sub: string; email: string } | null> {
  try {
    const key = new TextEncoder().encode(secret);
    const { payload } = await jose.jwtVerify(token, key);
    const sub = payload.sub as string;
    const email = payload.email as string;
    if (!sub || !email) return null;
    return { sub, email };
  } catch {
    return null;
  }
}

const COOKIE_NAME = "myshop_admin_session";

export function getCookieToken(c: Context): string | undefined {
  return c.req.cookie(COOKIE_NAME);
}

export function setAuthCookie(c: Context, token: string) {
  c.header(
    "Set-Cookie",
    `${COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=604800`
  );
}

export function clearAuthCookie(c: Context) {
  c.header(
    "Set-Cookie",
    `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`
  );
}
