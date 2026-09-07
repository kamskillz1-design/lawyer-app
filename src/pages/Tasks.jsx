import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Plus, CheckCircle2, Zap } from "lucide-react";
import { TASK_TYPES, taskTypeLabel } from "@/lib/constants";
import { formatDate, todayISO } from "@/lib/format";
import StatusBadge from "@/components/StatusBadge";

const input = "w-full h-9 rounded-md border border-input bg-card px-3 text-sm";

export default function Tasks() {
  const [tasks, setTasks] = useState(null);
  const [matters, setMatters] = useState([]);
  const [filter, setFilter] = useState("open");
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: "", matter_id: "", due_date: "", priority: "medium", task_type: "general", owner: "" });

  const reload = async () => {
    const [ts, ms] = await Promise.all([base44.entities.Task.list(), base44.entities.Matter.list()]);
    setTasks(ts);
    setMatters(ms);
  };
  useEffect(() => { reload(); }, []);

  const add = async () => {
    const m = matters.find((x) => x.id === form.matter_id);
    await base44.entities.Task.create({
      ...form, matter_id: m?.id || "", client_id: m?.client_id || "", matter_number: m?.matter_number || "", status: "todo",
    });
    setAdding(false);
    setForm({ title: "", matter_id: "", due_date: "", priority: "medium", task_type: "general", owner: "" });
    reload();
  };

  const complete = async (task) => {
    await base44.entities.Task.update(task.id, { status: "done" });
    reload();
  };

  if (!tasks) return <p className="text-muted-foreground">Cargando…</p>;
  const today = todayISO();

  const filtered = tasks.filter((t) => {
    const open = t.status !== "done";
    if (filter === "open") return open;
    if (filter === "overdue") return open && t.due_date && t.due_date < today;
    if (filter === "today") return open && t.due_date === today;
    if (filter === "done") return !open;
    return true;
  }).sort((a, b) => (a.due_date || "9999").localeCompare(b.due_date || "9999"));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-3xl font-bold">Tareas y plazos</h1>
        <div className="flex flex-wrap gap-2 min-w-0">
          <select className="h-9 max-w-full rounded-xl border border-input bg-card px-3 text-sm" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="open">Abiertas</option><option value="overdue">Vencidas</option>
            <option value="today">Hoy</option><option value="done">Completadas</option>
          </select>
          <Button className="rounded-xl" onClick={() => setAdding(!adding)}><Plus className="w-4 h-4 me-1" /> Nueva tarea</Button>
        </div>
      </div>

      {adding && (
        <div className="card-soft p-4 grid md:grid-cols-6 gap-3 items-end">
          <input className={input + " md:col-span-2"} placeholder="Título *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <select className={input} value={form.matter_id} onChange={(e) => setForm({ ...form, matter_id: e.target.value })}>
            <option value="">Sin expediente</option>
            {matters.map((m) => <option key={m.id} value={m.id}>{m.matter_number} · {m.client_name}</option>)}
          </select>
          <input type="date" className={input} value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
          <select className={input} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
            <option value="low">Baja</option><option value="medium">Media</option>
            <option value="high">Alta</option><option value="urgent">Urgente</option>
          </select>
          <select className={input} value={form.task_type} onChange={(e) => setForm({ ...form, task_type: e.target.value })}>
            {TASK_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
          <input className={input + " md:col-span-2"} placeholder="Responsable" value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} />
          <Button className="rounded-lg md:col-span-1" onClick={add} disabled={!form.title}>Añadir</Button>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map((t) => {
          const overdue = t.due_date && t.due_date < today && t.status !== "done";
          return (
            <div key={t.id} className={`card-soft p-4 flex flex-wrap items-center gap-3 ${t.status === "done" ? "opacity-60" : ""}`}>
              <div className="flex-1 min-w-52">
                <p className={`font-medium text-sm ${t.status === "done" ? "line-through" : ""}`}>{t.title}</p>
                <p className="text-xs text-muted-foreground">
                  {taskTypeLabel(t.task_type)} · {t.owner || "sin asignar"}
                  {t.matter_id && <> · <Link to={`/matters/${t.matter_id}`} className="hover:text-primary">{t.matter_number}</Link></>}
                  {t.due_date && ` · ${formatDate(t.due_date)}`}
                  {overdue && <span className="text-red-600 font-medium"> · VENCIDA</span>}
                </p>
              </div>
              <StatusBadge value={t.priority} label={t.priority} />
              {t.source === "automation" && (
                <span className="inline-flex items-center gap-1 text-xs text-primary font-medium whitespace-nowrap">
                  <Zap className="w-3 h-3" /> AUTO
                </span>
              )}
              {t.status !== "done" && (
                <Button size="sm" variant="outline" className="rounded-lg" onClick={() => complete(t)}>
                  <CheckCircle2 className="w-4 h-4 me-1" /> Completar
                </Button>
              )}
            </div>
          );
        })}
        {!filtered.length && <p className="text-sm text-muted-foreground p-4">Sin tareas en este filtro.</p>}
      </div>
    </div>
  );
}