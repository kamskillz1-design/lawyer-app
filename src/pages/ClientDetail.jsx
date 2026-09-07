import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Save, UserPlus, FolderOpen } from "lucide-react";
import { LANGUAGES } from "@/lib/languages";
import { stageLabel } from "@/lib/constants";
import { formatDate } from "@/lib/format";

const input = "w-full h-9 rounded-md border border-input bg-card px-3 text-sm";

const SECTIONS = [
  {
    title: "Identidad",
    fields: [
      { k: "legal_name", l: "Nombre legal" }, { k: "preferred_name", l: "Nombre preferido" },
      { k: "date_of_birth", l: "Fecha nacimiento", type: "date" }, { k: "country_of_birth", l: "País nacimiento" },
      { k: "nationalities", l: "Nacionalidades" },
    ],
  },
  {
    title: "Identidad de extranjería",
    fields: [
      { k: "passport_number", l: "Pasaporte" }, { k: "passport_expiry", l: "Caducidad pasaporte", type: "date" },
      { k: "nie_number", l: "NIE" }, { k: "tie_number", l: "TIE" },
      { k: "permit_type", l: "Tipo de permiso" }, { k: "permit_expiry", l: "Caducidad permiso", type: "date" },
    ],
  },
  {
    title: "Contacto",
    fields: [
      { k: "phone", l: "Teléfono" }, { k: "email", l: "Email" }, { k: "address", l: "Dirección" },
      { k: "preferred_channel", l: "Canal preferido", options: ["phone", "email", "whatsapp", "portal"] },
    ],
  },
  {
    title: "Idiomas y comunicación",
    fields: [
      { k: "interface_language", l: "Idioma del portal", lang: true }, { k: "written_language", l: "Idioma escrito", lang: true },
      { k: "spoken_language", l: "Idioma hablado", lang: true }, { k: "interpreter_language", l: "Idioma del intérprete", lang: true },
      { k: "language_notes", l: "Notas de idioma/accesibilidad", wide: true },
    ],
    booleans: [{ k: "interpreter_required", l: "Requiere intérprete" }, { k: "reads_spanish", l: "Lee español" }, { k: "reads_english", l: "Lee inglés" }],
  },
  {
    title: "Servicio legal",
    fields: [
      { k: "engagement_status", l: "Estado de encargo", options: ["prospect", "consulted", "engaged", "inactive", "archived"] },
      { k: "assigned_lawyer", l: "Letrado asignado" }, { k: "assigned_caseworker", l: "Gestor asignado" },
      { k: "service_package", l: "Paquete de servicio" }, { k: "referral_source", l: "Origen" },
    ],
  },
  {
    title: "Archivo Dropbox (histórico)",
    fields: [
      { k: "legacy_dropbox_path", l: "Ruta Dropbox", wide: true }, { k: "legacy_reference", l: "Referencia histórica" },
      { k: "legacy_notes", l: "Nota de migración", wide: true },
      { k: "retention_review_date", l: "Revisión de retención", type: "date" },
    ],
  },
];

export default function ClientDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const [client, setClient] = useState(null);
  const [matters, setMatters] = useState([]);
  const [saving, setSaving] = useState(false);

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

  if (!client) return <p className="text-muted-foreground">Cargando…</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/clients" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1"><ArrowLeft className="w-4 h-4" /> Clientes</Link>
          <h1 className="font-heading text-3xl font-bold mt-1">{client.legal_name}</h1>
          <p className="text-sm text-muted-foreground">{client.preferred_name && `(${client.preferred_name}) `}NIE {client.nie_number || "—"} · Portal: {client.portal_user_id ? "activo" : "sin acceso"}</p>
        </div>
        <div className="flex gap-2">
          {!client.portal_user_id && (
            <Button variant="outline" className="rounded-xl" onClick={invitePortal}><UserPlus className="w-4 h-4 me-1" /> Invitar al portal</Button>
          )}
          <Button className="rounded-xl" onClick={save} disabled={saving}><Save className="w-4 h-4 me-1" /> {saving ? "Guardando…" : "Guardar cambios"}</Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {SECTIONS.map((sec) => (
          <div key={sec.title} className="card-soft p-5">
            <h3 className="font-heading font-semibold mb-4">{sec.title}</h3>
            <div className="grid grid-cols-2 gap-3">
              {sec.fields.map(({ k, l, type, options, lang, wide }) => (
                <div key={k} className={wide ? "col-span-2" : ""}>
                  <label className="text-xs text-muted-foreground">{l}</label>
                  {options ? (
                    <select className={input} value={client[k] || ""} onChange={(e) => set(k, e.target.value)}>
                      <option value="">—</option>
                      {options.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : lang ? (
                    <select className={input} value={client[k] || ""} onChange={(e) => set(k, e.target.value)}>
                      <option value="">—</option>
                      {LANGUAGES.map((l2) => <option key={l2.code} value={l2.code}>{l2.native}</option>)}
                    </select>
                  ) : (
                    <input type={type || "text"} className={input} value={client[k] || ""} onChange={(e) => set(k, e.target.value)} />
                  )}
                </div>
              ))}
            </div>
            {sec.booleans && (
              <div className="flex flex-wrap gap-4 mt-4">
                {sec.booleans.map(({ k, l }) => (
                  <label key={k} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={!!client[k]} onChange={(e) => set(k, e.target.checked)} /> {l}
                  </label>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="card-soft p-5">
        <h3 className="font-heading font-semibold mb-4">Expedientes ({matters.length})</h3>
        <div className="space-y-2">
          {matters.map((m) => (
            <Link key={m.id} to={`/matters/${m.id}`} className="flex items-center justify-between p-3 rounded-xl hover:bg-secondary text-sm">
              <span className="flex items-center gap-2"><FolderOpen className="w-4 h-4 text-primary" /> {m.matter_number} · {m.procedure_type}</span>
              <span className="text-xs text-muted-foreground">{stageLabel(m.stage)} · {formatDate(m.next_deadline)}</span>
            </Link>
          ))}
          {!matters.length && <p className="text-sm text-muted-foreground">Sin expedientes. Cree uno desde Expedientes.</p>}
        </div>
      </div>
    </div>
  );
}