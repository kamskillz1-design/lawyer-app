import React from "react";
import { useI18n } from "@/lib/i18n";
import { formatDate } from "@/lib/format";
import { inputClass as input } from "@/lib/formStyles";

// Matter data fields shown in the "Data" tab — read-only unless editing.
// Edits are staged in the parent's draft object and reported through
// onFieldChange(key, value). Labels resolve through the i18n dictionary.
const FIELDS = [
  { k: "next_action", l: "mf_next_action" },
  { k: "next_action_owner", l: "mf_next_owner", options: ["staff", "lawyer", "client", "authority", "third_party"] },
  { k: "next_deadline", l: "mf_next_deadline", type: "date" },
  { k: "target_submission_date", l: "mf_target_date", type: "date" },
  { k: "submission_date", l: "mf_submission_date", type: "date" },
  { k: "government_ref", l: "mf_gov_ref" },
  { k: "assigned_lawyer", l: "mf_lawyer" },
  { k: "assigned_caseworker", l: "mf_caseworker" },
  { k: "outcome", l: "mf_outcome" },
  { k: "renewal_due_date", l: "mf_renewal", type: "date" },
  { k: "legacy_dropbox_path", l: "mf_dropbox_path" },
  { k: "status_reason", l: "mf_status_reason" },
];

export default function MatterDataFields({ matter, draft, editing, onFieldChange }) {
  const { t } = useI18n();
  const valueOf = (k) => (draft[k] !== undefined ? draft[k] : (matter[k] || ""));

  return (
    <div className="card-soft p-5 grid md:grid-cols-2 gap-4">
      {FIELDS.map(({ k, l, type, options }) => (
        <div key={k}>
          <label className="text-xs text-muted-foreground">{t(l)}</label>
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