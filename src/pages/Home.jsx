import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Inbox, AlarmClock, MessageCircle, Receipt, Users, FolderOpen, CheckSquare, Zap } from "lucide-react";
import { stageLabel, leadLabel, sensitivityLabel } from "@/lib/constants";
import { formatDate, daysUntil } from "@/lib/format";
import { todayISO } from "@/lib/format";
import StatusBadge from "@/components/StatusBadge";

export default function Home() {
  const [data, setData] = useState(null);
  const today = todayISO();

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

  if (!data) return <p className="text-muted-foreground p-8">Cargando panel…</p>;

  const openTasks = data.tasks.filter((t) => t.status !== "done");
  const overdue = openTasks.filter((t) => t.due_date && t.due_date < today)
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
  const autoReminders = openTasks.filter((t) => t.source === "automation");
  const pendingMsgs = data.comms.filter((c) => ["received", "translation_pending", "pending_review", "lawyer_pending"].includes(c.status));
  const unpaid = data.invoices.filter((i) => ["sent", "overdue"].includes(i.status));

  const stats = [
    { icon: Users, label: "Clientes activos", value: data.clients.filter((c) => c.status === "active").length, to: "/clients" },
    { icon: FolderOpen, label: "Expedientes activos", value: activeMatters.length, to: "/matters" },
    { icon: CheckSquare, label: "Tareas abiertas", value: openTasks.length, to: "/tasks" },
    { icon: Inbox, label: "Consultas nuevas", value: newLeads.length, to: "/leads" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold">Panel del despacho</h1>
        <p className="text-muted-foreground text-sm mt-1">Atención requerida hoy · {formatDate(new Date().toISOString())}</p>
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
        <Card className="card-soft">
          <CardHeader className="pb-2"><CardTitle className="flex flex-wrap items-center gap-2 text-base min-w-0"><AlarmClock className="w-4 h-4 text-red-600 shrink-0" /> Tareas vencidas ({overdue.length})</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {overdue.slice(0, 5).map((t) => (
              <Link key={t.id} to={`/matters/${t.matter_id}`} className="block p-3 rounded-xl hover:bg-secondary text-sm">
                <p className="font-medium break-words">{t.title}</p>
                <p className="text-xs text-red-600 break-words">{t.matter_number} · vencía {formatDate(t.due_date)} · {t.owner || "sin asignar"}</p>
              </Link>
            ))}
            {!overdue.length && <p className="text-sm text-muted-foreground p-3">Sin tareas vencidas 🎉</p>}
          </CardContent>
        </Card>

        <Card className="card-soft">
          <CardHeader className="pb-2"><CardTitle className="flex flex-wrap items-center gap-2 text-base min-w-0"><AlarmClock className="w-4 h-4 text-amber-600 shrink-0" /> Plazos próximos 30 días ({upcomingDeadlines.length})</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {upcomingDeadlines.slice(0, 5).map((m) => (
              <Link key={m.id} to={`/matters/${m.id}`} className="block p-3 rounded-xl hover:bg-secondary text-sm">
                <p className="font-medium break-words">{m.matter_number} · {m.procedure_type}</p>
                <p className="text-xs text-muted-foreground break-words">{m.client_name} · {formatDate(m.next_deadline)} ({daysUntil(m.next_deadline)} días)</p>
              </Link>
            ))}
            {!upcomingDeadlines.length && <p className="text-sm text-muted-foreground p-3">Sin plazos en 30 días.</p>}
          </CardContent>
        </Card>

        <Card className="card-soft">
          <CardHeader className="pb-2"><CardTitle className="flex flex-wrap items-center gap-2 text-base min-w-0"><MessageCircle className="w-4 h-4 text-sky-600 shrink-0" /> Mensajes pendientes ({pendingMsgs.length})</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {pendingMsgs.slice(0, 5).map((c) => (
              <Link key={c.id} to="/messages" className="block p-3 rounded-xl hover:bg-secondary text-sm">
                <p className="font-medium break-words">{c.client_name} · {c.original_language}</p>
                <p className="text-xs text-muted-foreground truncate">{c.original_content}</p>
                <p className="text-xs">{sensitivityLabel(c.sensitivity)} · <StatusBadge value={c.status} /></p>
              </Link>
            ))}
            {!pendingMsgs.length && <p className="text-sm text-muted-foreground p-3">Sin mensajes pendientes.</p>}
          </CardContent>
        </Card>

        <Card className="card-soft">
          <CardHeader className="pb-2"><CardTitle className="flex flex-wrap items-center gap-2 text-base min-w-0"><Receipt className="w-4 h-4 text-amber-600 shrink-0" /> Facturas pendientes ({unpaid.length})</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {unpaid.slice(0, 5).map((i) => (
              <Link key={i.id} to="/billing" className="block p-3 rounded-xl hover:bg-secondary text-sm">
                <p className="font-medium">{i.number} · {i.client_name}</p>
                <p className="text-xs text-muted-foreground">{i.total?.toFixed(2) ?? "0"} € · vence {formatDate(i.due_date)}</p>
              </Link>
            ))}
            {!unpaid.length && <p className="text-sm text-muted-foreground p-3">Sin facturas pendientes.</p>}
          </CardContent>
        </Card>

        <Card className="card-soft md:col-span-2">
          <CardHeader className="pb-2"><CardTitle className="flex flex-wrap items-center gap-2 text-base min-w-0"><Inbox className="w-4 h-4 text-primary shrink-0" /> Consultas sin cerrar ({newLeads.length})</CardTitle></CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-2">
            {newLeads.slice(0, 6).map((l) => (
              <Link key={l.id} to="/leads" className="block p-3 rounded-xl hover:bg-secondary text-sm">
                <p className="font-medium break-words">{l.full_name} · {l.preferred_language || "—"}</p>
                <p className="text-xs text-muted-foreground truncate">{l.enquiry_category || l.message}</p>
                <p className="text-xs mt-1"><StatusBadge value={l.status} label={leadLabel(l.status)} /></p>
              </Link>
            ))}
            {!newLeads.length && <p className="text-sm text-muted-foreground p-3">Sin consultas nuevas.</p>}
          </CardContent>
        </Card>

        <Card className="card-soft md:col-span-2 border-l-4 border-l-primary/30">
          <CardHeader className="pb-2">
            <CardTitle className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-base min-w-0">
              <Zap className="w-4 h-4 text-primary shrink-0" />
              <span className="min-w-0 break-words">Recordatorios automáticos ({autoReminders.length})</span>
              <span className="text-xs text-muted-foreground font-normal w-full sm:w-auto">· generados por el escaneo matinal</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-2">
            {autoReminders.slice(0, 6).map((t) => (
              <Link key={t.id} to="/tasks" className="block p-3 rounded-xl hover:bg-secondary text-sm">
                <p className="font-medium flex items-center gap-1.5 min-w-0">
                  <Zap className="w-3 h-3 text-primary shrink-0" /> <span className="min-w-0 break-words">{t.title}</span>
                </p>
                <p className="text-xs text-muted-foreground">{t.owner || "sin asignar"} · {formatDate(t.due_date)} · prioridad {t.priority}</p>
              </Link>
            ))}
            {!autoReminders.length && <p className="text-sm text-muted-foreground p-3">Sin recordatorios automáticos pendientes.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}