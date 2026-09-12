import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { inviteUser } from "@/api/auth";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Save, UserPlus, FolderOpen, Archive, HardDriveDownload } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import ExportArchiveDialog from "@/components/clients/ExportArchiveDialog";
import ArchiveClientDialog from "@/components/clients/ArchiveClientDialog";
import ArchivedClientOptions from "@/components/clients/ArchivedClientOptions";
import { stageLabel, procedureLabel } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import ClientEditForm from "@/components/clients/ClientEditForm";
import InlineMessage from "@/components/InlineMessage";

export default function ClientDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const { t } = useI18n();
  const [client, setClient] = useState(null);
  const [matters, setMatters] = useState([]);
  const [saving, setSaving] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  const reload = async () => {
    const [c, ms] = await Promise.all([
      base44.entities.Client.get(id),
      base44.entities.Matter.filter({ client_id: id }),
    ]);
    setClient(c);
    setMatters(ms);
  };
  useEffect(() => { reload(); }, [id]);

  const set = (k, v) => setClient({ ...client, [k]: v });

  const save = async () => {
    setSaving(true);
    try {
      await base44.entities.Client.update(id, client);
      toast({ title: t("toast_client_saved") });
    } finally {
      setSaving(false);
    }
  };

  const invitePortal = async () => {
    try {
      if (!client.email) throw new Error(t("client_needs_email"));
      await inviteUser(client.email, "user");
      const users = await base44.entities.User.filter({ email: client.email });
      const userId = users?.[0]?.id;
      if (!userId) throw new Error(t("toast_invite_fail"));
      await base44.entities.Client.update(id, { portal_user_id: userId, portal_email: client.email });
      await base44.entities.AuditLog.create({ entity_type: "Client", entity_id: id, action: "portal_invite", summary: `Invitado al portal: ${client.email}` });
      toast({ title: t("toast_invite_sent"), description: `${client.email} ${t("toast_invite_sent_body")}` });
      reload();
    } catch (e) {
      toast({ title: t("toast_invite_fail"), description: e.message, variant: "destructive" });
    }
  };

  const togglePortalAccess = async (enabled) => {
    const prev = client.portal_access_enabled;
    setClient({ ...client, portal_access_enabled: enabled });
    try {
      await base44.entities.Client.update(id, { portal_access_enabled: enabled });
      await base44.entities.AuditLog.create({ entity_type: "Client", entity_id: id, action: "portal_access", summary: `Acceso al portal ${enabled ? "activado" : "desactivado"}` });
      toast({ title: enabled ? t("toast_portal_on") : t("toast_portal_off") });
    } catch (e) {
      setClient({ ...client, portal_access_enabled: prev });
      toast({ title: t("toast_portal_fail"), variant: "destructive" });
    }
  };

  if (!client) return <InlineMessage />;

  const portalState = client.portal_user_id
    ? (client.portal_access_enabled === false ? t("portal_state_blocked") : t("portal_state_active"))
    : t("portal_state_no_access");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/clients" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1"><ArrowLeft className="w-4 h-4" /> {t("clients_title")}</Link>
          <h1 className="font-heading text-3xl font-bold mt-1">{client.legal_name}</h1>
          <p className="text-sm text-muted-foreground">{client.preferred_name && `(${client.preferred_name}) `}{t("nie_lbl")} {client.nie_number || "—"} · {t("portal_colon")} {portalState}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {client.status !== "archived" && !client.portal_user_id && (
            <Button variant="outline" className="rounded-xl" onClick={invitePortal}><UserPlus className="w-4 h-4 me-1" /> {t("invite_portal")}</Button>
          )}
          {client.status !== "archived" && client.portal_user_id && (
            <label className="flex items-center gap-2 text-sm card-soft px-4 py-2 rounded-xl cursor-pointer">
              <Switch checked={client.portal_access_enabled !== false} onCheckedChange={togglePortalAccess} />
              {t("portal_access")}
            </label>
          )}
          {client.status !== "archived" && (
            <Button variant="outline" className="rounded-xl text-destructive hover:text-destructive" onClick={() => setArchiveOpen(true)}>
              <Archive className="w-4 h-4 me-1" /> {t("archive")}
            </Button>
          )}
          {client.status === "archived" && (
            <Button variant="outline" className="rounded-xl" onClick={() => setExportOpen(true)}>
              <HardDriveDownload className="w-4 h-4 me-1" /> {t("export_archive")}
            </Button>
          )}
          <Button className="rounded-xl" onClick={save} disabled={saving}><Save className="w-4 h-4 me-1" /> {saving ? t("saving") : t("save_changes")}</Button>
        </div>
      </div>
      {client.status === "archived" && (
        <ArchivedClientOptions client={client} onDone={(m) => { toast({ title: m }); reload(); }} />
      )}
      <ClientEditForm client={client} onFieldChange={set} />
      <div className="card-soft p-5">
        <h3 className="font-heading font-semibold mb-4">{t("nav_matters")} ({matters.length})</h3>
        <div className="space-y-2">
          {matters.map((m) => (
            <Link key={m.id} to={`/matters/${m.id}`} className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl hover:bg-secondary text-sm">
              <span className="flex items-center gap-2 min-w-0 break-words"><FolderOpen className="w-4 h-4 text-primary shrink-0" /> {m.matter_number} · {procedureLabel(m.procedure_type, t)}</span>
              <span className="text-xs text-muted-foreground text-end">{stageLabel(m.stage, t)} · {formatDate(m.next_deadline)}</span>
            </Link>
          ))}
          {!matters.length && <p className="text-sm text-muted-foreground">{t("no_matters_yet")}</p>}
        </div>
      </div>
      <ArchiveClientDialog open={archiveOpen} onOpenChange={setArchiveOpen} client={client}
        onDone={(m) => { setArchiveOpen(false); toast({ title: m }); reload(); }} />
      <ExportArchiveDialog open={exportOpen} onOpenChange={setExportOpen} client={client}
        onDone={() => { toast({ title: t("toast_client_exported"), description: t("export_done_msg") }); reload(); }} />
    </div>
  );
}
