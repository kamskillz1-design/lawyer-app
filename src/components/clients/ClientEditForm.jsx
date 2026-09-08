import React from "react";
import { LANGUAGES } from "@/lib/languages";
import { inputClass as input } from "@/lib/formStyles";

// Editable client profile sections (identity, immigration IDs, contact,
// languages, legal service, legacy Dropbox archive).
const SECTIONS = [
  {
    title: "Identidad",
    fields: [
      { k: "legal_name", l: "Nombre legal" }, { k: "preferred_name", l: "Nombre preferido" },
      { k: "date_of_birth", l: "Fecha nacimiento", type: "date" }, { k: "country_of_birth", l: "País nacimiento" },
      { k: "nationalities", l: "Nacionalidades" },
    ],
  },
  {
    title: "Identidad de extranjería",
    fields: [
      { k: "passport_number", l: "Pasaporte" }, { k: "passport_expiry", l: "Caducidad pasaporte", type: "date" },
      { k: "nie_number", l: "NIE" }, { k: "tie_number", l: "TIE" },
      { k: "permit_type", l: "Tipo de permiso" }, { k: "permit_expiry", l: "Caducidad permiso", type: "date" },
    ],
  },
  {
    title: "Contacto",
    fields: [
      { k: "phone", l: "Teléfono" }, { k: "email", l: "Email" }, { k: "address", l: "Dirección" },
      { k: "preferred_channel", l: "Canal preferido", options: ["phone", "email", "whatsapp", "portal"] },
    ],
  },
  {
    title: "Idiomas y comunicación",
    fields: [
      { k: "interface_language", l: "Idioma del portal", lang: true }, { k: "written_language", l: "Idioma escrito", lang: true },
      { k: "spoken_language", l: "Idioma hablado", lang: true }, { k: "interpreter_language", l: "Idioma del intérprete", lang: true },
      { k: "language_notes", l: "Notas de idioma/accesibilidad", wide: true },
    ],
    booleans: [{ k: "interpreter_required", l: "Requiere intérprete" }, { k: "reads_spanish", l: "Lee español" }, { k: "reads_english", l: "Lee inglés" }],
  },
  {
    title: "Servicio legal",
    fields: [
      { k: "engagement_status", l: "Estado de encargo", options: ["prospect", "consulted", "engaged", "inactive", "archived"] },
      { k: "assigned_lawyer", l: "Letrado asignado" }, { k: "assigned_caseworker", l: "Gestor asignado" },
      { k: "service_package", l: "Paquete de servicio" }, { k: "referral_source", l: "Origen" },
    ],
  },
  {
    title: "Archivo Dropbox (histórico)",
    fields: [
      { k: "legacy_dropbox_path", l: "Ruta Dropbox", wide: true }, { k: "legacy_reference", l: "Referencia histórica" },
      { k: "legacy_notes", l: "Nota de migración", wide: true },
      { k: "retention_review_date", l: "Revisión de retención", type: "date" },
    ],
  },
];

// Controlled editor: reports every field change through onFieldChange(key, value).
export default function ClientEditForm({ client, onFieldChange }) {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {SECTIONS.map((sec) => (
        <div key={sec.title} className="card-soft p-5">
          <h3 className="font-heading font-semibold mb-4">{sec.title}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {sec.fields.map(({ k, l, type, options, lang, wide }) => (
              <div key={k} className={wide ? "sm:col-span-2" : ""}>
                <label className="text-xs text-muted-foreground">{l}</label>
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
                  <input type="checkbox" checked={!!client[k]} onChange={(e) => onFieldChange(k, e.target.checked)} /> {l}
                </label>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}