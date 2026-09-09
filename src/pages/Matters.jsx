import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Plus } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { STAGES, PROCEDURE_FAMILIES, PROCEDURE_TYPES, stageLabel } from "@/lib/constants";
import { formatDate, todayISO } from "@/lib/format";
import StatusBadge from "@/components/StatusBadge";
import { inputClass as input } from "@/lib/formStyles";
import InlineMessage from "@/components/InlineMessage";
const DEFAULT_CHECKLIST = [
  { category: "passport", title: "Pasaporte vigente de todos los miembros", why: "Identificación y viajes", translation_required: false },
  { category: "padron_certificate", title: "Certificado de empadronamiento", why: "Acreditación de residencia en España", translation_required: false },
  { category: "payslips", title: "Últimas nóminas / prueba de medios económicos", why: "Solvencia exigida por la normativa", translation_required: false },
  { category: "health_insurance", title: "Seguro de salud privado", why: "Cobertura sanitaria obligatoria", translation_required: false },
];

export default function Matters() {
  const { toast } = useToast();
  const { t } = useI18n();
  const [matters, setMatters] = useState(null);
  const [clients, setClients] = useState([]);
  const [stageFilter, setStageFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ client_id: "", procedure_family: PROCEDURE_FAMILIES[0], procedure_type: PROCEDURE_TYPES[0], authority: "Subdelegación del Gobierno (Bizkaia)", province: "Bizkaia", urgency: "normal", assigned_lawyer: "", assigned_caseworker: "", next_action: "Solicitar documentos al cliente", next_action_owner: "staff", next_deadline: "", target_submission_date: "" });

  const reload = async () => {
    const [ms, cs] = await Promise.all([base44.entities.Matter.list("-created_date"), base44.entities.Client.list()]);
    setMatters(ms);
    setClients(cs);
  };
  useEffect(() => { reload(); }, []);

  const create = async () => {
    const client = clients.find((c) => c.id === form.client_id);
    const count = (matters?.length || 0) + 1;
    const matter_number = `M-${new Date().getFullYear()}-${String(count).padStart(3, "0")}`;
    const matter = await base44.entities.Matter.create({
      ...form,
      matter_number,
      client_id: client.id,
      client_name: client.legal_name,
      portal_user_id: client.portal_user_id || "",
      stage: "open_documents_requested",
      opened_date: todayISO(),
    });
    await base44.entities.ChecklistItem.bulkCreate(
      DEFAULT_CHECKLIST.map((item, i) => ({
        matter_id: matter.id, matter_number, client_id: client.id, client_name: client.legal_name,
        portal_user_id: client.portal_user_id || "", sort_order: i, status: "needed", ...item,
      }))
    );
    await base44.entities.Task.create({
      title: form.next_action || "Solicitar documentos al cliente",
      matter_id: matter.id, client_id: client.id, matter_number,
      owner: form.assigned_caseworker || "Pendiente asignar",
      due_date: form.next_deadline || "", priority: form.urgency, task_type: "client_document", status: "todo",
    });
    await base44.entities.AuditLog.create({ entity_type: "Matter", entity_id: matter.id, action: "created", summary: `Expediente ${matter_number} creado` });
    setOpen(false);
    reload();
    toast({ title: t("toast_matter_created"), description: t("toast_checklist_generated") });
  };

  if (!matters) return <InlineMessage />;

  const filtered = stageFilter === "all" ? matters : matters.filter((m) => m.stage === stageFilter);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-3xl font-bold">{t("matters_title")}</h1>
        <div className="flex flex-wrap gap-2 min-w-0">
          <select className="h-9 max-w-full rounded-xl border border-input bg-card px-3 text-sm" value={stageFilter} onChange={(e) => setStageFilter(e.target.value)}>
            <option value="all">{t("all_stages")}</option>
            {STAGES.map((s) => <option key={s.id} value={s.id}>{t(s.key)}</option>)}
          </select>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button className="rounded-xl"><Plus className="w-4 h-4 me-1" /> {t("new_matter")}</Button></DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader><DialogTitle>{t("new_matter")}</DialogTitle></DialogHeader>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select className={input} value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })}>
                  <option value="">{t("ph_client_required")}</option>
                  {clients.map((c) => <option key={c.id} value={c.id}>{c.legal_name}</option>)}
                </select>
                <select className={input} value={form.procedure_family} onChange={(e) => setForm({ ...form, procedure_family: e.target.value })}>
                  {PROCEDURE_FAMILIES.map((f) => <option key={f}>{f}</option>)}
                </select>
                <select className={input} value={form.procedure_type} onChange={(e) => setForm({ ...form, procedure_type: e.target.value })}>
                  {PROCEDURE_TYPES.map((p) => <option key={p}>{p}</option>)}
                </select>
                <input className={input} placeholder={t("ph_authority")} value={form.authority} onChange={(e) => setForm({ ...form, authority: e.target.value })} />
                <input className={input} placeholder={t("ph_lawyer")} value={form.assigned_lawyer} onChange={(e) => setForm({ ...form, assigned_lawyer: e.target.value })} />
                <input className={input} placeholder={t("ph_caseworker")} value={form.assigned_caseworker} onChange={(e) => setForm({ ...form, assigned_caseworker: e.target.value })} />
                <select className={input} value={form.urgency} onChange={(e) => setForm({ ...form, urgency: e.target.value })}>
                  <option value="low">{t("prio_low")}</option><option value="normal">{t("prio_medium")}</option>
                  <option value="high">{t("prio_high")}</option><option value="urgent">{t("prio_urgent")}</option>
                </select>
                <select className={input} value={form.next_action_owner} onChange={(e) => setForm({ ...form, next_action_owner: e.target.value })}>
                  <option value="staff">{t("next_step_prefix")} {t("owner_staff")}</option><option value="lawyer">{t("owner_lawyer")}</option>
                  <option value="client">{t("owner_client")}</option><option value="authority">{t("owner_authority")}</option><option value="third_party">{t("owner_third_party")}</option>
                </select>
                <input className={input} placeholder={t("ph_next_action")} value={form.next_action} onChange={(e) => setForm({ ...form, next_action: e.target.value })} />
                <input type="date" className={input} value={form.next_deadline} onChange={(e) => setForm({ ...form, next_deadline: e.target.value })} />
                <input type="date" className={input} value={form.target_submission_date} onChange={(e) => setForm({ ...form, target_submission_date: e.target.value })} />
              </div>
              <Button className="w-full rounded-xl mt-2" onClick={create} disabled={!form.client_id}>{t("create_matter")}</Button>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="card-soft hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-muted-foreground border-b">
              <th className="p-3 text-start">{t("th_matter")}</th><th className="p-3 text-start">{t("clients_title")}</th><th className="p-3 text-start">{t("th_stage")}</th>
              <th className="p-3 text-start">{t("th_next_action")}</th><th className="p-3 text-start">{t("deadline")}</th><th className="p-3 text-start">{t("th_urgency")}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => (
              <tr key={m.id} className="border-b last:border-0 hover:bg-secondary/50">
                <td className="p-3">
                  <Link to={`/matters/${m.id}`} className="font-medium hover:text-primary">{m.matter_number}</Link>
                  <p className="text-xs text-muted-foreground">{m.procedure_type}</p>
                </td>
                <td className="p-3">{m.client_name}</td>
                <td className="p-3 text-xs">{stageLabel(m.stage, t)}</td>
                <td className="p-3 text-xs">{m.next_action || "—"}<br /><span className="text-muted-foreground">{m.next_action_owner || ""}</span></td>
                <td className="p-3 text-xs">{formatDate(m.next_deadline)}</td>
                <td className="p-3"><StatusBadge value={m.urgency} label={t("prio_" + m.urgency)} /></td>
              </tr>
            ))}
            {!filtered.length && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">{t("no_matters")}</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-2">
        {filtered.map((m) => (
          <Link key={m.id} to={`/matters/${m.id}`} className="card-soft block p-4 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium break-words">{m.matter_number}</p>
              <StatusBadge value={m.urgency} label={t("prio_" + m.urgency)} />
            </div>
            <p className="text-xs text-muted-foreground break-words">{m.client_name} · {m.procedure_type}</p>
            <p className="text-xs">{stageLabel(m.stage, t)}</p>
            <p className="text-xs text-muted-foreground break-words">{m.next_action || "—"} · {formatDate(m.next_deadline)}</p>
          </Link>
        ))}
        {!filtered.length && <p className="text-sm text-muted-foreground p-4">{t("no_matters")}</p>}
      </div>
    </div>
  );
}