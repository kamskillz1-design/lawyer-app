// Automated-task display text. The daily reminder scan stores a structured
// `payload` (JSON) on every automation task so the title/instructions can be
// composed here from dictionary templates in the interface language — no
// translation cost, proper plurals. Staff-typed fragments (manual titles, the
// document name inside a checklist task, the original task inside an
// escalation) are NOT templated; the useTaskTitles hook translates those with
// the cached aiTranslate flow and passes the translated fragment in here.

const parseJson = (s) => {
  try { return s ? JSON.parse(s) : null; } catch (e) { return null; }
};

export const parsePayload = (tk) => parseJson(tk.payload);

export const parseTitleTranslations = (tk) => {
  const parsed = parseJson(tk.title_translations);
  return parsed && typeof parsed === "object" ? parsed : {};
};

const fill = (tpl, vars) =>
  (tpl || "").replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? String(vars[k]) : ""));

// n < 0 → overdue bucket; 0 → due today; 1 → singular; else plural with {n}.
const suffix = (n) => (n < 0 ? "overdue" : n === 0 ? "today" : n === 1 ? "one" : "days");

// The staff-typed fragment embedded in a task's display title:
// - manual task → its own title
// - escalation → the title of the task being escalated
// - checklist → the name of the pending document
// - null → the title is fully template-based (nothing to machine-translate)
export const taskFragment = (tk) => {
  const p = parsePayload(tk);
  if (!p) return tk.title;
  if (p.kind === "escalation") return p.ref_title || "";
  if (p.kind === "checklist") return p.doc_title || "";
  return null;
};

// fragment = the (already translated, when applicable) staff-typed fragment.
export const composeTaskTitle = (tk, t, fragment) => {
  const p = parsePayload(tk);
  if (!p) return fragment != null && fragment !== "" ? fragment : tk.title;
  const frag = fragment != null ? fragment : "";
  switch (p.kind) {
    case "deadline": {
      const n = p.days == null ? 0 : p.days;
      return fill(t("tpl_deadline_" + suffix(n)), {
        n: Math.abs(n),
        matter: p.matter_number || "",
        procedure: p.procedure_type || "",
      });
    }
    case "escalation":
      return t("tpl_escalation") + " " + frag;
    case "checklist": {
      const n = p.days == null ? 0 : p.days;
      return fill(t("tpl_checklist_" + suffix(n)), { n: Math.abs(n), doc: frag });
    }
    case "invoice_overdue":
      return fill(t("tpl_invoice_overdue"), { invoice: p.invoice || "", client: p.client || "" });
    case "invoice_due": {
      const n = p.days == null ? 0 : p.days;
      return fill(t("tpl_invoice_" + suffix(n)), { n: Math.abs(n), invoice: p.invoice || "", client: p.client || "" });
    }
    case "permit":
    case "passport": {
      const n = p.days == null ? 0 : p.days;
      return fill(t("tpl_" + p.kind + "_" + suffix(n)), { n: Math.abs(n), client: p.client || "" });
    }
    default:
      return tk.title;
  }
};

// Instructions for template-based auto tasks. Checklist tasks keep their
// stored instructions (the client-language chase draft composed by the scan).
export const composeTaskInstructions = (tk, t) => {
  const p = parsePayload(tk);
  if (!p) return tk.instructions || "";
  switch (p.kind) {
    case "deadline": {
      const ownerKey = { staff: "owner_staff", lawyer: "owner_lawyer", client: "owner_client", authority: "owner_authority", third_party: "owner_third_party" }[p.next_action_owner];
      return fill(t("tpl_instr_deadline"), {
        action: p.next_action || "—",
        owner: ownerKey ? t(ownerKey) : "—",
      });
    }
    case "escalation":
      return fill(t("tpl_instr_escalation"), { n: Math.abs(p.days || 0) });
    case "checklist":
      return tk.instructions || "";
    case "invoice_overdue":
      return t("tpl_instr_invoice_overdue");
    case "invoice_due":
      return t("tpl_instr_invoice_due");
    case "permit":
      return t("tpl_instr_permit");
    case "passport":
      return t("tpl_instr_passport");
    default:
      return tk.instructions || "";
  }
};