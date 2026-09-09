import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import StatusBadge from "@/components/StatusBadge";
import { useI18n } from "@/lib/i18n";
import { appointmentLabel } from "@/lib/constants";
import { inputClass as input, labelClass as label } from "@/lib/formStyles";

export default function AppointmentDetailDialog({ open, onOpenChange, appointment, onDone }) {
  const { t } = useI18n();
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
      onOpenChange(false); onDone(t("toast_appt_saved"));
    } catch (e) {
      setError(e?.message || t("appt_save_error"));
    } finally { setBusy(false); }
  };

  const setStatus = async (status) => {
    setBusy(true); setError("");
    try {
      const data = { status };
      if (status === "completed") data.result = form.result;
      await base44.entities.Appointment.update(appointment.id, data);
      onOpenChange(false); onDone(status === "completed" ? t("toast_appt_completed") : t("toast_status_updated"));
    } catch (e) {
      setError(e?.message || t("appt_update_error"));
    } finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            {appointmentLabel(appointment.type, t)} — {appointment.client_name}
            <StatusBadge value={s} label={s} />
          </DialogTitle>
          <DialogDescription>
            <Link to={`/clients/${appointment.client_id}`} onClick={() => onOpenChange(false)}
              className="text-primary hover:underline">{t("view_client_record")}</Link>
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <label className={label}>{t("appt_detail_dt")}
            <input type="datetime-local" className={input} value={form.date_time}
              onChange={(e) => setForm({ ...form, date_time: e.target.value })} />
          </label>
          <label className={label}>{t("ph_location")}
            <input className={input} value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </label>
          <label className={label}>{t("ph_assigned_staff")}
            <input className={input} value={form.assigned_staff}
              onChange={(e) => setForm({ ...form, assigned_staff: e.target.value })} />
          </label>
          <label className={label}>{t("appt_detail_result")}
            <textarea className={input + " h-20 py-2"} value={form.result}
              onChange={(e) => setForm({ ...form, result: e.target.value })} />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.interpreter_required}
              onChange={(e) => setForm({ ...form, interpreter_required: e.target.checked })} />
            {t("interpreter_required_lbl")}
          </label>
          {error && <p className="text-sm text-red-600 break-words">{error}</p>}
          <Button className="rounded-xl" onClick={save} disabled={busy}>
            {busy ? t("saving") : t("save_changes")}
          </Button>

          <div className="flex flex-wrap gap-1 border-t border-border pt-3">
            {s === "cancelled" ? (
              <Button size="sm" variant="outline" className="rounded-lg" onClick={() => setStatus("scheduled")} disabled={busy}>
                {t("appt_reactivate")}
              </Button>
            ) : s !== "completed" && (
              <>
                {s === "scheduled" && (
                  <Button size="sm" variant="outline" className="rounded-lg" onClick={() => setStatus("confirmed")} disabled={busy}>
                    {t("appt_confirm")}
                  </Button>
                )}
                <Button size="sm" variant="outline" className="rounded-lg" onClick={() => setStatus("completed")} disabled={busy}>
                  {t("appt_completed")}
                </Button>
                <Button size="sm" variant="outline" className="rounded-lg" onClick={() => setStatus("no_show")} disabled={busy}>
                  {t("appt_no_show")}
                </Button>
                <Button size="sm" variant="outline" className="rounded-lg text-red-700" onClick={() => setStatus("cancelled")} disabled={busy}>
                  {t("appt_cancel")}
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}