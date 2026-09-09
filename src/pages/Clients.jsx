import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useI18n } from "@/lib/i18n";
import { LANGUAGES } from "@/lib/languages";
import ClientSearch from "@/components/clients/ClientSearch";
import ArchiveClientDialog from "@/components/clients/ArchiveClientDialog";
import ExportArchiveDialog from "@/components/clients/ExportArchiveDialog";
import ClientListTable from "@/components/clients/ClientListTable";
import ClientListCards from "@/components/clients/ClientListCards";
import { inputClass as input } from "@/lib/formStyles";
import InlineMessage from "@/components/InlineMessage";

export default function Clients() {
  const { toast } = useToast();
  const { t } = useI18n();
  const [clients, setClients] = useState(null);
  const [archiveTarget, setArchiveTarget] = useState(null);
  const [exportTarget, setExportTarget] = useState(null);
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
        <h1 className="font-heading text-3xl font-bold">{t("clients_title")}</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="rounded-xl"><Plus className="w-4 h-4 me-1" /> {t("new_client")}</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t("new_client")}</DialogTitle></DialogHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input className={input} placeholder={t("ph_legal_name")} value={form.legal_name} onChange={(e) => setForm({ ...form, legal_name: e.target.value })} />
              <input className={input} placeholder={t("ph_phone")} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <input className={input} placeholder={t("ph_email")} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <input className={input} placeholder={t("ph_nationalities")} value={form.nationalities} onChange={(e) => setForm({ ...form, nationalities: e.target.value })} />
              <select className={input} value={form.written_language} onChange={(e) => setForm({ ...form, written_language: e.target.value })}>
                {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{t("writing_prefix")} {l.native}</option>)}
              </select>
              <select className={input} value={form.spoken_language} onChange={(e) => setForm({ ...form, spoken_language: e.target.value })}>
                {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{t("speaking_prefix")} {l.native}</option>)}
              </select>
            </div>
            <Button className="w-full rounded-xl mt-2" onClick={create} disabled={!form.legal_name}>{t("save")}</Button>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">{t("tab_active")}</TabsTrigger>
          <TabsTrigger value="archived">{t("tab_archived")}</TabsTrigger>
        </TabsList>
        <TabsContent value="active" className="space-y-4 mt-4">
          <ClientSearch value={qActive} onChange={setQActive} placeholder={t("search_clients")} />
          <ClientListTable clients={active} onArchive={setArchiveTarget} />
          <ClientListCards clients={active} onArchive={setArchiveTarget} />
        </TabsContent>
        <TabsContent value="archived" className="space-y-4 mt-4">
          <ClientSearch value={qArchived} onChange={setQArchived} placeholder={t("search_archived")} />
          <ClientListTable clients={archived} muted onExport={setExportTarget} />
          <ClientListCards clients={archived} muted onExport={setExportTarget} />
        </TabsContent>
      </Tabs>

      <ArchiveClientDialog open={!!archiveTarget} onOpenChange={(v) => !v && setArchiveTarget(null)}
        client={archiveTarget}
        onDone={(m) => { setArchiveTarget(null); toast({ title: m }); reload(); }} />

      <ExportArchiveDialog open={!!exportTarget} onOpenChange={(v) => !v && setExportTarget(null)}
        client={exportTarget}
        onDone={() => { setExportTarget(null); toast({ title: t("toast_client_exported") }); reload(); }} />
    </div>
  );
}