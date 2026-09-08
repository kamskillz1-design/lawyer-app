import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Save, UserPlus, FolderOpen, Archive, HardDriveDownload } from "lucide-react";
import ExportArchiveDialog from "@/components/clients/ExportArchiveDialog";
import ArchiveClientDialog from "@/components/clients/ArchiveClientDialog";
import ArchivedClientOptions from "@/components/clients/ArchivedClientOptions";
import { stageLabel } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import ClientEditForm from "@/components/clients/ClientEditForm";
import InlineMessage from "@/components/InlineMessage";

export default function ClientDetail() {
  const { id } = useParams();
  const { toast } = useToast();
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
      toast({ title: "Cliente guardado" });
    } finally {
      setSaving(false);
    }
  };

  const invitePortal = async () => {
    try {
      if (!client.email) throw new Error("El cliente necesita un email");
      await base44.users.inviteUser(client.email, "user");
      const users = await base44.entities.User.filter({ email: client.email });
      const userId = users?.[0]?.id;
      if (!userId) throw new Error("No se encontró el usuario invitado");
      await base44.entities.Client.update(id, { portal_user_id: userId, portal_email: client.email });
      await base44.entities.AuditLog.create({ entity_type: "Client", entity_id: id, action: "portal_invite", summary: `Invitado al portal: ${client.email}` });
      toast({ title: "Invitación enviada", description: `${client.email} ya puede acceder al portal de clientes.` });
      reload();
    } catch (e) {
      toast({ title: "No se pudo invitar", description: e.message, variant: "destructive" });
    }
  };

  const togglePortalAccess = async (enabled) => {
    const prev = client.portal_access_enabled;
    setClient({ ...client, portal_access_enabled: enabled });
    try {
      await base44.entities.Client.update(id, { portal_access_enabled: enabled });
      await base44.entities.AuditLog.create({ entity_type: "Client", entity_id: id, action: "portal_access", summary: `Acceso al portal ${enabled ? "activado" : "desactivado"}` });
      toast({ title: enabled ? "Acceso al portal activado" : "Acceso al portal desactivado" });
    } catch (e) {
      setClient({ ...client, portal_access_enabled: prev });
      toast({ title: "No se pudo guardar el cambio", variant: "destructive" });
    }
  };

  if (!client) return <InlineMessage />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/clients" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1"><ArrowLeft className="w-4 h-4" /> Clientes</Link>
          <h1 className="font-heading text-3xl font-bold mt-1">{client.legal_name}</h1>
          <p className="text-sm text-muted-foreground">{client.preferred_name && `(${client.preferred_name}) `}NIE {client.nie_number || "—"} · Portal: {client.portal_user_id ? (client.portal_access_enabled === false ? "bloqueado" : "activo") : "sin acceso"}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {client.status !== "archived" && !client.portal_user_id && (
            <Button variant="outline" className="rounded-xl" onClick={invitePortal}><UserPlus className="w-4 h-4 me-1" /> Invitar al portal</Button>
          )}
          {client.status !== "archived" && client.portal_user_id && (
            <label className="flex items-center gap-2 text-sm card-soft px-4 py-2 rounded-xl cursor-pointer">
              <Switch checked={client.portal_access_enabled !== false} onCheckedChange={togglePortalAccess} />
              Acceso al portal
            </label>
          )}
          {client.status !== "archived" && (
            <Button variant="outline" className="rounded-xl text-destructive hover:text-destructive" onClick={() => setArchiveOpen(true)}>
              <Archive className="w-4 h-4 me-1" /> Archivar
            </Button>
          )}
          {client.status === "archived" && (
            <Button variant="outline" className="rounded-xl" onClick={() => setExportOpen(true)}>
              <HardDriveDownload className="w-4 h-4 me-1" /> Exportar al archivo
            </Button>
          )}
          <Button className="rounded-xl" onClick={save} disabled={saving}><Save className="w-4 h-4 me-1" /> {saving ? "Guardando…" : "Guardar cambios"}</Button>
        </div>
      </div>

      {client.status === "archived" && (
        <ArchivedClientOptions client={client} onDone={(m) => { toast({ title: m }); reload(); }} />
      )}

      <ClientEditForm client={client} onFieldChange={set} />

      <div className="card-soft p-5">
        <h3 className="font-heading font-semibold mb-4">Expedientes ({matters.length})</h3>
        <div className="space-y-2">
          {matters.map((m) => (
            <Link key={m.id} to={`/matters/${m.id}`} className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl hover:bg-secondary text-sm">
              <span className="flex items-center gap-2 min-w-0 break-words"><FolderOpen className="w-4 h-4 text-primary shrink-0" /> {m.matter_number} · {m.procedure_type}</span>
              <span className="text-xs text-muted-foreground text-end">{stageLabel(m.stage)} · {formatDate(m.next_deadline)}</span>
            </Link>
          ))}
          {!matters.length && <p className="text-sm text-muted-foreground">Sin expedientes. Cree uno desde Expedientes.</p>}
        </div>
      </div>

      <ArchiveClientDialog open={archiveOpen} onOpenChange={setArchiveOpen} client={client}
        onDone={(m) => { setArchiveOpen(false); toast({ title: m }); reload(); }} />

      <ExportArchiveDialog open={exportOpen} onOpenChange={setExportOpen} client={client}
        onDone={() => { toast({ title: "Cliente exportado a Dropbox", description: "Los datos se han purgado de la aplicación." }); reload(); }} />
    </div>
  );
}