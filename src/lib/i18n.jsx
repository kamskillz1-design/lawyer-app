import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { LANGUAGES, getLanguage } from "./languages";
import { DICT } from "./dictionaries";
import { base44 } from "@/api/base44Client";

const EXTRA_DICT = {
  en: {
    new_message: "New message",
    send_message: "Send message",
    compose_pick_client: "Client",
    compose_spanish: "Message in Spanish",
    compose_translate: "Translate into the client's language",
    compose_send: "Send message",
    compose_need_client: "Choose a client first",
    compose_need_text: "Write the message in Spanish first",
    compose_no_portal: "This client has no linked portal account. Invite them from their record before sending a portal message.",
    mf_procedure_family: "Procedure family",
    mf_procedure_type: "Procedure type",
    mf_province: "Province",
    resend_invite: "Resend invitation",
    toast_invite_resent: "Invitation resent",
    toast_invite_resent_body: "They will receive a new sign-in email. Check spam if it does not arrive.",
    resend_need_email: "An email address is required to resend the invitation.",
  },
  es: {
    new_message: "Nuevo mensaje",
    send_message: "Enviar mensaje",
    compose_pick_client: "Cliente",
    compose_spanish: "Mensaje en español",
    compose_translate: "Traducir al idioma del cliente",
    compose_send: "Enviar mensaje",
    compose_need_client: "Elija primero un cliente",
    compose_need_text: "Escriba primero el mensaje en español",
    compose_no_portal: "Este cliente no tiene cuenta de portal vinculada. Invítele desde su ficha antes de enviar un mensaje al portal.",
    mf_procedure_family: "Familia del procedimiento",
    mf_procedure_type: "Tipo de procedimiento",
    mf_province: "Provincia",
    resend_invite: "Reenviar invitación",
    toast_invite_resent: "Invitación reenviada",
    toast_invite_resent_body: "Recibirán un nuevo correo de acceso. Revise el spam si no llega.",
    resend_need_email: "Se necesita un correo electrónico para reenviar la invitación.",
  },
};
Object.assign(DICT.en, EXTRA_DICT.en);
Object.assign(DICT.es, EXTRA_DICT.es);

const globalScope = typeof window !== "undefined" ? window : globalThis;
const I18nContext = globalScope.__lexpath_i18n_context__ ||
  (globalScope.__lexpath_i18n_context__ = createContext(null));

const DICT_CACHE_VERSION = 4;
const cacheKey = (code) => `lexpath_dict_v${DICT_CACHE_VERSION}_${code}`;

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
  const [lang, setLangState] = useState(() => {
    const stored = localStorage.getItem("lexpath_lang");
    return LANGUAGES.some((l) => l.code === stored) ? stored : "es";
  });
  const [translating, setTranslating] = useState(false);
  const [, forceRefresh] = useState(0);
  const dictCache = useRef(new Map());

  const getDict = (code) => {
    if (code === "en") return DICT.en;
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
  const BATCH_SIZE = 100;

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
