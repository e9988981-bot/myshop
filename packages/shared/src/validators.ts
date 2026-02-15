/**
 * Shared validation helpers. No heavy libs; strict checks for API inputs.
 */

import type { SocialLinks } from "./types.js";

const MAX_NAME = 120;
const MAX_BIO = 500;
const MAX_WHATSAPP_MSG = 500;
const MAX_SOCIAL_URL = 500;

export function validateEmail(email: unknown): string {
  if (typeof email !== "string" || !email.trim()) {
    throw new Error("Email is required and must be a non-empty string.");
  }
  const trimmed = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    throw new Error("Invalid email format.");
  }
  if (trimmed.length > 254) throw new Error("Email too long.");
  return trimmed;
}

export function validatePassword(password: unknown): string {
  if (typeof password !== "string") {
    throw new Error("Password must be a string.");
  }
  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }
  if (password.length > 256) {
    throw new Error("Password too long.");
  }
  return password;
}

export function validateShopId(id: unknown): string {
  if (typeof id !== "string" || !id.trim()) {
    throw new Error("Shop ID is required and must be a non-empty string.");
  }
  const trimmed = id.trim();
  if (trimmed.length > 64 || !/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    throw new Error("Invalid shop ID format.");
  }
  return trimmed;
}

export function validateRequiredString(
  value: unknown,
  field: string,
  maxLen: number
): string {
  if (value === undefined || value === null) {
    throw new Error(`${field} is required.`);
  }
  if (typeof value !== "string") {
    throw new Error(`${field} must be a string.`);
  }
  const trimmed = value.trim();
  if (!trimmed) throw new Error(`${field} cannot be empty.`);
  if (trimmed.length > maxLen) throw new Error(`${field} must be at most ${maxLen} characters.`);
  return trimmed;
}

export function validateOptionalString(
  value: unknown,
  field: string,
  maxLen: number
): string {
  if (value === undefined || value === null || value === "") {
    return "";
  }
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (trimmed.length > maxLen) throw new Error(`${field} must be at most ${maxLen} characters.`);
  return trimmed;
}

export function validateWhatsAppPhone(phone: unknown): string {
  const raw = validateRequiredString(phone, "whatsapp_phone", 20);
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 15) {
    throw new Error("WhatsApp phone must be 10–15 digits (E.164).");
  }
  if (!/^[0-9]+$/.test(digits)) {
    throw new Error("WhatsApp phone must contain only digits (with optional +).");
  }
  return digits;
}

export function validateSocialJson(social: unknown): string {
  if (social === undefined || social === null) return "{}";
  if (typeof social === "string") {
    try {
      const parsed = JSON.parse(social) as Record<string, unknown>;
      return JSON.stringify(validateSocialLinks(parsed));
    } catch {
      throw new Error("social_json must be valid JSON.");
    }
  }
  if (typeof social === "object" && social !== null && !Array.isArray(social)) {
    return JSON.stringify(validateSocialLinks(social as Record<string, unknown>));
  }
  throw new Error("social_json must be an object or JSON string.");
}

function validateSocialLinks(obj: Record<string, unknown>): SocialLinks {
  const out: SocialLinks = {};
  const urlKeys = ["facebook", "tiktok", "instagram"] as const;
  for (const key of urlKeys) {
    const v = obj[key];
    if (v === undefined || v === null) continue;
    if (typeof v !== "string") continue;
    const trimmed = v.trim();
    if (!trimmed) continue;
    if (trimmed.length > MAX_SOCIAL_URL) {
      throw new Error(`Social URL ${key} must be at most ${MAX_SOCIAL_URL} characters.`);
    }
    try {
      new URL(trimmed);
    } catch {
      throw new Error(`Social URL ${key} must be a valid URL.`);
    }
    out[key] = trimmed;
  }
  return out;
}

export interface ShopCreateInput {
  name_lo: string;
  name_en: string;
  bio_lo: string;
  bio_en: string;
  whatsapp_phone: string;
  whatsapp_message_lo: string;
  whatsapp_message_en: string;
  social_json?: string | SocialLinks;
}

export function validateShopCreate(body: unknown): ShopCreateInput {
  if (typeof body !== "object" || body === null) {
    throw new Error("Request body must be a JSON object.");
  }
  const b = body as Record<string, unknown>;
  return {
    name_lo: validateRequiredString(b.name_lo, "name_lo", MAX_NAME),
    name_en: validateRequiredString(b.name_en, "name_en", MAX_NAME),
    bio_lo: validateRequiredString(b.bio_lo, "bio_lo", MAX_BIO),
    bio_en: validateRequiredString(b.bio_en, "bio_en", MAX_BIO),
    whatsapp_phone: validateWhatsAppPhone(b.whatsapp_phone),
    whatsapp_message_lo: validateRequiredString(b.whatsapp_message_lo, "whatsapp_message_lo", MAX_WHATSAPP_MSG),
    whatsapp_message_en: validateRequiredString(b.whatsapp_message_en, "whatsapp_message_en", MAX_WHATSAPP_MSG),
    social_json: validateSocialJson(b.social_json),
  };
}

export interface ShopUpdateInput {
  name_lo?: string;
  name_en?: string;
  bio_lo?: string;
  bio_en?: string;
  whatsapp_phone?: string;
  whatsapp_message_lo?: string;
  whatsapp_message_en?: string;
  social_json?: string | SocialLinks;
}

export function validateShopUpdate(body: unknown): Partial<ShopUpdateInput> {
  if (typeof body !== "object" || body === null) {
    throw new Error("Request body must be a JSON object.");
  }
  const b = body as Record<string, unknown>;
  const out: Partial<ShopUpdateInput> = {};
  if (b.name_lo !== undefined) out.name_lo = validateRequiredString(b.name_lo, "name_lo", MAX_NAME);
  if (b.name_en !== undefined) out.name_en = validateRequiredString(b.name_en, "name_en", MAX_NAME);
  if (b.bio_lo !== undefined) out.bio_lo = validateRequiredString(b.bio_lo, "bio_lo", MAX_BIO);
  if (b.bio_en !== undefined) out.bio_en = validateRequiredString(b.bio_en, "bio_en", MAX_BIO);
  if (b.whatsapp_phone !== undefined) out.whatsapp_phone = validateWhatsAppPhone(b.whatsapp_phone);
  if (b.whatsapp_message_lo !== undefined) out.whatsapp_message_lo = validateRequiredString(b.whatsapp_message_lo, "whatsapp_message_lo", MAX_WHATSAPP_MSG);
  if (b.whatsapp_message_en !== undefined) out.whatsapp_message_en = validateRequiredString(b.whatsapp_message_en, "whatsapp_message_en", MAX_WHATSAPP_MSG);
  if (b.social_json !== undefined) out.social_json = validateSocialJson(b.social_json);
  return out;
}

export interface LoginInput {
  email: string;
  password: string;
}

export function validateLogin(body: unknown): LoginInput {
  if (typeof body !== "object" || body === null) {
    throw new Error("Request body must be a JSON object.");
  }
  const b = body as Record<string, unknown>;
  return {
    email: validateEmail(b.email),
    password: validatePassword(b.password),
  };
}
