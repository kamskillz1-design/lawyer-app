import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { me as authMe } from "@/api/auth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Save } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { STAGES, stageLabel, procedureLabel } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import MatterChecklist from "@/components/matter/MatterChecklist";
import MatterDocuments from "@/components/matter/MatterDocuments";
import MatterTasks from "@/components/matter/MatterTasks";
import MatterTimeline from "@/components/matter/MatterTimeline";
import MatterDataFields from "@/components/matter/MatterDataFields";
import InlineMessage from "@/components/InlineMessage";

export default function MatterDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const { t } = useI18n();
  const [matter, setMatter] = useState(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({});
  const [me, setMe] = useState(null);

  const reload = () => base44.entities.Matter.get(id).then(setMatter);
  useEffect(() => {
    reload();
    authMe().then(setMe).catch(() => {});
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
    toast({ title: t("stage_updated"), description: t("stage_updated_body") });
  };

  const saveDraft = async () => {
    await base44.entities.Matter.update(id, draft);
    await base44.entities.AuditLog.create({
      entity_type: "Matter", entity_id: id, action: "updated",
      actor_name: me?.full_name || "Personal", summary: "Datos del expediente actualizados",
    });
    setEditing(false);
    reload();
    toast({ title: t("matter_saved") });
  };

  if (!matter) return <InlineMessage />;

  return (
    <div className="space-y-6">
      <div>
        <Link to="/matters" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> {t("matters_title")}
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3 mt-1">
          <div className="min-w-0 flex-1">
            <h1 className="font-heading text-3xl font-bold">{matter.matter_number}</h1>
            <p className="text-muted-foreground text-sm break-words">
              {procedureLabel(matter.procedure_type, t)} · <Link to={`/clients/${matter.client_id}`} className="hover:text-primary">{matter.client_name}</Link>
              {" · "}{matter.authority || "—"} · {t("opened")} {formatDate(matter.opened_date)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 max-w-full">
            <select value={matter.stage} onChange={(e) => changeStage(e.target.value)}
              className="h-10 max-w-full rounded-xl border border-input bg-card px-3 text-sm font-medium">
              {STAGES.map((s) => <option key={s.id} value={s.id}>{t(s.key)}</option>)}
            </select>
            {editing ? (
              <Button className="rounded-xl" onClick={saveDraft}><Save className="w-4 h-4 me-1" /> {t("save")}</Button>
            ) : (
              <Button variant="outline" className="rounded-xl" onClick={() => setEditing(true)}>{t("edit_data")}</Button>
            )}
          </div>
        </div>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="card-soft p-4">
          <p className="text-xs text-muted-foreground">{t("ph_next_action")}</p>
          <p className="font-medium mt-1">{matter.next_action || "—"}</p>
          <p className="text-xs text-muted-foreground mt-1">{t("responsible_lbl")} {matter.next_action_owner || "—"}</p>
        </div>
        <div className="card-soft p-4">
          <p className="text-xs text-muted-foreground">{t("next_deadline_lbl")}</p>
          <p className="font-heading text-lg font-bold mt-1">{formatDate(matter.next_deadline)}</p>
        </div>
        <div className="card-soft p-4">
          <p className="text-xs text-muted-foreground">{t("th_urgency")}</p>
          <p className="font-heading text-lg font-bold mt-1">{t("prio_" + matter.urgency)}</p>
        </div>
      </div>
      <Tabs defaultValue="checklist">
        <TabsList className="bg-secondary rounded-xl h-auto w-full flex flex-wrap justify-start gap-1">
          <TabsTrigger value="checklist" className="rounded-lg data-[state=active]:bg-card">{t("tab_checklist")}</TabsTrigger>
          <TabsTrigger value="documents" className="rounded-lg data-[state=active]:bg-card">{t("nav_documents")}</TabsTrigger>
          <TabsTrigger value="tasks" className="rounded-lg data-[state=active]:bg-card">{t("nav_tasks")}</TabsTrigger>
          <TabsTrigger value="timeline" className="rounded-lg data-[state=active]:bg-card">{t("tab_timeline")}</TabsTrigger>
          <TabsTrigger value="data" className="rounded-lg data-[state=active]:bg-card">{t("tab_data")}</TabsTrigger>
        </TabsList>
        <TabsContent value="checklist" className="mt-4"><MatterChecklist matter={matter} /></TabsContent>
        <TabsContent value="documents" className="mt-4"><MatterDocuments matter={matter} /></TabsContent>
        <TabsContent value="tasks" className="mt-4"><MatterTasks matter={matter} /></TabsContent>
        <TabsContent value="timeline" className="mt-4"><MatterTimeline matter={matter} /></TabsContent>
        <TabsContent value="data" className="mt-4">
          <MatterDataFields matter={matter} draft={draft} editing={editing} onFieldChange={(k, v) => setDraft({ ...draft, [k]: v })} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
