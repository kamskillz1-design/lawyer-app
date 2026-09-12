import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { me as authMe } from "@/api/auth";
import { useI18n } from "@/lib/i18n";
import { CalendarDays, Receipt, ChevronRight } from "lucide-react";
import { formatDate, formatDateTime, formatMoney } from "@/lib/format";
import { getLanguage } from "@/lib/languages";
import InlineMessage from "@/components/InlineMessage";

export default function PortalHome() {
  const { t, stageText, lang } = useI18n();
  const [data, setData] = useState(null);
  const [noAccess, setNoAccess] = useState(false);

  useEffect(() => {
    const load = async () => {
      const me = await authMe();
      const clients = await base44.entities.Client.filter({ portal_user_id: me.id });
      const client = clients[0];
      if (!client) { setNoAccess(true); return; }
      const [matters, appointments, invoices, items] = await Promise.all([
        base44.entities.Matter.filter({ portal_user_id: me.id }),
        base44.entities.Appointment.filter({ portal_user_id: me.id }),
        base44.entities.Invoice.filter({ portal_user_id: me.id }),
        base44.entities.ChecklistItem.filter({ portal_user_id: me.id }),
      ]);
      setData({ me, client, matters, appointments, invoices, items });
    };
    load().catch(() => setNoAccess(true));
  }, []);

  if (noAccess) return <InlineMessage className="p-6" text={t("no_client_profile")} />;
  if (!data) return <InlineMessage text={t("loading")} />;

  const { client, matters, appointments, invoices, items } = data;
  const pendingAppts = appointments.filter((a) => a.status === "scheduled" || a.status === "confirmed")
    .sort((a, b) => (a.date_time || "").localeCompare(b.date_time || ""));
  const unpaid = invoices.filter((i) => ["sent", "overdue"].includes(i.status));

  return (
    <div className="space-y-6" dir={getLanguage(lang)?.rtl ? "rtl" : "ltr"}>
      <div>
        <h1 className="font-heading text-3xl font-bold">{t("welcome")}, {client.preferred_name || client.legal_name}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t("my_cases")} · {matters.length}</p>
      </div>

      {!matters.length && <p className="text-muted-foreground p-4 card-soft">{t("no_cases")}</p>}

      <div className="space-y-4">
        {matters.map((m) => {
          const missing = items.filter((i) => i.matter_id === m.id && i.status === "needed").length;
          const stage = stageText(m.stage);
          return (
            <div key={m.id} className="card-soft p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">{m.matter_number} · {formatDate(m.opened_date)}</p>
                  <h2 className="font-heading text-xl font-semibold">{m.procedure_type}</h2>
                </div>
                <span className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
                  {stage || m.stage}
                </span>
              </div>
              <p className="mt-3 text-sm"><span className="font-medium">{t("next_step")}:</span> {stage}</p>
              {missing > 0 && (
                <p className="mt-2 text-sm text-amber-700">
                  {missing} {t("checklist_title").toLowerCase()} — {t("cl_needed")} →
                </p>
              )}
              <a href="/portal/documents" className="inline-flex items-center gap-1 text-sm text-primary font-medium mt-3">
                {t("nav_documents")} <ChevronRight className="w-4 h-4" />
              </a>
            </div>
          );
        })}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card-soft p-5">
          <h3 className="font-heading font-semibold flex items-center gap-2 mb-3"><CalendarDays className="w-4 h-4 text-primary" /> {t("appointments")}</h3>
          {pendingAppts.map((a) => (
            <p key={a.id} className="text-sm p-2 rounded-lg hover:bg-secondary">
              {formatDateTime(a.date_time)} — {a.location}
            </p>
          ))}
          {!pendingAppts.length && <p className="text-sm text-muted-foreground">—</p>}
        </div>
        <div className="card-soft p-5">
          <h3 className="font-heading font-semibold flex items-center gap-2 mb-3"><Receipt className="w-4 h-4 text-primary" /> {t("payments")}</h3>
          {unpaid.map((i) => (
            <p key={i.id} className="text-sm p-2 rounded-lg flex justify-between">
              <span>{i.service_description || i.number}</span>
              <span className="font-medium">{formatMoney(i.total)} · {t("outstanding")}</span>
            </p>
          ))}
          {invoices.filter((i) => i.status === "paid").length > 0 && (
            <p className="text-sm text-muted-foreground mt-1">{t("paid")}: {invoices.filter((i) => i.status === "paid").length}</p>
          )}
          {!invoices.length && <p className="text-sm text-muted-foreground">—</p>}
        </div>
      </div>
    </div>
  );
}
