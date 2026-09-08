import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Plus, UserPlus, CalendarPlus } from "lucide-react";
import { LEAD_STATUSES, leadLabel } from "@/lib/constants";
import { LANGUAGES } from "@/lib/languages";
import { formatDate } from "@/lib/format";
import StatusBadge from "@/components/StatusBadge";
import { inputClass as input } from "@/lib/formStyles";
import InlineMessage from "@/components/InlineMessage";

export default function Leads() {
  const { toast } = useToast();
  const [leads, setLeads] = useState(null);
  const [openNew, setOpenNew] = useState(false);
  const [booking, setBooking] = useState(null);
  const [newLead, setNewLead] = useState({ full_name: "", phone: "", email: "", preferred_language: "es", nationality: "", enquiry_category: "", message: "", urgency: "normal", referral_source: "" });
  const [appt, setAppt] = useState({ date_time: "", assigned_staff: "" });

  const reload = () => base44.entities.Lead.list("-created_date").then(setLeads);
  useEffect(() => { reload(); }, []);

  const createLead = async () => {
    await base44.entities.Lead.create({ ...newLead, status: "new", consent_status: "granted", source: "manual" });
    setOpenNew(false);
    setNewLead({ full_name: "", phone: "", email: "", preferred_language: "es", nationality: "", enquiry_category: "", message: "", urgency: "normal", referral_source: "" });
    reload();
    toast({ title: "Consulta creada" });
  };

  const setStatus = async (lead, status) => {
    await base44.entities.Lead.update(lead.id, { status });
    reload();
  };

  const convert = async (lead) => {
    const client = await base44.entities.Client.create({
      legal_name: lead.full_name,
      preferred_name: lead.preferred_name || "",
      phone: lead.phone || "",
      email: lead.email || "",
      interface_language: lead.preferred_language || "es",
      written_language: lead.preferred_language || "es",
      spoken_language: lead.preferred_language || "es",
      nationalities: lead.nationality || "",
      referral_source: lead.referral_source || "",
      engagement_status: "prospect",
      status: "active",
    });
    await base44.entities.Lead.update(lead.id, { status: "converted", converted_client_id: client.id });
    await base44.entities.AuditLog.create({ entity_type: "Lead", entity_id: lead.id, action: "converted", summary: `Convertido en cliente: ${lead.full_name}` });
    reload();
    toast({ title: "Cliente creado", description: "Ya puede abrirle un expediente en Clientes → su ficha." });
  };

  const bookAppointment = async () => {
    await base44.entities.Appointment.create({
      client_id: booking.id, client_name: booking.full_name, type: "consultation",
      date_time: appt.date_time, assigned_staff: appt.assigned_staff || "Recepción",
      client_language: booking.preferred_language || "es", status: "scheduled",
    });
    await base44.entities.Lead.update(booking.id, { status: "appointment_booked" });
    setBooking(null);
    reload();
    toast({ title: "Cita reservada" });
  };

  if (!leads) return <InlineMessage />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-3xl font-bold">Consultas</h1>
        <Dialog open={openNew} onOpenChange={setOpenNew}>
          <DialogTrigger asChild><Button className="rounded-xl"><Plus className="w-4 h-4 me-1" /> Nueva consulta</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nueva consulta</DialogTitle></DialogHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input className={input} placeholder="Nombre completo *" value={newLead.full_name} onChange={(e) => setNewLead({ ...newLead, full_name: e.target.value })} />
              <input className={input} placeholder="Teléfono" value={newLead.phone} onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })} />
              <input className={input} placeholder="Email" value={newLead.email} onChange={(e) => setNewLead({ ...newLead, email: e.target.value })} />
              <select className={input} value={newLead.preferred_language} onChange={(e) => setNewLead({ ...newLead, preferred_language: e.target.value })}>
                {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.native}</option>)}
              </select>
              <input className={input} placeholder="Nacionalidad" value={newLead.nationality} onChange={(e) => setNewLead({ ...newLead, nationality: e.target.value })} />
              <select className={input} value={newLead.urgency} onChange={(e) => setNewLead({ ...newLead, urgency: e.target.value })}>
                <option value="low">Urgencia baja</option><option value="normal">Normal</option>
                <option value="high">Alta</option><option value="urgent">Urgente</option>
              </select>
              <input className={input} placeholder="Categoría (p. ej. renovación)" value={newLead.enquiry_category} onChange={(e) => setNewLead({ ...newLead, enquiry_category: e.target.value })} />
              <input className={input} placeholder="Origen / referido" value={newLead.referral_source} onChange={(e) => setNewLead({ ...newLead, referral_source: e.target.value })} />
              <textarea className="sm:col-span-2 min-h-24 rounded-md border border-input bg-card px-3 py-2 text-sm" placeholder="Mensaje inicial" value={newLead.message} onChange={(e) => setNewLead({ ...newLead, message: e.target.value })} />
            </div>
            <Button className="w-full rounded-xl mt-2" onClick={createLead} disabled={!newLead.full_name}>Guardar</Button>
          </DialogContent>
        </Dialog>
      </div>

      <div className="card-soft hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-start text-xs text-muted-foreground border-b">
              <th className="p-3 text-start">Nombre</th><th className="p-3 text-start">Idioma</th><th className="p-3 text-start">Categoría</th>
              <th className="p-3 text-start">Estado</th><th className="p-3 text-start">Seguimiento</th><th className="p-3 text-start">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((l) => (
              <tr key={l.id} className="border-b last:border-0 hover:bg-secondary/50">
                <td className="p-3">
                  <p className="font-medium">{l.full_name}</p>
                  <p className="text-xs text-muted-foreground">{l.phone || l.email || "—"} · {l.source}</p>
                </td>
                <td className="p-3">{l.preferred_language}</td>
                <td className="p-3">{l.enquiry_category || "—"}</td>
                <td className="p-3">
                  <select value={l.status} onChange={(e) => setStatus(l, e.target.value)} className="h-8 rounded-md border border-input bg-card px-2 text-xs">
                    {LEAD_STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                </td>
                <td className="p-3 text-xs">{l.follow_up_date ? formatDate(l.follow_up_date) : "—"}</td>
                <td className="p-3">
                  <div className="flex gap-1">
                    {l.status !== "converted" && (
                      <Button size="sm" variant="outline" className="rounded-lg" onClick={() => convert(l)}>
                        <UserPlus className="w-3.5 h-3.5 me-1" /> Convertir
                      </Button>
                    )}
                    {["new", "awaiting_response", "appointment_proposed"].includes(l.status) && (
                      <Button size="sm" variant="outline" className="rounded-lg" onClick={() => setBooking(l)}>
                        <CalendarPlus className="w-3.5 h-3.5 me-1" /> Cita
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!leads.length && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Sin consultas todavía.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-2">
        {leads.map((l) => (
          <div key={l.id} className="card-soft p-4 space-y-2">
            <p className="font-medium break-words">{l.full_name}</p>
            <p className="text-xs text-muted-foreground break-words">{l.phone || l.email || "—"} · {l.source} · {l.preferred_language} · {l.enquiry_category || "—"}</p>
            <p className="text-xs text-muted-foreground">{l.follow_up_date ? formatDate(l.follow_up_date) : "—"}</p>
            <select value={l.status} onChange={(e) => setStatus(l, e.target.value)} className="h-9 w-full rounded-md border border-input bg-card px-2 text-xs">
              {LEAD_STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
            <div className="flex flex-wrap gap-1">
              {l.status !== "converted" && (
                <Button size="sm" variant="outline" className="rounded-lg" onClick={() => convert(l)}>
                  <UserPlus className="w-3.5 h-3.5 me-1" /> Convertir
                </Button>
              )}
              {["new", "awaiting_response", "appointment_proposed"].includes(l.status) && (
                <Button size="sm" variant="outline" className="rounded-lg" onClick={() => setBooking(l)}>
                  <CalendarPlus className="w-3.5 h-3.5 me-1" /> Cita
                </Button>
              )}
            </div>
          </div>
        ))}
        {!leads.length && <p className="text-sm text-muted-foreground p-4">Sin consultas todavía.</p>}
      </div>

      <Dialog open={!!booking} onOpenChange={() => setBooking(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reservar consulta — {booking?.full_name}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <input type="datetime-local" className={input} value={appt.date_time} onChange={(e) => setAppt({ ...appt, date_time: e.target.value })} />
            <input className={input} placeholder="Persona asignada" value={appt.assigned_staff} onChange={(e) => setAppt({ ...appt, assigned_staff: e.target.value })} />
            <Button className="w-full rounded-xl" onClick={bookAppointment} disabled={!appt.date_time}>Reservar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}