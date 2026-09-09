import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { APPOINTMENT_TYPES, appointmentLabel } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";
import StatusBadge from "@/components/StatusBadge";
import AppointmentDetailDialog from "@/components/appointments/AppointmentDetailDialog";
import { inputClass as input } from "@/lib/formStyles";
import InlineMessage from "@/components/InlineMessage";

export default function Appointments() {
  const { t } = useI18n();
  const [appointments, setAppointments] = useState(null);
  const [clients, setClients] = useState([]);
  const [adding, setAdding] = useState(false);
  const [detail, setDetail] = useState(null);
  const [form, setForm] = useState({ client_id: "", type: "consultation", date_time: "", location: "Oficina Bilbao", assigned_staff: "", interpreter_required: false });

  const reload = async () => {
    const [appts, cs] = await Promise.all([base44.entities.Appointment.list(), base44.entities.Client.list()]);
    setAppointments(appts.sort((a, b) => (a.date_time || "").localeCompare(b.date_time || "")));
    setClients(cs);
  };
  useEffect(() => { reload(); }, []);

  const add = async () => {
    const c = clients.find((x) => x.id === form.client_id);
    await base44.entities.Appointment.create({
      ...form, client_name: c?.legal_name, client_language: c?.spoken_language || "es",
      status: "scheduled", portal_user_id: c?.portal_user_id || "",
    });
    setAdding(false);
    setForm({ client_id: "", type: "consultation", date_time: "", location: "Oficina Bilbao", assigned_staff: "", interpreter_required: false });
    reload();
  };

  const setStatus = async (a, status) => {
    await base44.entities.Appointment.update(a.id, { status });
    reload();
  };

  if (!appointments) return <InlineMessage />;
  const upcoming = appointments.filter((a) => a.status === "scheduled" || a.status === "confirmed");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-3xl font-bold">{t("appts_title")}</h1>
        <Button className="rounded-xl" onClick={() => setAdding(!adding)}><Plus className="w-4 h-4 me-1" /> {t("new_appt")}</Button>
      </div>

      {adding && (
        <div className="card-soft p-4 grid md:grid-cols-5 gap-3 items-end">
          <select className={input} value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })}>
            <option value="">{t("ph_client_required")}</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.legal_name}</option>)}
          </select>
          <select className={input} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            {APPOINTMENT_TYPES.map((at) => <option key={at.id} value={at.id}>{t(at.key)}</option>)}
          </select>
          <input type="datetime-local" className={input} value={form.date_time} onChange={(e) => setForm({ ...form, date_time: e.target.value })} />
          <input className={input} placeholder={t("ph_location")} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          <input className={input} placeholder={t("ph_assigned_staff")} value={form.assigned_staff} onChange={(e) => setForm({ ...form, assigned_staff: e.target.value })} />
          <label className="flex items-center gap-2 text-sm md:col-span-2">
            <input type="checkbox" checked={form.interpreter_required} onChange={(e) => setForm({ ...form, interpreter_required: e.target.checked })} />
            {t("interpreter_required_lbl")}
          </label>
          <Button className="rounded-lg" onClick={add} disabled={!form.client_id || !form.date_time}>{t("add")}</Button>
        </div>
      )}

      <div className="space-y-2">
        {upcoming.map((a) => (
          <div key={a.id} className="card-soft p-4 flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-52 cursor-pointer" onClick={() => setDetail(a)}>
              <p className="font-medium text-sm">{appointmentLabel(a.type, t)} — {a.client_name}</p>
              <p className="text-xs text-muted-foreground">
                {formatDateTime(a.date_time)} · {a.location}
                {a.assigned_staff ? ` · ${a.assigned_staff}` : ""}
                {a.interpreter_required && <span className="text-primary font-medium"> · {t("interpreter_short")} ({a.client_language})</span>}
              </p>
            </div>
            <StatusBadge value={a.status} label={a.status} />
            <div className="flex flex-wrap gap-1">
              <Button size="sm" variant="outline" className="rounded-lg" onClick={() => setStatus(a, "confirmed")}>{t("appt_confirm")}</Button>
              <Button size="sm" variant="outline" className="rounded-lg" onClick={() => setStatus(a, "completed")}>{t("appt_completed")}</Button>
              <Button size="sm" variant="outline" className="rounded-lg text-red-700" onClick={() => setStatus(a, "cancelled")}>{t("appt_cancel")}</Button>
            </div>
          </div>
        ))}
        {!upcoming.length && <p className="text-sm text-muted-foreground p-4">{t("no_upcoming_appts")}</p>}
      </div>

      {appointments.filter((a) => a.status === "completed").length > 0 && (
        <div>
          <h3 className="font-heading font-semibold mb-2">{t("recent_history")}</h3>
          <div className="space-y-1">
            {appointments.filter((a) => a.status === "completed").slice(-5).reverse().map((a) => (
              <p key={a.id} className="text-sm text-muted-foreground p-2 rounded-lg hover:bg-secondary cursor-pointer" onClick={() => setDetail(a)}>
                {formatDateTime(a.date_time)} — {appointmentLabel(a.type, t)} — {a.client_name} {a.result ? `· ${a.result}` : ""}
              </p>
            ))}
          </div>
        </div>
      )}

      <AppointmentDetailDialog open={!!detail} onOpenChange={(v) => !v && setDetail(null)}
        appointment={detail} onDone={reload} />
    </div>
  );
}