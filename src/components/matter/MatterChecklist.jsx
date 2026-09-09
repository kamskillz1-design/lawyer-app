import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { DOC_CATEGORIES, CHECKLIST_STATUSES, checklistLabel } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import StatusBadge from "@/components/StatusBadge";
import { inputClass as input } from "@/lib/formStyles";
import InlineMessage from "@/components/InlineMessage";

export default function MatterChecklist({ matter }) {
  const { t } = useI18n();
  const [items, setItems] = useState(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: "", category: "other", why_required: "", who_provides: "client", deadline: "" });

  const reload = () => base44.entities.ChecklistItem.filter({ matter_id: matter.id }).then(setItems);
  useEffect(() => { reload(); }, [matter.id]);

  const setStatus = async (item, status) => {
    await base44.entities.ChecklistItem.update(item.id, { status });
    reload();
  };

  const add = async () => {
    await base44.entities.ChecklistItem.create({
      matter_id: matter.id, matter_number: matter.matter_number, client_id: matter.client_id,
      client_name: matter.client_name, portal_user_id: matter.portal_user_id || "",
      title: form.title, category: form.category, why_required: form.why_required,
      who_provides: form.who_provides, deadline: form.deadline || "", status: "needed",
      sort_order: (items?.length || 0) + 1,
    });
    setAdding(false);
    setForm({ title: "", category: "other", why_required: "", who_provides: "client", deadline: "" });
    reload();
  };

  const remove = async (item) => {
    await base44.entities.ChecklistItem.delete(item.id);
    reload();
  };

  if (!items) return <InlineMessage className="text-sm" text={t("loading_checklist")} />;
  const done = items.filter((i) => ["accepted", "not_required"].includes(i.status)).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{done}/{items.length} {t("checklist_progress")}</p>
        <Button size="sm" variant="outline" className="rounded-lg" onClick={() => setAdding(!adding)}>
          <Plus className="w-4 h-4 me-1" /> {t("add_document")}
        </Button>
      </div>

      {adding && (
        <div className="card-soft p-4 grid md:grid-cols-5 gap-3 items-end">
          <input className={input + " md:col-span-2"} placeholder={t("ph_doc_required")} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <select className={input} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {DOC_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{t(c.key)}</option>)}
          </select>
          <select className={input} value={form.who_provides} onChange={(e) => setForm({ ...form, who_provides: e.target.value })}>
            <option value="client">{t("wp_client")}</option><option value="office">{t("wp_office")}</option>
            <option value="authority">{t("wp_authority")}</option><option value="third_party">{t("wp_third")}</option>
          </select>
          <input type="date" className={input} value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
          <input className={input + " md:col-span-4"} placeholder={t("ph_why_needed")} value={form.why_required} onChange={(e) => setForm({ ...form, why_required: e.target.value })} />
          <Button className="rounded-lg" onClick={add} disabled={!form.title}>{t("add")}</Button>
        </div>
      )}

      {items.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)).map((item) => (
        <div key={item.id} className="card-soft p-4 flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-52">
            <p className="font-medium text-sm">{item.title}</p>
            <p className="text-xs text-muted-foreground">
              {item.why_required || ""} {item.deadline ? `· ${t("deadline_word")} ${formatDate(item.deadline)}` : ""}
            </p>
          </div>
          <StatusBadge value={item.status} label={checklistLabel(item.status, t)} />
          <select value={item.status} onChange={(e) => setStatus(item, e.target.value)}
            className="h-8 rounded-md border border-input bg-card px-2 text-xs">
            {CHECKLIST_STATUSES.map((s) => <option key={s.id} value={s.id}>{t(s.key)}</option>)}
          </select>
          <button onClick={() => remove(item)} aria-label={t("close")} className="p-2 text-muted-foreground hover:text-red-600 rounded-lg hover:bg-red-50">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
      {!items.length && <p className="text-sm text-muted-foreground">{t("no_checklist_items")}</p>}
    </div>
  );
}