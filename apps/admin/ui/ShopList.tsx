import { useState, useEffect } from "react";
import type { Locale } from "./i18n";
import { t } from "./i18n";

type ShopRow = { id: string; name_lo: string; name_en: string; updated_at: number };

export function ShopList({
  locale,
  onNew,
  onEdit,
}: {
  locale: Locale;
  onNew: () => void;
  onEdit: (id: string) => void;
}) {
  const [shops, setShops] = useState<ShopRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/shops", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        setShops(data.shops ?? []);
      })
      .catch(() => setError(t(locale, "error.load")))
      .finally(() => setLoading(false));
  }, [locale]);

  if (loading) return <p className="text-gray-500">Loading shops…</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">{t(locale, "shops.list")}</h2>
        <button
          type="button"
          onClick={onNew}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {t(locale, "shops.create")}
        </button>
      </div>
      <ul className="divide-y">
        {shops.length === 0 && <li className="py-4 text-gray-500">No shops yet.</li>}
        {shops.map((s) => (
          <li key={s.id} className="py-3 flex justify-between items-center">
            <span>{locale === "lo" ? s.name_lo : s.name_en}</span>
            <div className="flex items-center gap-2">
              <code className="text-xs bg-gray-100 px-2 py-1 rounded">{s.id}</code>
              <button
                type="button"
                onClick={() => onEdit(s.id)}
                className="text-blue-600 hover:underline text-sm"
              >
                {t(locale, "shops.edit")}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
