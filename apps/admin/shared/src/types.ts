export interface User {
  id: string;
  email: string;
  password_hash: string;
  password_salt: string;
  created_at: number;
}

export interface Shop {
  id: string;
  name_lo: string;
  name_en: string;
  bio_lo: string;
  bio_en: string;
  whatsapp_phone: string;
  whatsapp_message_lo: string;
  whatsapp_message_en: string;
  profile_image_id: string | null;
  cover_image_id: string | null;
  social_json: string;
  created_at: number;
  updated_at: number;
}

export interface SocialLinks {
  facebook?: string;
  tiktok?: string;
  instagram?: string;
}

export interface PublicShop {
  id: string;
  name_lo: string;
  name_en: string;
  bio_lo: string;
  bio_en: string;
  whatsapp_phone: string;
  whatsapp_message_lo: string;
  whatsapp_message_en: string;
  profile_image_url: string | null;
  cover_image_url: string | null;
  social: SocialLinks;
}

export type Locale = "lo" | "en";
