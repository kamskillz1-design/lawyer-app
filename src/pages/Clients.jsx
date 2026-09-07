import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search } from "lucide-react";
import { LANGUAGES } from "@/lib/languages";

const input = "w-full h-9 rounded-md border border-input bg-card px-3 text-sm";

export default function Clients() {
  const [clients, setClients] = useState(null);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
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

  if (!clients) return <p className="text-muted-foreground">Cargando…</p>;

  const filtered = clients.filter((c) =>
    c.legal_name?.toLowerCase().includes(q.toLowerCase()) ||
    c.email?.toLowerCase().includes(q.toLowerCase()) ||
    c.nie_number?.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-3xl font-bold">Clientes</h1>
        <div className="flex gap-2">
          <div className="flex items-center gap-2 h-9 px-3 rounded-xl border bg-card">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar nombre, email, NIE…" className="bg-transparent outline-none text-sm w-56" />
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button className="rounded-xl"><Plus className="w-4 h-4 me-1" /> Nuevo cliente</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nuevo cliente</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-3">
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
      </div>

      <div className="card-soft overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-muted-foreground border-b">
              <th className="p-3 text-start">Cliente</th><th className="p-3 text-start">Contacto</th>
              <th className="p-3 text-start">Idiomas</th><th className="p-3 text-start">Encargo</th><th className="p-3 text-start">Portal</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="border-b last:border-0 hover:bg-secondary/50">
                <td className="p-3">
                  <Link to={`/clients/${c.id}`} className="font-medium hover:text-primary">{c.legal_name}</Link>
                  <p className="text-xs text-muted-foreground">NIE: {c.nie_number || "—"}</p>
                </td>
                <td className="p-3 text-xs">{c.phone || "—"}<br />{c.email || "—"}</td>
                <td className="p-3 text-xs">{c.written_language || "es"} / {c.spoken_language || "—"}{c.interpreter_required ? " · intérprete" : ""}</td>
                <td className="p-3 text-xs">{c.engagement_status || "—"}{c.service_package ? ` · ${c.service_package}` : ""}</td>
                <td className="p-3 text-xs">{c.portal_user_id ? "✓ activo" : "—"}</td>
              </tr>
            ))}
            {!filtered.length && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Sin resultados.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}