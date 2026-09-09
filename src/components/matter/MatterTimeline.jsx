import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { MessageCircle, ArrowDownLeft, ArrowUpRight, Clock, Gavel } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { sensitivityLabel } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";
import { getLanguage } from "@/lib/languages";
import StatusBadge from "@/components/StatusBadge";

export default function MatterTimeline({ matter }) {
  const { t } = useI18n();
  const [comms, setComms] = useState([]);
  const [audit, setAudit] = useState([]);

  useEffect(() => {
    base44.entities.Communication.filter({ matter_id: matter.id }).then(setComms);
    base44.entities.AuditLog.filter({ entity_id: matter.id }).then(setAudit);
  }, [matter.id]);

  const events = [
    ...comms.map((c) => ({ type: "comm", date: c.created_date, c })),
    ...audit.map((a) => ({ type: "audit", date: a.created_date, a })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="space-y-3">
      {events.map((ev, i) => {
        if (ev.type === "audit") {
          return (
            <div key={i} className="flex flex-wrap items-center gap-x-3 gap-y-1 p-3 rounded-xl bg-secondary/60 text-sm">
              <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="min-w-0 break-words basis-52 grow">{ev.a.summary}</span>
              <span className="text-xs text-muted-foreground sm:ms-auto">{ev.a.actor_name || ""} · {formatDateTime(ev.a.created_date)}</span>
            </div>
          );
        }
        const c = ev.c;
        const rtl = getLanguage(c.original_language || "").rtl;
        const Inbound = c.direction === "inbound";
        return (
          <div key={i} className="card-soft p-4 space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {Inbound ? <ArrowDownLeft className="w-4 h-4 text-sky-600" /> : <ArrowUpRight className="w-4 h-4 text-primary" />}
              {Inbound ? t("comm_client") : t("comm_office")} · {c.channel} · {c.original_language}
              {c.translation_method === "ai" && <StatusBadge value="new" label={t("ai_translation")} />}
              {c.sensitivity !== "routine" && (
                <span className="flex items-center gap-1 text-red-700"><Gavel className="w-3 h-3" /> {sensitivityLabel(c.sensitivity, t)}</span>
              )}
              <StatusBadge value={c.status} />
              <span className="ms-auto">{formatDateTime(c.created_date)}</span>
            </div>
            {c.original_content && (
              <div dir={rtl ? "rtl" : "ltr"}>
                <p className="text-sm">{c.original_content}</p>
                {c.staff_translation && (
                  <p className="text-sm text-muted-foreground mt-2 border-s-2 border-stone-300 ps-3 italic">
                    ES: {c.staff_translation}
                  </p>
                )}
              </div>
            )}
            {c.reply_original && (
              <div className="rounded-xl bg-accent/60 p-3">
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><MessageCircle className="w-3 h-3" /> {t("reply_lbl")}</p>
                <p className="text-sm">{c.reply_translation || c.reply_original}</p>
                {c.approved_by && <p className="text-xs text-muted-foreground mt-2">{t("approved_by_lbl")} {c.approved_by}</p>}
              </div>
            )}
          </div>
        );
      })}
      {!events.length && <p className="text-sm text-muted-foreground">{t("no_activity")}</p>}
    </div>
  );
}