import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { LANGUAGES, getLanguage } from "./languages";
import { DICT } from "./dictionaries";
import { base44 } from "@/api/base44Client";

const I18nContext = createContext(null);

const cacheKey = (code) => `lexpath_dict_${code}`;

const STAGE_KEYS = {
  open_documents_requested: "s_docs_requested",
  documents_under_review: "s_docs_review",
  preparation_in_progress: "s_prep",
  awaiting_lawyer_approval: "s_lawyer",
  ready_to_submit: "s_ready",
  submitted: "s_submitted",
  awaiting_decision: "s_awaiting",
  further_info_requested: "s_further",
  resolution_received: "s_resolution",
  post_resolution: "s_resolution",
  completed: "s_completed",
};

const CHECKLIST_KEYS = {
  needed: "cl_needed",
  uploaded: "cl_uploaded",
  being_checked: "cl_checking",
  accepted: "cl_accepted",
  needs_correction: "cl_correction",
  not_required: "cl_not_required",
};

// English fallback so a consumer rendered outside the provider never crashes.
const FALLBACK = {
  lang: "en",
  setLang: () => {},
  t: (key) => DICT.en[key] || key,
  rtl: false,
  stageText: (stage) => (STAGE_KEYS[stage] ? DICT.en[STAGE_KEYS[stage]] || null : null),
  checklistText: (status) => (CHECKLIST_KEYS[status] ? DICT.en[CHECKLIST_KEYS[status]] || status : status),
  translating: false,
};
const readCachedDict = (code) => {
  try {
    const parsed = JSON.parse(localStorage.getItem(cacheKey(code)) || "null");
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch (e) {
    return null;
  }
};

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(() => localStorage.getItem("lexpath_lang") || "es");
  const [translating, setTranslating] = useState(false);
  const [, forceRefresh] = useState(0);
  const dictCache = useRef(new Map());

  const getDict = (code) => {
    if (dictCache.current.has(code)) return dictCache.current.get(code);
    const parsed = readCachedDict(code);
    if (parsed) {
      dictCache.current.set(code, parsed);
      return parsed;
    }
    if (DICT[code]) return DICT[code];
    return null;
  };

  useEffect(() => {
    localStorage.setItem("lexpath_lang", lang);
    const l = getLanguage(lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = l.rtl ? "rtl" : "ltr";
  }, [lang]);

  const inflight = useRef(new Set());

  // Detect keys missing from a language's dictionary (vs. the English source)
  // and translate only those, merging the result into the existing dictionary.
  // This makes every new UI string available in all supported languages.
  const BATCH_SIZE = 100;

  // Detect keys missing from a language's dictionary (vs. the English source)
  // and translate only those, merging the result into the existing dictionary.
  // The translateUi function rejects payloads over 200 strings, so the missing
  // keys are sent in sequential batches of BATCH_SIZE; each batch is merged and
  // persisted as it arrives. On a batch failure we stop — whatever was merged
  // stays cached and the remaining keys retry on the next language switch.
  const ensureComplete = async (code) => {
    if (code === "en" || inflight.current.has(code)) return;
    const dict = getDict(code) || {};
    const missing = Object.keys(DICT.en).filter((k) => !dict[k]);
    if (!missing.length) return;
    inflight.current.add(code);
    setTranslating(true);
    try {
      for (let i = 0; i < missing.length; i += BATCH_SIZE) {
        const batch = missing.slice(i, i + BATCH_SIZE);
        const strings = {};
        batch.forEach((k) => { strings[k] = DICT.en[k]; });
        const res = await base44.functions.invoke("translateUi", { target_language: code, strings });
        const added = res.data && res.data.dict;
        if (added && typeof added === "object") {
          const merged = { ...(getDict(code) || {}), ...added };
          localStorage.setItem(cacheKey(code), JSON.stringify(merged));
          dictCache.current.set(code, merged);
          forceRefresh((n) => n + 1);
        }
      }
    } catch (e) {
      // Stop on the first failed batch; remaining keys retry next switch.
    } finally {
      inflight.current.delete(code);
      setTranslating(false);
    }
  };

  const setLang = (code) => {
    if (!LANGUAGES.some((l) => l.code === code)) return;
    setLangState(code);
  };

  useEffect(() => {
    ensureComplete(lang);
  }, [lang]);

  const t = (key) => {
    const dict = getDict(lang) || DICT.en;
    return dict[key] || DICT.en[key] || key;
  };

  const stageText = (stage) => (STAGE_KEYS[stage] ? t(STAGE_KEYS[stage]) : null);

  const checklistText = (status) => (CHECKLIST_KEYS[status] ? t(CHECKLIST_KEYS[status]) : status);

  return (
    <I18nContext.Provider
      value={{ lang, setLang, t, rtl: getLanguage(lang).rtl, stageText, checklistText, translating }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export const useI18n = () => useContext(I18nContext) || FALLBACK;