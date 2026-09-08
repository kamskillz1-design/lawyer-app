import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { LANGUAGES } from "@/lib/languages";
import ClientSearch from "@/components/clients/ClientSearch";
import ArchiveClientDialog from "@/components/clients/ArchiveClientDialog";
import ClientListTable from "@/components/clients/ClientListTable";
import ClientListCards from "@/components/clients/ClientListCards";
import { inputClass as input } from "@/lib/formStyles";
import InlineMessage from "@/components/InlineMessage";

export default function Clients() {
  const { toast } = useToast();
  const [clients, setClients] = useState(null);
  const [archiveTarget, setArchiveTarget] = useState(null);
  const [open, setOpen] = useState(false);
  const [qActive, setQActive] = useState("");
  const [qArchived, setQArchived] = useState("");
  const [form, setForm] = useState({ legal_name: "", phone: "", email: "", written_language: "es", spoken_language: "es", nationalities: "" });

  const reload = () => base44.entities.Client.list().then(setClients);
  useEffect(() => { reload(); }, []);

  const create = async () => {
    await base44.entities.Client.create({
      ...form,
      interface_language: form.written_language,
      engagement_status: "prospect",
      status: "active",
    });
    setOpen(false);
    setForm({ legal_name: "", phone: "", email: "", written_language: "es", spoken_language: "es", nationalities: "" });
    reload();
  };

  if (!clients) return <InlineMessage />;

  const byQuery = (list, q) => list.filter((c) =>
    c.legal_name?.toLowerCase().includes(q.toLowerCase()) ||
    c.email?.toLowerCase().includes(q.toLowerCase()) ||
    c.nie_number?.toLowerCase().includes(q.toLowerCase()));

  const active = byQuery(clients.filter((c) => c.status !== "archived"), qActive);
  const archived = byQuery(clients.filter((c) => c.status === "archived"), qArchived);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-3xl font-bold">Clientes</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="rounded-xl"><Plus className="w-4 h-4 me-1" /> Nuevo cliente</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nuevo cliente</DialogTitle></DialogHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input className={input} placeholder="Nombre legal *" value={form.legal_name} onChange={(e) => setForm({ ...form, legal_name: e.target.value })} />
              <input className={input} placeholder="Teléfono" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <input className={input} placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <input className={input} placeholder="Nacionalidades" value={form.nationalities} onChange={(e) => setForm({ ...form, nationalities: e.target.value })} />
              <select className={input} value={form.written_language} onChange={(e) => setForm({ ...form, written_language: e.target.value })}>
                {LANGUAGES.map((l) => <option key={l.code} value={l.code}>Escritura: {l.native}</option>)}
              </select>
              <select className={input} value={form.spoken_language} onChange={(e) => setForm({ ...form, spoken_language: e.target.value })}>
                {LANGUAGES.map((l) => <option key={l.code} value={l.code}>Habla: {l.native}</option>)}
              </select>
            </div>
            <Button className="w-full rounded-xl mt-2" onClick={create} disabled={!form.legal_name}>Guardar</Button>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">Activos</TabsTrigger>
          <TabsTrigger value="archived">Archivados</TabsTrigger>
        </TabsList>
        <TabsContent value="active" className="space-y-4 mt-4">
          <ClientSearch value={qActive} onChange={setQActive} placeholder="Buscar nombre, email, NIE…" />
          <ClientListTable clients={active} onArchive={setArchiveTarget} />
          <ClientListCards clients={active} onArchive={setArchiveTarget} />
        </TabsContent>
        <TabsContent value="archived" className="space-y-4 mt-4">
          <ClientSearch value={qArchived} onChange={setQArchived} placeholder="Buscar archivados…" />
          <ClientListTable clients={archived} muted />
          <ClientListCards clients={archived} muted />
        </TabsContent>
      </Tabs>

      <ArchiveClientDialog open={!!archiveTarget} onOpenChange={(v) => !v && setArchiveTarget(null)}
        client={archiveTarget}
        onDone={(m) => { setArchiveTarget(null); toast({ title: m }); reload(); }} />
    </div>
  );
}