import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import StatusBadge from "@/components/StatusBadge";
import { appointmentLabel } from "@/lib/constants";

const input = "w-full h-9 rounded-md border border-input bg-card px-3 text-sm";
const label = "grid gap-1 text-sm text-muted-foreground";

export default function AppointmentDetailDialog({ open, onOpenChange, appointment, onDone }) {
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open && appointment) {
      setForm({
        date_time: appointment.date_time || "",
        location: appointment.location || "",
        assigned_staff: appointment.assigned_staff || "",
        interpreter_required: !!appointment.interpreter_required,
        result: appointment.result || "",
      });
      setError("");
    }
  }, [open, appointment]);

  if (!appointment || !form) return null;
  const s = appointment.status;

  const save = async () => {
    setBusy(true); setError("");
    try {
      await base44.entities.Appointment.update(appointment.id, { ...form });
      onOpenChange(false); onDone("Cita actualizada");
    } catch (e) {
      setError(e?.message || "No se pudo guardar la cita.");
    } finally { setBusy(false); }
  };

  const setStatus = async (status) => {
    setBusy(true); setError("");
    try {
      const data = { status };
      if (status === "completed") data.result = form.result;
      await base44.entities.Appointment.update(appointment.id, data);
      onOpenChange(false); onDone(status === "completed" ? "Cita completada" : "Estado actualizado");
    } catch (e) {
      setError(e?.message || "No se pudo actualizar la cita.");
    } finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            {appointmentLabel(appointment.type)} — {appointment.client_name}
            <StatusBadge value={s} label={s} />
          </DialogTitle>
          <DialogDescription>
            <Link to={`/clients/${appointment.client_id}`} onClick={() => onOpenChange(false)}
              className="text-primary hover:underline">Ver ficha del cliente</Link>
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <label className={label}>Fecha y hora
            <input type="datetime-local" className={input} value={form.date_time}
              onChange={(e) => setForm({ ...form, date_time: e.target.value })} />
          </label>
          <label className={label}>Lugar / enlace
            <input className={input} value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </label>
          <label className={label}>Personal asignado
            <input className={input} value={form.assigned_staff}
              onChange={(e) => setForm({ ...form, assigned_staff: e.target.value })} />
          </label>
          <label className={label}>Resultado / nota
            <textarea className={input + " h-20 py-2"} value={form.result}
              onChange={(e) => setForm({ ...form, result: e.target.value })} />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.interpreter_required}
              onChange={(e) => setForm({ ...form, interpreter_required: e.target.checked })} />
            Requiere intérprete
          </label>
          {error && <p className="text-sm text-red-600 break-words">{error}</p>}
          <Button className="rounded-xl" onClick={save} disabled={busy}>
            {busy ? "Guardando…" : "Guardar cambios"}
          </Button>

          <div className="flex flex-wrap gap-1 border-t border-border pt-3">
            {s === "cancelled" ? (
              <Button size="sm" variant="outline" className="rounded-lg" onClick={() => setStatus("scheduled")} disabled={busy}>
                Reactivar
              </Button>
            ) : s !== "completed" && (
              <>
                {s === "scheduled" && (
                  <Button size="sm" variant="outline" className="rounded-lg" onClick={() => setStatus("confirmed")} disabled={busy}>
                    Confirmar
                  </Button>
                )}
                <Button size="sm" variant="outline" className="rounded-lg" onClick={() => setStatus("completed")} disabled={busy}>
                  Completada
                </Button>
                <Button size="sm" variant="outline" className="rounded-lg" onClick={() => setStatus("no_show")} disabled={busy}>
                  No se presentó
                </Button>
                <Button size="sm" variant="outline" className="rounded-lg text-red-700" onClick={() => setStatus("cancelled")} disabled={busy}>
                  Cancelar
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}