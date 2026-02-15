import { describe, it, expect } from "vitest";
import {
  validateEmail,
  validatePassword,
  validateShopId,
  validateWhatsAppPhone,
  validateSocialJson,
  validateShopCreate,
  validateShopUpdate,
  validateLogin,
} from "./validators.js";

describe("validateEmail", () => {
  it("accepts valid email", () => {
    expect(validateEmail("  admin@example.com  ")).toBe("admin@example.com");
  });
  it("rejects empty", () => {
    expect(() => validateEmail("")).toThrow("required");
    expect(() => validateEmail("   ")).toThrow("required");
  });
  it("rejects invalid format", () => {
    expect(() => validateEmail("notanemail")).toThrow("Invalid email");
    expect(() => validateEmail("@nodomain.com")).toThrow("Invalid email");
  });
});

describe("validatePassword", () => {
  it("accepts 8+ chars", () => {
    expect(validatePassword("password")).toBe("password");
    expect(validatePassword("12345678")).toBe("12345678");
  });
  it("rejects short password", () => {
    expect(() => validatePassword("short")).toThrow("at least 8");
  });
  it("rejects non-string", () => {
    expect(() => validatePassword(123 as unknown as string)).toThrow("must be a string");
  });
});

describe("validateShopId", () => {
  it("accepts alphanumeric and - _", () => {
    expect(validateShopId("shop-1")).toBe("shop-1");
    expect(validateShopId("SHOP_abc")).toBe("SHOP_abc");
  });
  it("rejects empty or invalid", () => {
    expect(() => validateShopId("")).toThrow("required");
    expect(() => validateShopId("  ")).toThrow("required");
    expect(() => validateShopId("bad id")).toThrow("Invalid shop ID");
  });
});

describe("validateWhatsAppPhone", () => {
  it("accepts digits only 10-15", () => {
    expect(validateWhatsAppPhone("8562012345678")).toBe("8562012345678");
    expect(validateWhatsAppPhone("+856 20 123 45678")).toBe("8562012345678");
  });
  it("rejects too short", () => {
    expect(() => validateWhatsAppPhone("123")).toThrow("10–15 digits");
  });
});

describe("validateSocialJson", () => {
  it("accepts empty object", () => {
    expect(validateSocialJson("{}")).toBe("{}");
    expect(validateSocialJson({})).toBe("{}");
  });
  it("accepts valid URLs", () => {
    const out = validateSocialJson({ facebook: "https://facebook.com/page", instagram: "https://instagram.com/u" });
    expect(JSON.parse(out).facebook).toBe("https://facebook.com/page");
  });
  it("rejects invalid URL", () => {
    expect(() => validateSocialJson({ facebook: "not-a-url" })).toThrow("valid URL");
  });
});

describe("validateShopCreate", () => {
  const valid = {
    name_lo: "ຮ້ານ",
    name_en: "My Shop",
    bio_lo: "ຄຳອະທິບາຍ",
    bio_en: "Description",
    whatsapp_phone: "8562012345678",
    whatsapp_message_lo: "ສະບາຍດີ",
    whatsapp_message_en: "Hello",
  };

  it("accepts valid body", () => {
    const r = validateShopCreate(valid);
    expect(r.name_lo).toBe("ຮ້ານ");
    expect(r.name_en).toBe("My Shop");
    expect(r.whatsapp_phone).toBe("8562012345678");
  });
  it("rejects missing required", () => {
    expect(() => validateShopCreate({})).toThrow("name_lo");
    expect(() => validateShopCreate({ ...valid, name_en: "" })).toThrow("name_en");
  });
  it("rejects non-object", () => {
    expect(() => validateShopCreate(null)).toThrow("JSON object");
    expect(() => validateShopCreate("string")).toThrow("JSON object");
  });
});

describe("validateShopUpdate", () => {
  it("accepts partial fields", () => {
    const r = validateShopUpdate({ name_en: "New Name" });
    expect(r.name_en).toBe("New Name");
    expect(Object.keys(r)).toHaveLength(1);
  });
  it("rejects invalid field", () => {
    expect(() => validateShopUpdate({ whatsapp_phone: "1" })).toThrow("10–15 digits");
  });
});

describe("validateLogin", () => {
  it("accepts valid login", () => {
    const r = validateLogin({ email: "a@b.co", password: "password1" });
    expect(r.email).toBe("a@b.co");
    expect(r.password).toBe("password1");
  });
  it("rejects short password", () => {
    expect(() => validateLogin({ email: "a@b.co", password: "short" })).toThrow("at least 8");
  });
});
