import { useEffect, useMemo, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useI18n } from "@/lib/i18n";
import { composeTaskTitle, parseTitleTranslations, taskFragment } from "@/lib/autoTask";

// Resolves the display title of a list of tasks in the interface language.
// - Template-based auto tasks (payload present, no staff-typed fragment) are
//   composed in the dictionary — free, instant.
// - Staff-typed fragments (manual titles, checklist document names, escalated
//   task titles) are machine-translated once per language on first display via
//   the aiTranslate batch mode, cached on the task record (title_translations)
//   and merged into local state. Spanish interface: originals are shown as
//   typed, no LLM calls.
// The in-memory cache is language-scoped: a translation cached for one
// language is never reused or treated as fulfilled for another language.
// Returns { [taskId]: { title, translating } }.
export default function useTaskTitles(tasks) {
  const { lang, t } = useI18n();
  const [local, setLocal] = useState({}); // id -> { [lang]: translated fragment }
  const inflight = useRef(false);
  const isSpanish = !!lang && lang.startsWith("es");
  const list = tasks || [];
  const ids = useMemo(() => list.map((tk) => tk.id).join(","), [tasks]);

  const localFrag = (tk) => (local[tk.id] ? local[tk.id][lang] : null);

  useEffect(() => {
    if (!ids || isSpanish || inflight.current) return;
    const pending = list.filter(
      (tk) => taskFragment(tk) && !parseTitleTranslations(tk)[lang] && !localFrag(tk)
    );
    if (!pending.length) return;
    inflight.current = true;
    const texts = {};
    pending.forEach((tk) => { texts[tk.id] = taskFragment(tk); });
    base44.functions
      .invoke("aiTranslate", { mode: "batch_translate", source_language: "es", target_language: lang, texts })
      .then((res) => {
        const translations = res.data && res.data.translations;
        if (translations && typeof translations === "object") {
          const ok = Object.fromEntries(
            Object.entries(translations).filter(([, v]) => typeof v === "string" && v)
          );
          if (Object.keys(ok).length) {
            setLocal((prev) => {
              const next = { ...prev };
              pending.forEach((tk) => {
                if (ok[tk.id]) next[tk.id] = { ...(prev[tk.id] || {}), [lang]: ok[tk.id] };
              });
              return next;
            });
            const updates = pending
              .filter((tk) => ok[tk.id])
              .map((tk) => ({
                id: tk.id,
                title_translations: JSON.stringify({ ...parseTitleTranslations(tk), [lang]: ok[tk.id] }),
              }));
            // Best-effort cache persist; translation still renders from state.
            base44.entities.Task.bulkUpdate(updates).catch(() => {});
          }
        }
      })
      .catch(() => {})
      .finally(() => { inflight.current = false; });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids, lang, isSpanish, local]);

  return useMemo(() => {
    const map = {};
    list.forEach((tk) => {
      const frag = taskFragment(tk);
      const cached = frag ? parseTitleTranslations(tk)[lang] : null;
      const fragText = frag
        ? isSpanish
          ? frag
          : cached || localFrag(tk) || frag
        : null;
      map[tk.id] = {
        title: composeTaskTitle(tk, t, fragText),
        translating: !!frag && !isSpanish && !cached && !localFrag(tk),
      };
    });
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids, lang, local, t, isSpanish]);
}