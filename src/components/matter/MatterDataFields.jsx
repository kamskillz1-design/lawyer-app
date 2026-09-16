import React from "react";
import { useI18n } from "@/lib/i18n";
import { formatDate } from "@/lib/format";
import { inputClass as input } from "@/lib/formStyles";
import { PROCEDURE_FAMILIES, PROCEDURE_TYPES, familyLabel, procedureLabel, ownerLabel } from "@/lib/constants";

const OWNER_OPTIONS = ["staff", "lawyer", "client", "authority", "third_party"];
const URGENCY_OPTIONS = ["low", "normal", "high", "urgent"];

const FIELDS = [
  { k: "procedure_family", l: "mf_procedure_family", kind: "family" },
  { k: "procedure_type", l: "mf_procedure_type", kind: "procedure" },
  { k: "authority", l: "ph_authority" },
  { k: "province", l: "mf_province" },
  { k: "urgency", l: "th_urgency", kind: "urgency" },
  { k: "next_action", l: "mf_next_action" },
  { k: "next_action_owner", l: "mf_next_owner", kind: "owner" },
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

  const display = (field, raw) => {
    if (!raw) return "—";
    if (field.type === "date") return formatDate(raw);
    if (field.kind === "family") return familyLabel(raw, t) || raw;
    if (field.kind === "procedure") return procedureLabel(raw, t) || raw;
    if (field.kind === "owner") return ownerLabel(raw, t) || raw;
    if (field.kind === "urgency") return t("prio_" + raw) || raw;
    return raw;
  };

  return (
    <div className="card-soft p-5 grid md:grid-cols-2 gap-4">
      {FIELDS.map((field) => {
        const { k, l, type, kind } = field;
        const val = valueOf(k);
        return (
          <div key={k}>
            <label className="text-xs text-muted-foreground">{t(l)}</label>
            {editing ? (
              kind === "family" ? (
                <select className={input} value={val} onChange={(e) => onFieldChange(k, e.target.value)}>
                  <option value="">—</option>
                  {PROCEDURE_FAMILIES.map((f) => <option key={f.id} value={f.id}>{t(f.key)}</option>)}
                </select>
              ) : kind === "procedure" ? (
                <select className={input} value={val} onChange={(e) => onFieldChange(k, e.target.value)}>
                  <option value="">—</option>
                  {PROCEDURE_TYPES.map((p) => <option key={p.id} value={p.id}>{t(p.key)}</option>)}
                </select>
              ) : kind === "owner" ? (
                <select className={input} value={val} onChange={(e) => onFieldChange(k, e.target.value)}>
                  <option value="">—</option>
                  {OWNER_OPTIONS.map((o) => <option key={o} value={o}>{ownerLabel(o, t)}</option>)}
                </select>
              ) : kind === "urgency" ? (
                <select className={input} value={val} onChange={(e) => onFieldChange(k, e.target.value)}>
                  {URGENCY_OPTIONS.map((o) => <option key={o} value={o}>{t("prio_" + o)}</option>)}
                </select>
              ) : (
                <input type={type || "text"} className={input} value={val} onChange={(e) => onFieldChange(k, e.target.value)} />
              )
            ) : (
              <p className="py-1.5">{display(field, val)}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
