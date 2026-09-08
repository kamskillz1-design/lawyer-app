import React from "react";
import { formatDate } from "@/lib/format";
import { inputClass as input } from "@/lib/formStyles";

// Matter data fields shown in the "Datos" tab — read-only unless editing.
// Edits are staged in the parent's draft object and reported through
// onFieldChange(key, value).
const FIELDS = [
  { k: "next_action", l: "Próxima acción" },
  { k: "next_action_owner", l: "Responsable del próximo paso", options: ["staff", "lawyer", "client", "authority", "third_party"] },
  { k: "next_deadline", l: "Próximo plazo / revisión", type: "date" },
  { k: "target_submission_date", l: "Fecha objetivo de presentación", type: "date" },
  { k: "submission_date", l: "Fecha de presentación", type: "date" },
  { k: "government_ref", l: "Referencia de la autoridad" },
  { k: "assigned_lawyer", l: "Letrado responsable" },
  { k: "assigned_caseworker", l: "Gestor responsable" },
  { k: "outcome", l: "Resultado" },
  { k: "renewal_due_date", l: "Próxima renovación", type: "date" },
  { k: "legacy_dropbox_path", l: "Ruta Dropbox histórica" },
  { k: "status_reason", l: "Motivo de pausa/estado" },
];

export default function MatterDataFields({ matter, draft, editing, onFieldChange }) {
  const valueOf = (k) => (draft[k] !== undefined ? draft[k] : (matter[k] || ""));

  return (
    <div className="card-soft p-5 grid md:grid-cols-2 gap-4">
      {FIELDS.map(({ k, l, type, options }) => (
        <div key={k}>
          <label className="text-xs text-muted-foreground">{l}</label>
          {editing ? (
            options ? (
              <select className={input} value={valueOf(k)} onChange={(e) => onFieldChange(k, e.target.value)}>
                <option value="">—</option>
                {options.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : (
              <input type={type || "text"} className={input} value={valueOf(k)} onChange={(e) => onFieldChange(k, e.target.value)} />
            )
          ) : (
            <p className="py-1.5">{valueOf(k) ? (type === "date" ? formatDate(valueOf(k)) : valueOf(k)) : "—"}</p>
          )}
        </div>
      ))}
    </div>
  );
}