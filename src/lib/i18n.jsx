import React, { createContext, useContext, useEffect, useState } from "react";
import { LANGUAGES, getLanguage } from "./languages";
import { DICT } from "./dictionaries";

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(() => localStorage.getItem("lexpath_lang") || "es");

  useEffect(() => {
    localStorage.setItem("lexpath_lang", lang);
    const l = getLanguage(lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = l.rtl ? "rtl" : "ltr";
  }, [lang]);

  const setLang = (code) => {
    if (LANGUAGES.some((l) => l.code === code)) setLangState(code);
  };

  const t = (key) => {
    const dict = DICT[lang] || {};
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
    <I18nContext.Provider value={{ lang, setLang, t, rtl: getLanguage(lang).rtl, stageText, checklistText }}>
      {children}
    </I18nContext.Provider>
  );
}

export const useI18n = () => useContext(I18nContext);