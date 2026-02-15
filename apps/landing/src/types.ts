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
  social: {
    facebook?: string;
    tiktok?: string;
    instagram?: string;
  };
}
