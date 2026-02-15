export type Locale = "lo" | "en";

export const dict: Record<Locale, Record<string, string>> = {
  en: {
    "lang.lo": "ລາວ",
    "lang.en": "English",
    "contact": "Contact via WhatsApp",
  },
  lo: {
    "lang.lo": "ລາວ",
    "lang.en": "English",
    "contact": "ຕິດຕໍ່ຜ່ານ WhatsApp",
  },
};

export function t(locale: Locale, key: string): string {
  return dict[locale][key] ?? dict.en[key] ?? key;
}
