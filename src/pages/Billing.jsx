import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Plus, CheckCircle2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { invoiceLabel } from "@/lib/constants";
import { formatDate, formatMoney, todayISO } from "@/lib/format";
import StatusBadge from "@/components/StatusBadge";
import InvoiceDetailDialog from "@/components/billing/InvoiceDetailDialog";
import { inputClass as input } from "@/lib/formStyles";
import InlineMessage from "@/components/InlineMessage";

export default function Billing() {
  const { toast } = useToast();
  const { t } = useI18n();
  const [invoices, setInvoices] = useState(null);
  const [clients, setClients] = useState([]);
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [form, setForm] = useState({ client_id: "", service_description: "", amount: "", government_fees: "", expenses: "", issue_date: "", due_date: "" });

  const reload = async () => {
    const [inv, cs] = await Promise.all([base44.entities.Invoice.list("-created_date"), base44.entities.Client.list()]);
    setInvoices(inv);
    setClients(cs);
  };
  useEffect(() => { reload(); }, []);

  const create = async () => {
    const c = clients.find((x) => x.id === form.client_id);
    const total = (Number(form.amount) || 0) + (Number(form.government_fees) || 0) + (Number(form.expenses) || 0);
    await base44.entities.Invoice.create({
      number: `F-${new Date().getFullYear()}-${String((invoices?.length || 0) + 1).padStart(3, "0")}`,
      client_id: c.id, client_name: c.legal_name, portal_user_id: c.portal_user_id || "",
      service_description: form.service_description,
      amount: Number(form.amount) || 0, government_fees: Number(form.government_fees) || 0,
      expenses: Number(form.expenses) || 0, total,
      status: "sent", issue_date: form.issue_date || todayISO(), due_date: form.due_date || "",
    });
    setOpen(false);
    setForm({ client_id: "", service_description: "", amount: "", government_fees: "", expenses: "", issue_date: "", due_date: "" });
    reload();
    toast({ title: t("toast_invoice_created") });
  };

  const setStatus = async (inv, status) => {
    await base44.entities.Invoice.update(inv.id, { status, paid_date: status === "paid" ? todayISO() : "" });
    reload();
  };

  if (!invoices) return <InlineMessage />;

  const outstandingTotal = invoices.filter((i) => ["sent", "overdue"].includes(i.status)).reduce((s, i) => s + (i.total || 0), 0);
  const paidTotal = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + (i.total || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-3xl font-bold">{t("billing_title")}</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="rounded-xl"><Plus className="w-4 h-4 me-1" /> {t("new_invoice")}</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t("new_invoice")}</DialogTitle></DialogHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select className={input} value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })}>
                <option value="">{t("ph_client_required")}</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.legal_name}</option>)}
              </select>
              <input className={input} placeholder={t("ph_fees")} type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              <input className={input} placeholder={t("ph_gov_fees")} type="number" value={form.government_fees} onChange={(e) => setForm({ ...form, government_fees: e.target.value })} />
              <input className={input} placeholder={t("ph_expenses")} type="number" value={form.expenses} onChange={(e) => setForm({ ...form, expenses: e.target.value })} />
              <input type="date" className={input} value={form.issue_date} onChange={(e) => setForm({ ...form, issue_date: e.target.value })} />
              <input type="date" className={input} value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
              <input className={input + " sm:col-span-2"} placeholder={t("ph_concept")} value={form.service_description} onChange={(e) => setForm({ ...form, service_description: e.target.value })} />
            </div>
            <Button className="w-full rounded-xl mt-2" onClick={create} disabled={!form.client_id || !form.amount}>{t("issue_btn")}</Button>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="card-soft p-5">
          <p className="text-xs text-muted-foreground">{t("outstanding_lbl")}</p>
          <p className="font-heading text-2xl font-bold text-red-700">{formatMoney(outstandingTotal)}</p>
        </div>
        <div className="card-soft p-5">
          <p className="text-xs text-muted-foreground">{t("collected_lbl")}</p>
          <p className="font-heading text-2xl font-bold text-emerald-700">{formatMoney(paidTotal)}</p>
        </div>
      </div>

      <div className="card-soft hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-muted-foreground border-b">
              <th className="p-3 text-start">{t("th_invoice")}</th><th className="p-3 text-start">{t("clients_title")}</th><th className="p-3 text-start">{t("th_concept")}</th>
              <th className="p-3 text-start">{t("th_total")}</th><th className="p-3 text-start">{t("th_due")}</th><th className="p-3 text-start">{t("th_status")}</th><th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id} className="border-b last:border-0 hover:bg-secondary/50 cursor-pointer" onClick={() => setDetail(inv)}>
                <td className="p-3 font-medium">{inv.number}</td>
                <td className="p-3">{inv.client_name}</td>
                <td className="p-3 text-xs">{inv.service_description || "—"}</td>
                <td className="p-3">{formatMoney(inv.total)}</td>
                <td className="p-3 text-xs">{formatDate(inv.due_date)}</td>
                <td className="p-3"><StatusBadge value={inv.status} label={invoiceLabel(inv.status, t)} /></td>
                <td className="p-3">
                  {inv.status !== "paid" && (
                    <Button size="sm" variant="outline" className="rounded-lg" onClick={(e) => { e.stopPropagation(); setStatus(inv, "paid"); }}>
                      <CheckCircle2 className="w-3.5 h-3.5 me-1" /> {t("paid_btn")}
                    </Button>
                  )}
                </td>
              </tr>
            ))}
            {!invoices.length && <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">{t("no_invoices")}</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-2">
        {invoices.map((inv) => (
          <div key={inv.id} className="card-soft p-4 space-y-1 cursor-pointer" onClick={() => setDetail(inv)}>
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium">{inv.number}</p>
              <StatusBadge value={inv.status} label={invoiceLabel(inv.status, t)} />
            </div>
            <p className="text-sm break-words">{inv.client_name}</p>
            <p className="text-xs text-muted-foreground break-words">{inv.service_description || "—"}</p>
            <p className="text-sm font-medium">{formatMoney(inv.total)} · {t("due_word")} {formatDate(inv.due_date)}</p>
            {inv.status !== "paid" && (
              <Button size="sm" variant="outline" className="rounded-lg" onClick={(e) => { e.stopPropagation(); setStatus(inv, "paid"); }}>
                <CheckCircle2 className="w-3.5 h-3.5 me-1" /> {t("paid_btn")}
              </Button>
            )}
          </div>
        ))}
        {!invoices.length && <p className="text-sm text-muted-foreground p-4">{t("no_invoices")}</p>}
      </div>

      <InvoiceDetailDialog open={!!detail} onOpenChange={(v) => !v && setDetail(null)}
        invoice={detail} onDone={(msg) => { reload(); toast({ title: msg }); }} />
    </div>
  );
}