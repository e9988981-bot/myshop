import { useState, useEffect } from "react";
import type { Locale } from "./i18n";
import { t } from "./i18n";

type Shop = {
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
};

type SocialLinks = { facebook?: string; tiktok?: string; instagram?: string };

const emptyShop: Shop = {
  id: "",
  name_lo: "",
  name_en: "",
  bio_lo: "",
  bio_en: "",
  whatsapp_phone: "",
  whatsapp_message_lo: "",
  whatsapp_message_en: "",
  profile_image_id: null,
  cover_image_id: null,
  social_json: "{}",
};

export function ShopEdit({
  locale,
  shopId,
  onSaved,
  onBack,
}: {
  locale: Locale;
  shopId: string | null;
  onSaved: (id: string) => void;
  onBack: () => void;
}) {
  const [shop, setShop] = useState<Shop>(emptyShop);
  const [social, setSocial] = useState<SocialLinks>({});
  const [loading, setLoading] = useState(!!shopId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!shopId) {
      setShop(emptyShop);
      setSocial({});
      setLoading(false);
      return;
    }
    fetch(`/api/shops/${shopId}`, { credentials: "include" })
      .then((r) => {
        if (!r.ok) throw new Error("Load failed");
        return r.json();
      })
      .then((data: Shop) => {
        setShop(data);
        try {
          setSocial((JSON.parse(data.social_json || "{}") || {}) as SocialLinks);
        } catch {
          setSocial({});
        }
      })
      .catch(() => setError(t(locale, "error.load")))
      .finally(() => setLoading(false));
  }, [shopId, locale]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const payload = {
      name_lo: shop.name_lo,
      name_en: shop.name_en,
      bio_lo: shop.bio_lo,
      bio_en: shop.bio_en,
      whatsapp_phone: shop.whatsapp_phone.replace(/\D/g, ""),
      whatsapp_message_lo: shop.whatsapp_message_lo,
      whatsapp_message_en: shop.whatsapp_message_en,
      social_json: social,
    };
    try {
      if (shopId) {
        const res = await fetch(`/api/shops/${shopId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error(d.error || "Save failed");
        }
        onSaved(shopId);
      } else {
        const res = await fetch("/api/shops", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Create failed");
        onSaved(data.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  async function uploadImage(type: "profile" | "cover", file: File) {
    const id = shop.id || (shopId ?? "");
    if (!id) return;
    const getUrlRes = await fetch(`/api/shops/${id}/images/${type}`, {
      method: "POST",
      credentials: "include",
    });
    if (!getUrlRes.ok) throw new Error("Failed to get upload URL");
    const { uploadURL, imageId } = await getUrlRes.json();
    const form = new FormData();
    form.append("file", file);
    const uploadRes = await fetch(uploadURL, {
      method: "POST",
      body: form,
    });
    if (!uploadRes.ok) throw new Error("Upload failed");
    const setRes = await fetch(`/api/shops/${id}/images/${type}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ imageId }),
    });
    if (!setRes.ok) throw new Error("Failed to set image");
    const updated = await fetch(`/api/shops/${id}`, { credentials: "include" }).then((r) => r.json());
    setShop(updated);
  }

  if (loading) return <p className="text-gray-500">Loading…</p>;

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-4">
        <button type="button" onClick={onBack} className="text-blue-600 hover:underline">
          ← {t(locale, "shops.back")}
        </button>
        <h2 className="text-lg font-semibold">{shopId ? t(locale, "shops.edit") : t(locale, "shops.create")}</h2>
      </div>

      {shop.id && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded">
          <span className="text-sm font-medium text-amber-800">{t(locale, "shops.shop_id")}: </span>
          <code className="text-sm font-mono bg-white px-2 py-1 rounded border">{shop.id}</code>
        </div>
      )}

      {error && <p className="text-red-600 text-sm mb-2">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">{t(locale, "shops.name_lo")}</label>
            <input
              value={shop.name_lo}
              onChange={(e) => setShop((s) => ({ ...s, name_lo: e.target.value }))}
              required
              maxLength={120}
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">{t(locale, "shops.name_en")}</label>
            <input
              value={shop.name_en}
              onChange={(e) => setShop((s) => ({ ...s, name_en: e.target.value }))}
              required
              maxLength={120}
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">{t(locale, "shops.bio_lo")}</label>
            <textarea
              value={shop.bio_lo}
              onChange={(e) => setShop((s) => ({ ...s, bio_lo: e.target.value }))}
              required
              maxLength={500}
              rows={3}
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">{t(locale, "shops.bio_en")}</label>
            <textarea
              value={shop.bio_en}
              onChange={(e) => setShop((s) => ({ ...s, bio_en: e.target.value }))}
              required
              maxLength={500}
              rows={3}
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">{t(locale, "shops.whatsapp_phone")}</label>
          <input
            value={shop.whatsapp_phone}
            onChange={(e) => setShop((s) => ({ ...s, whatsapp_phone: e.target.value.replace(/\D/g, "") }))}
            required
            placeholder="8562012345678"
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">{t(locale, "shops.whatsapp_message_lo")}</label>
            <textarea
              value={shop.whatsapp_message_lo}
              onChange={(e) => setShop((s) => ({ ...s, whatsapp_message_lo: e.target.value }))}
              required
              maxLength={500}
              rows={2}
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">{t(locale, "shops.whatsapp_message_en")}</label>
            <textarea
              value={shop.whatsapp_message_en}
              onChange={(e) => setShop((s) => ({ ...s, whatsapp_message_en: e.target.value }))}
              required
              maxLength={500}
              rows={2}
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
        </div>
        <div>
          <span className="block text-sm text-gray-600 mb-1">{t(locale, "shops.social")}</span>
          <div className="space-y-2">
            <input
              placeholder="Facebook URL"
              value={social.facebook ?? ""}
              onChange={(e) => setSocial((s) => ({ ...s, facebook: e.target.value || undefined }))}
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
            <input
              placeholder="Instagram URL"
              value={social.instagram ?? ""}
              onChange={(e) => setSocial((s) => ({ ...s, instagram: e.target.value || undefined }))}
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
            <input
              placeholder="TikTok URL"
              value={social.tiktok ?? ""}
              onChange={(e) => setSocial((s) => ({ ...s, tiktok: e.target.value || undefined }))}
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
        </div>

        {shopId && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">{t(locale, "shops.profile_image")}</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadImage("profile", f).catch((err) => setError(err.message));
                }}
                className="block w-full text-sm text-gray-500 file:mr-2 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">{t(locale, "shops.cover_image")}</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadImage("cover", f).catch((err) => setError(err.message));
                }}
                className="block w-full text-sm text-gray-500 file:mr-2 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700"
              />
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "…" : t(locale, "shops.save")}
          </button>
          <button type="button" onClick={onBack} className="border border-gray-300 px-4 py-2 rounded hover:bg-gray-50">
            {t(locale, "shops.cancel")}
          </button>
        </div>
      </form>
    </div>
  );
}
