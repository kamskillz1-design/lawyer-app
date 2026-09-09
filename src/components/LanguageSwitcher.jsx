import React, { useState, useRef, useEffect } from "react";
import { Globe, ChevronDown, Search, Check, Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { LANGUAGES, getLanguage } from "@/lib/languages";
import { cn } from "@/lib/utils";

export default function LanguageSwitcher() {
  const { lang, setLang, t, translating } = useI18n();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("touchstart", onClick);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("touchstart", onClick);
    };
  }, []);

  const results = LANGUAGES.filter((l) =>
    l.native.toLowerCase().includes(q.toLowerCase()) || l.code.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg border bg-card text-sm hover:bg-secondary transition-colors">
        {translating ? <Loader2 className="w-4 h-4 text-primary animate-spin" /> : <Globe className="w-4 h-4 text-primary" />}
        <span className="max-w-[120px] truncate">{getLanguage(lang).native}</span>
        <ChevronDown className="w-3 h-3 text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute end-0 mt-2 w-72 max-w-[calc(100vw-1.5rem)] card-soft bg-card z-50 p-2">
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-secondary mb-1">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} autoFocus
              placeholder="Search /Buscar" className="bg-transparent outline-none text-sm w-full" />
          </div>
          <div className="max-h-72 overflow-y-auto">
            {results.map((l) => (
              <button key={l.code}
                onClick={() => { setLang(l.code); setOpen(false); setQ(""); }}
                className={cn("w-full flex items-center justify-between px-3 py-2 rounded-md text-sm hover:bg-secondary text-start",
                  l.code === lang && "bg-secondary font-medium")}>
                <span>{l.native} <span className="text-xs text-muted-foreground">{l.code}</span></span>
                {l.code === lang && <Check className="w-4 h-4 text-primary" />}
              </button>
            ))}
          </div>
          <p className="px-3 pt-2 pb-1 text-[10px] text-muted-foreground">
            {translating ? t("translating_ui") : t("ui_all_languages")}
          </p>
        </div>
      )}
    </div>
  );
}