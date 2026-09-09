import React from "react";
import { useI18n } from "@/lib/i18n";
import { LANGUAGES } from "@/lib/languages";
import { inputClass as input } from "@/lib/formStyles";

// Editable client profile sections (identity, immigration IDs, contact,
// languages, legal service, legacy Dropbox archive). Section titles and
// field labels resolve through the i18n dictionary.
const SECTIONS = [
  {
    title: "sec_identity",
    fields: [
      { k: "legal_name", l: "f_legal_name" }, { k: "preferred_name", l: "f_pref_name" },
      { k: "date_of_birth", l: "f_dob", type: "date" }, { k: "country_of_birth", l: "f_country_birth" },
      { k: "nationalities", l: "ph_nationalities" },
    ],
  },
  {
    title: "sec_immigration",
    fields: [
      { k: "passport_number", l: "f_passport" }, { k: "passport_expiry", l: "f_passport_expiry", type: "date" },
      { k: "nie_number", l: "nie_lbl" }, { k: "tie_number", l: "f_tie" },
      { k: "permit_type", l: "f_permit_type" }, { k: "permit_expiry", l: "f_permit_expiry", type: "date" },
    ],
  },
  {
    title: "sec_contact",
    fields: [
      { k: "phone", l: "ph_phone" }, { k: "email", l: "ph_email" }, { k: "address", l: "f_address" },
      { k: "preferred_channel", l: "f_pref_channel", options: ["phone", "email", "whatsapp", "portal"] },
    ],
  },
  {
    title: "sec_languages",
    fields: [
      { k: "interface_language", l: "f_portal_language", lang: true }, { k: "written_language", l: "f_written_lang", lang: true },
      { k: "spoken_language", l: "f_spoken_lang", lang: true }, { k: "interpreter_language", l: "f_interpreter_lang", lang: true },
      { k: "language_notes", l: "f_lang_notes", wide: true },
    ],
    booleans: [{ k: "interpreter_required", l: "f_interpreter_required" }, { k: "reads_spanish", l: "f_reads_spanish" }, { k: "reads_english", l: "f_reads_english" }],
  },
  {
    title: "sec_service",
    fields: [
      { k: "engagement_status", l: "f_engagement", options: ["prospect", "consulted", "engaged", "inactive", "archived"] },
      { k: "assigned_lawyer", l: "f_assigned_lawyer" }, { k: "assigned_caseworker", l: "f_assigned_caseworker" },
      { k: "service_package", l: "f_service_package" }, { k: "referral_source", l: "f_referral" },
    ],
  },
  {
    title: "sec_legacy",
    fields: [
      { k: "legacy_dropbox_path", l: "f_dropbox_path", wide: true }, { k: "legacy_reference", l: "f_legacy_ref" },
      { k: "legacy_notes", l: "f_migration_note", wide: true },
      { k: "retention_review_date", l: "f_retention_review", type: "date" },
    ],
  },
];

// Controlled editor: reports every field change through onFieldChange(key, value).
export default function ClientEditForm({ client, onFieldChange }) {
  const { t } = useI18n();
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {SECTIONS.map((sec) => (
        <div key={sec.title} className="card-soft p-5">
          <h3 className="font-heading font-semibold mb-4">{t(sec.title)}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {sec.fields.map(({ k, l, type, options, lang, wide }) => (
              <div key={k} className={wide ? "sm:col-span-2" : ""}>
                <label className="text-xs text-muted-foreground">{t(l)}</label>
                {options ? (
                  <select className={input} value={client[k] || ""} onChange={(e) => onFieldChange(k, e.target.value)}>
                    <option value="">—</option>
                    {options.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : lang ? (
                  <select className={input} value={client[k] || ""} onChange={(e) => onFieldChange(k, e.target.value)}>
                    <option value="">—</option>
                    {LANGUAGES.map((l2) => <option key={l2.code} value={l2.code}>{l2.native}</option>)}
                  </select>
                ) : (
                  <input type={type || "text"} className={input} value={client[k] || ""} onChange={(e) => onFieldChange(k, e.target.value)} />
                )}
              </div>
            ))}
          </div>
          {sec.booleans && (
            <div className="flex flex-wrap gap-4 mt-4">
              {sec.booleans.map(({ k, l }) => (
                <label key={k} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={!!client[k]} onChange={(e) => onFieldChange(k, e.target.checked)} /> {t(l)}
                </label>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}