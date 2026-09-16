import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Inbox, AlarmClock, MessageCircle, Receipt, Users, FolderOpen, CheckSquare, Zap } from "lucide-react";
import { sensitivityLabel, leadLabel, procedureLabel } from "@/lib/constants";
import { formatDate, daysUntil, todayISO } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import useTaskTitles from "@/hooks/useTaskTitles";
import StatusBadge from "@/components/StatusBadge";
import CollapsibleSection from "@/components/dashboard/CollapsibleSection";
import InlineMessage from "@/components/InlineMessage";

export default function Home() {
  const { t } = useI18n();
  const [data, setData] = useState(null);
  const today = todayISO();
  const titles = useTaskTitles(data ? data.tasks : null);

  useEffect(() => {
    const load = async () => {
      const [tasks, matters, leads, comms, invoices, clients] = await Promise.all([
        base44.entities.Task.list(),
        base44.entities.Matter.list(),
        base44.entities.Lead.list(),
        base44.entities.Communication.list(),
        base44.entities.Invoice.list(),
        base44.entities.Client.list(),
      ]);
      setData({ tasks, matters, leads, comms, invoices, clients });
    };
    load();
  }, []);

  if (!data) return <InlineMessage className="p-8" />;

  const openTasks = data.tasks.filter((tk) => tk.status !== "done");
  const overdue = openTasks.filter((tk) => tk.due_date && tk.due_date < today)
    .sort((a, b) => a.due_date.localeCompare(b.due_date));
  const activeStages = ["new_enquiry", "consultation_pending", "consultation_completed", "awaiting_engagement", "open_documents_requested",
    "documents_under_review", "preparation_in_progress", "awaiting_lawyer_approval", "ready_to_submit", "submitted",
    "awaiting_decision", "further_info_requested", "resolution_received", "post_resolution"];
  const activeMatters = data.matters.filter((m) => activeStages.includes(m.stage));
  const upcomingDeadlines = activeMatters.filter((m) => {
    const d = daysUntil(m.next_deadline);
    return d != null && d <= 30;
  }).sort((a, b) => (a.next_deadline || "").localeCompare(b.next_deadline || ""));
  const newLeads = data.leads.filter((l) => ["new", "awaiting_response"].includes(l.status));
  const autoReminders = openTasks.filter((tk) => tk.source === "automation");
  const pendingMsgs = data.comms.filter((c) => ["received", "translation_pending", "pending_review", "lawyer_pending"].includes(c.status));
  const unpaid = data.invoices.filter((i) => ["sent", "overdue"].includes(i.status));

  const stats = [
    { icon: Users, label: t("stat_active_clients"), value: data.clients.filter((c) => c.status === "active").length, to: "/clients" },
    { icon: FolderOpen, label: t("stat_active_matters"), value: activeMatters.length, to: "/matters" },
    { icon: CheckSquare, label: t("stat_open_tasks"), value: openTasks.length, to: "/tasks" },
    { icon: Inbox, label: t("stat_new_leads"), value: newLeads.length, to: "/leads" },
  ];

  return (
    <div className="space-y-6 min-w-0">
      <div>
        <h1 className="font-heading text-3xl font-bold">{t("dash_title")}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t("dash_attention")} · {formatDate(new Date().toISOString())}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map(({ icon: Icon, label, value, to }) => (
          <Link key={label} to={to}>
            <Card className="card-soft hover:shadow-md transition-shadow min-w-0">
              <CardContent className="p-4 sm:p-5 flex items-center gap-3 sm:gap-4 min-w-0">
                <div className="w-10 h-10 shrink-0 rounded-xl bg-accent flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-heading font-bold">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <CollapsibleSection to="/tasks" icon={AlarmClock} iconClass="text-red-600" title={t("dash_overdue")} count={overdue.length} contentClass="space-y-2">
          {overdue.slice(0, 5).map((tk) => (
            <Link key={tk.id} to={tk.matter_id ? `/matters/${tk.matter_id}` : "/tasks"} className="block p-3 rounded-xl hover:bg-secondary text-sm min-w-0">
              <p className="font-medium break-words">{titles[tk.id]?.title ?? tk.title}</p>
              <p className="text-xs text-red-600 break-words">{tk.matter_number} · {t("was_due")} {formatDate(tk.due_date)} · {tk.owner || t("unassigned")}</p>
            </Link>
          ))}
          {!overdue.length && <p className="text-sm text-muted-foreground p-3">{t("dash_no_overdue")}</p>}
        </CollapsibleSection>

        <CollapsibleSection to="/matters" icon={AlarmClock} iconClass="text-amber-600" title={t("dash_deadlines")} count={upcomingDeadlines.length} contentClass="space-y-2">
          {upcomingDeadlines.slice(0, 5).map((m) => (
            <Link key={m.id} to={`/matters/${m.id}`} className="block p-3 rounded-xl hover:bg-secondary text-sm min-w-0">
              <p className="font-medium break-words">{m.matter_number} · {procedureLabel(m.procedure_type, t)}</p>
              <p className="text-xs text-muted-foreground break-words">{m.client_name} · {formatDate(m.next_deadline)} ({daysUntil(m.next_deadline)} {t("days_unit")})</p>
            </Link>
          ))}
          {!upcomingDeadlines.length && <p className="text-sm text-muted-foreground p-3">{t("dash_no_deadlines")}</p>}
        </CollapsibleSection>

        <CollapsibleSection to="/messages" icon={MessageCircle} iconClass="text-sky-600" title={t("dash_pending_msgs")} count={pendingMsgs.length} contentClass="space-y-2">
          {pendingMsgs.slice(0, 5).map((c) => (
            <Link key={c.id} to="/messages" className="block p-3 rounded-xl hover:bg-secondary text-sm min-w-0">
              <p className="font-medium break-words">{c.client_name} · {c.original_language}</p>
              <p className="text-xs text-muted-foreground truncate">{c.original_content}</p>
              <p className="text-xs flex flex-wrap items-center gap-1">{sensitivityLabel(c.sensitivity, t)} · <StatusBadge value={c.status} /></p>
            </Link>
          ))}
          {!pendingMsgs.length && <p className="text-sm text-muted-foreground p-3">{t("dash_no_msgs")}</p>}
        </CollapsibleSection>

        <CollapsibleSection to="/billing" icon={Receipt} iconClass="text-amber-600" title={t("dash_unpaid")} count={unpaid.length} contentClass="space-y-2">
          {unpaid.slice(0, 5).map((i) => (
            <Link key={i.id} to="/billing" className="block p-3 rounded-xl hover:bg-secondary text-sm min-w-0">
              <p className="font-medium break-words">{i.number} · {i.client_name}</p>
              <p className="text-xs text-muted-foreground break-words">{i.total?.toFixed(2) ?? "0"} € · {t("due_word")} {formatDate(i.due_date)}</p>
            </Link>
          ))}
          {!unpaid.length && <p className="text-sm text-muted-foreground p-3">{t("dash_no_unpaid")}</p>}
        </CollapsibleSection>

        <CollapsibleSection to="/leads" icon={Inbox} iconClass="text-primary" title={t("dash_open_leads")} count={newLeads.length} className="md:col-span-2" contentClass="grid md:grid-cols-2 gap-2">
          {newLeads.slice(0, 6).map((l) => (
            <Link key={l.id} to="/leads" className="block p-3 rounded-xl hover:bg-secondary text-sm min-w-0">
              <p className="font-medium break-words">{l.full_name} · {l.preferred_language || "—"}</p>
              <p className="text-xs text-muted-foreground truncate">{l.enquiry_category || l.message}</p>
              <p className="text-xs mt-1"><StatusBadge value={l.status} label={leadLabel(l.status, t)} /></p>
            </Link>
          ))}
          {!newLeads.length && <p className="text-sm text-muted-foreground p-3">{t("dash_no_leads")}</p>}
        </CollapsibleSection>

        <CollapsibleSection to="/tasks" icon={Zap} iconClass="text-primary" title={t("dash_auto")} count={autoReminders.length}
          className="md:col-span-2 border-l-4 border-l-primary/30" contentClass="grid md:grid-cols-2 gap-2"
          titleExtra={<span className="text-xs text-muted-foreground font-normal w-full sm:w-auto">{t("dash_auto_note")}</span>}>
          {autoReminders.slice(0, 6).map((tk) => (
            <Link key={tk.id} to={tk.matter_id ? `/matters/${tk.matter_id}` : "/tasks"} className="block p-3 rounded-xl hover:bg-secondary text-sm min-w-0">
              <p className="font-medium flex items-center gap-1.5 min-w-0">
                <Zap className="w-3 h-3 text-primary shrink-0" /> <span className="min-w-0 break-words">{titles[tk.id]?.title ?? tk.title}</span>
              </p>
              <p className="text-xs text-muted-foreground break-words">{tk.owner || t("unassigned")} · {formatDate(tk.due_date)} · {tk.priority}</p>
            </Link>
          ))}
          {!autoReminders.length && <p className="text-sm text-muted-foreground p-3">{t("dash_no_auto")}</p>}
        </CollapsibleSection>
      </div>
    </div>
  );
}
