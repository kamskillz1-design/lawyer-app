import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { LANGUAGES, getLanguage } from "./languages";
import { DICT } from "./dictionaries";
import { base44 } from "@/api/base44Client";

const I18nContext = createContext(null);

const cacheKey = (code) => `lexpath_dict_${code}`;
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
    if (DICT[code]) return DICT[code];
    if (dictCache.current.has(code)) return dictCache.current.get(code);
    const parsed = readCachedDict(code);
    if (parsed) dictCache.current.set(code, parsed);
    return parsed;
  };

  useEffect(() => {
    localStorage.setItem("lexpath_lang", lang);
    const l = getLanguage(lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = l.rtl ? "rtl" : "ltr";
  }, [lang]);

  const setLang = (code) => {
    if (!LANGUAGES.some((l) => l.code === code)) return;
    setLangState(code);
    if (!DICT[code] && code !== "en" && !getDict(code)) {
      setTranslating(true);
      base44.functions
        .invoke("translateUi", { target_language: code, strings: DICT.en })
        .then((res) => {
          const dict = res.data && res.data.dict;
          if (dict && typeof dict === "object") {
            localStorage.setItem(cacheKey(code), JSON.stringify(dict));
            dictCache.current.set(code, dict);
            forceRefresh((n) => n + 1);
          }
        })
        .catch(() => {})
        .finally(() => setTranslating(false));
    }
  };

  const t = (key) => {
    const dict = getDict(lang) || DICT.en;
    return dict[key] || DICT.en[key] || key;
  };

  const stageText = (stage) => {
    const map = {
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
    return map[stage] ? t(map[stage]) : null;
  };

  const checklistText = (status) => {
    const map = {
      needed: "cl_needed",
      uploaded: "cl_uploaded",
      being_checked: "cl_checking",
      accepted: "cl_accepted",
      needs_correction: "cl_correction",
      not_required: "cl_not_required",
    };
    return map[status] ? t(map[status]) : status;
  };

  return (
    <I18nContext.Provider
      value={{ lang, setLang, t, rtl: getLanguage(lang).rtl, stageText, checklistText, translating }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export const useI18n = () => useContext(I18nContext);