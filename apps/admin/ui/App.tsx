import { useState, useEffect, useCallback } from "react";
import type { Locale } from "./i18n";
import { t } from "./i18n";
import { Login } from "./Login";
import { ShopList } from "./ShopList";
import { ShopEdit } from "./ShopEdit";

export default function App() {
  const [locale, setLocale] = useState<Locale>(() => (localStorage.getItem("locale") as Locale) || "en");
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "edit" | "create">("list");
  const [editId, setEditId] = useState<string | null>(null);

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/me", { credentials: "include" });
      if (res.ok) {
        const u = await res.json();
        setUser(u);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    localStorage.setItem("locale", locale);
  }, [locale]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <span className="text-slate-500">Loading…</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <header className="bg-white border-b border-slate-200 flex justify-between items-center px-6 py-4">
          <h1 className="text-xl font-semibold text-slate-800">{t(locale, "app.title")}</h1>
          <LangToggle locale={locale} setLocale={setLocale} />
        </header>
        <Login
          locale={locale}
          onSuccess={(user) => {
            if (user) setUser(user);
            else checkAuth();
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 flex justify-between items-center px-6 py-4 flex-wrap gap-3">
        <h1 className="text-xl font-semibold text-slate-800">{t(locale, "app.title")}</h1>
        <div className="flex items-center gap-3">
          <LangToggle locale={locale} setLocale={setLocale} />
          <span className="text-sm text-slate-600">{user.email}</span>
          <button
            type="button"
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
              setUser(null);
            }}
            className="text-sm text-red-600 hover:text-red-700 hover:underline"
          >
            {t(locale, "auth.logout")}
          </button>
        </div>
      </header>
      <main className="flex-1 p-6 max-w-4xl mx-auto w-full">
        {view === "list" && (
          <ShopList
            locale={locale}
            onNew={() => setView("create")}
            onEdit={(id) => {
              setEditId(id);
              setView("edit");
            }}
          />
        )}
        {view === "create" && (
          <ShopEdit
            locale={locale}
            shopId={null}
            onSaved={(id) => {
              setEditId(id);
              setView("edit");
            }}
            onBack={() => setView("list")}
          />
        )}
        {view === "edit" && editId && (
          <ShopEdit
            locale={locale}
            shopId={editId}
            onSaved={() => {}}
            onBack={() => {
              setEditId(null);
              setView("list");
            }}
          />
        )}
      </main>
    </div>
  );
}

function LangToggle({
  locale,
  setLocale,
}: {
  locale: Locale;
  setLocale: (l: Locale) => void;
}) {
  return (
    <div className="flex rounded-lg overflow-hidden border border-slate-300 bg-white">
      <button
        type="button"
        onClick={() => setLocale("lo")}
        className={`px-4 py-2 text-sm font-medium transition-colors ${locale === "lo" ? "bg-blue-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}
      >
        ລາວ
      </button>
      <button
        type="button"
        onClick={() => setLocale("en")}
        className={`px-4 py-2 text-sm font-medium transition-colors ${locale === "en" ? "bg-blue-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}
      >
        EN
      </button>
    </div>
  );
}
