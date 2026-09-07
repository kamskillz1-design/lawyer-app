import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Save } from "lucide-react";
import { STAGES, stageLabel } from "@/lib/constants";
import { formatDate, todayISO } from "@/lib/format";
import MatterChecklist from "@/components/matter/MatterChecklist";
import MatterDocuments from "@/components/matter/MatterDocuments";
import MatterTasks from "@/components/matter/MatterTasks";
import MatterTimeline from "@/components/matter/MatterTimeline";

const input = "w-full h-9 rounded-md border border-input bg-card px-3 text-sm";

export default function MatterDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const [matter, setMatter] = useState(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({});
  const [me, setMe] = useState(null);

  const reload = () => base44.entities.Matter.get(id).then(setMatter);
  useEffect(() => {
    reload();
    base44.auth.me().then(setMe).catch(() => {});
  }, [id]);

  const changeStage = async (stage) => {
    const oldStage = matter.stage;
    await base44.entities.Matter.update(id, { stage });
    await base44.entities.AuditLog.create({
      entity_type: "Matter", entity_id: id, action: "stage_change",
      actor: me?.email, actor_name: me?.full_name || "Personal",
      summary: `Etapa: ${stageLabel(oldStage)} → ${stageLabel(stage)}`,
    });
    reload();
    toast({ title: "Etapa actualizada", description: "El cliente verá el estado traducido en su portal." });
  };

  const saveDraft = async () => {
    await base44.entities.Matter.update(id, draft);
    await base44.entities.AuditLog.create({
      entity_type: "Matter", entity_id: id, action: "updated",
      actor_name: me?.full_name || "Personal", summary: "Datos del expediente actualizados",
    });
    setEditing(false);
    reload();
    toast({ title: "Expediente guardado" });
  };

  if (!matter) return <p className="text-muted-foreground">Cargando…</p>;

  const setD = (k) => (e) => setDraft({ ...draft, [k]: e.target.value });
  const val = (k) => (draft[k] !== undefined ? draft[k] : (matter[k] || ""));

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

  return (
    <div className="space-y-6">
      <div>
        <Link to="/matters" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Expedientes
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3 mt-1">
          <div>
            <h1 className="font-heading text-3xl font-bold">{matter.matter_number}</h1>
            <p className="text-muted-foreground text-sm">
              {matter.procedure_type} · <Link to={`/clients/${matter.client_id}`} className="hover:text-primary">{matter.client_name}</Link>
              {" · "}{matter.authority || "—"} · abierto {formatDate(matter.opened_date)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select value={matter.stage} onChange={(e) => changeStage(e.target.value)}
              className="h-10 rounded-xl border border-input bg-card px-3 text-sm font-medium">
              {STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
            {editing ? (
              <Button className="rounded-xl" onClick={saveDraft}><Save className="w-4 h-4 me-1" /> Guardar</Button>
            ) : (
              <Button variant="outline" className="rounded-xl" onClick={() => setEditing(true)}>Editar datos</Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="card-soft p-4">
          <p className="text-xs text-muted-foreground">Próxima acción</p>
          <p className="font-medium mt-1">{matter.next_action || "—"}</p>
          <p className="text-xs text-muted-foreground mt-1">Responsable: {matter.next_action_owner || "—"}</p>
        </div>
        <div className="card-soft p-4">
          <p className="text-xs text-muted-foreground">Próximo plazo / revisión</p>
          <p className="font-heading text-lg font-bold mt-1">{formatDate(matter.next_deadline)}</p>
        </div>
        <div className="card-soft p-4">
          <p className="text-xs text-muted-foreground">Urgencia</p>
          <p className="font-heading text-lg font-bold mt-1 capitalize">{matter.urgency}</p>
        </div>
      </div>

      <Tabs defaultValue="checklist">
        <TabsList className="bg-secondary rounded-xl">
          <TabsTrigger value="checklist" className="rounded-lg data-[state=active]:bg-card">Checklist</TabsTrigger>
          <TabsTrigger value="documents" className="rounded-lg data-[state=active]:bg-card">Documentos</TabsTrigger>
          <TabsTrigger value="tasks" className="rounded-lg data-[state=active]:bg-card">Tareas</TabsTrigger>
          <TabsTrigger value="timeline" className="rounded-lg data-[state=active]:bg-card">Cronología</TabsTrigger>
          <TabsTrigger value="data" className="rounded-lg data-[state=active]:bg-card">Datos</TabsTrigger>
        </TabsList>
        <TabsContent value="checklist" className="mt-4"><MatterChecklist matter={matter} /></TabsContent>
        <TabsContent value="documents" className="mt-4"><MatterDocuments matter={matter} /></TabsContent>
        <TabsContent value="tasks" className="mt-4"><MatterTasks matter={matter} /></TabsContent>
        <TabsContent value="timeline" className="mt-4"><MatterTimeline matter={matter} /></TabsContent>
        <TabsContent value="data" className="mt-4">
          <div className="card-soft p-5 grid md:grid-cols-2 gap-4">
            {FIELDS.map(({ k, l, type, options }) => (
              <div key={k}>
                <label className="text-xs text-muted-foreground">{l}</label>
                {editing ? (
                  options ? (
                    <select className={input} value={val(k)} onChange={setD(k)}>
                      <option value="">—</option>
                      {options.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input type={type || "text"} className={input} value={val(k)} onChange={setD(k)} />
                  )
                ) : (
                  <p className={`py-1.5 ${type === "date" && val(k) ? "" : ""}`}>{val(k) ? (type === "date" ? formatDate(val(k)) : val(k)) : "—"}</p>
                )}
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}