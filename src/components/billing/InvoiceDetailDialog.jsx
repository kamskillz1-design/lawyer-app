import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import StatusBadge from "@/components/StatusBadge";
import { formatDate, formatMoney, todayISO } from "@/lib/format";
import { invoiceLabel } from "@/lib/constants";
import { inputClass as input, labelClass as label } from "@/lib/formStyles";

export default function InvoiceDetailDialog({ open, onOpenChange, invoice, onDone }) {
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open && invoice) {
      setForm({
        service_description: invoice.service_description || "",
        amount: invoice.amount ?? "",
        government_fees: invoice.government_fees ?? "",
        expenses: invoice.expenses ?? "",
        issue_date: invoice.issue_date || "",
        due_date: invoice.due_date || "",
        notes: invoice.notes || "",
        payment_method: invoice.payment_method || "",
      });
      setError("");
    }
  }, [open, invoice]);

  if (!invoice || !form) return null;
  const editable = ["draft", "sent", "overdue"].includes(invoice.status);
  const total = (Number(form.amount) || 0) + (Number(form.government_fees) || 0) + (Number(form.expenses) || 0);

  const update = async (data, msg) => {
    setBusy(true); setError("");
    try {
      await base44.entities.Invoice.update(invoice.id, data);
      onOpenChange(false); onDone(msg);
    } catch (e) {
      setError(e?.message || "No se pudo actualizar la factura.");
    } finally { setBusy(false); }
  };

  const save = () => update({
    service_description: form.service_description,
    amount: Number(form.amount) || 0,
    government_fees: Number(form.government_fees) || 0,
    expenses: Number(form.expenses) || 0,
    total,
    issue_date: form.issue_date,
    due_date: form.due_date,
    notes: form.notes,
  }, "Factura actualizada");

  const markPaid = () => update({
    status: "paid", paid_date: todayISO(), payment_method: form.payment_method,
  }, "Factura cobrada");

  const voidInvoice = () => {
    if (!window.confirm("¿Anular esta factura?")) return;
    update({ status: "void" }, "Factura anulada");
  };

  const reopen = () => update({ status: "draft", paid_date: "" }, "Factura reabierta");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            {invoice.number} — {formatMoney(total)}
            <StatusBadge value={invoice.status} label={invoiceLabel(invoice.status)} />
          </DialogTitle>
          <DialogDescription>
            {invoice.client_name}{invoice.paid_date ? ` · cobrada el ${formatDate(invoice.paid_date)}` : ""}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          {editable ? (
            <>
              <label className={label}>Concepto
                <input className={input} value={form.service_description}
                  onChange={(e) => setForm({ ...form, service_description: e.target.value })} />
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <label className={label}>Honorarios (€)
                  <input type="number" className={input} value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                </label>
                <label className={label}>Tasas (€)
                  <input type="number" className={input} value={form.government_fees}
                    onChange={(e) => setForm({ ...form, government_fees: e.target.value })} />
                </label>
                <label className={label}>Gastos (€)
                  <input type="number" className={input} value={form.expenses}
                    onChange={(e) => setForm({ ...form, expenses: e.target.value })} />
                </label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <label className={label}>Fecha de emisión
                  <input type="date" className={input} value={form.issue_date}
                    onChange={(e) => setForm({ ...form, issue_date: e.target.value })} />
                </label>
                <label className={label}>Vencimiento
                  <input type="date" className={input} value={form.due_date}
                    onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
                </label>
              </div>
              <label className={label}>Notas
                <input className={input} value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </label>
              <label className={label}>Forma de pago (al cobrar)
                <input className={input} placeholder="p. ej. transferencia" value={form.payment_method}
                  onChange={(e) => setForm({ ...form, payment_method: e.target.value })} />
              </label>
            </>
          ) : (
            <div className="text-sm space-y-1">
              <p className="break-words">{invoice.service_description || "—"}</p>
              <p className="text-muted-foreground">
                Honorarios {formatMoney(invoice.amount)} · Tasas {formatMoney(invoice.government_fees)} · Gastos {formatMoney(invoice.expenses)}
              </p>
              <p className="text-muted-foreground">
                Emitida {formatDate(invoice.issue_date)} · Vence {formatDate(invoice.due_date)}
              </p>
              {invoice.payment_method && <p className="text-muted-foreground">Forma de pago: {invoice.payment_method}</p>}
              {invoice.notes && <p className="text-muted-foreground break-words">Notas: {invoice.notes}</p>}
            </div>
          )}
          {error && <p className="text-sm text-red-600 break-words">{error}</p>}
          {editable ? (
            <div className="flex flex-col sm:flex-row flex-wrap gap-2">
              <Button className="rounded-xl flex-1" onClick={save} disabled={busy}>
                {busy ? "Guardando…" : "Guardar cambios"}
              </Button>
              <Button variant="outline" className="rounded-xl" onClick={markPaid} disabled={busy}>Marcar cobrada</Button>
              <Button variant="outline" className="rounded-xl text-red-700" onClick={voidInvoice} disabled={busy}>Anular</Button>
            </div>
          ) : invoice.status === "void" ? (
            <Button className="rounded-xl" onClick={reopen} disabled={busy}>Reabrir como borrador</Button>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}