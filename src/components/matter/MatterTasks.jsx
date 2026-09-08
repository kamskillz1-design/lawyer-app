import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Plus, CheckCircle2 } from "lucide-react";
import { TASK_TYPES, taskTypeLabel } from "@/lib/constants";
import { formatDate, todayISO } from "@/lib/format";
import StatusBadge from "@/components/StatusBadge";
import { inputClass as input } from "@/lib/formStyles";
import InlineMessage from "@/components/InlineMessage";

export default function MatterTasks({ matter }) {
  const [tasks, setTasks] = useState(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: "", due_date: "", priority: "medium", task_type: "general", owner: matter.assigned_caseworker || "" });

  const reload = () => base44.entities.Task.filter({ matter_id: matter.id }).then(setTasks);
  useEffect(() => { reload(); }, [matter.id]);

  const add = async () => {
    await base44.entities.Task.create({
      ...form, matter_id: matter.id, client_id: matter.client_id, matter_number: matter.matter_number, status: "todo",
    });
    setAdding(false);
    setForm({ title: "", due_date: "", priority: "medium", task_type: "general", owner: matter.assigned_caseworker || "" });
    reload();
  };

  const complete = async (task) => {
    await base44.entities.Task.update(task.id, { status: "done", completion_note: "Completado desde expediente" });
    reload();
  };

  if (!tasks) return <InlineMessage className="text-sm" text="Cargando tareas…" />;
  const today = todayISO();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{tasks.filter((t) => t.status !== "done").length} abiertas</p>
        <Button size="sm" variant="outline" className="rounded-lg" onClick={() => setAdding(!adding)}>
          <Plus className="w-4 h-4 me-1" /> Nueva tarea
        </Button>
      </div>

      {adding && (
        <div className="card-soft p-4 grid md:grid-cols-5 gap-3 items-end">
          <input className={input + " md:col-span-2"} placeholder="Título *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <input type="date" className={input} value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
          <select className={input} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
            <option value="low">Baja</option><option value="medium">Media</option>
            <option value="high">Alta</option><option value="urgent">Urgente</option>
          </select>
          <select className={input} value={form.task_type} onChange={(e) => setForm({ ...form, task_type: e.target.value })}>
            {TASK_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
          <input className={input + " md:col-span-4"} placeholder="Responsable" value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} />
          <Button className="rounded-lg" onClick={add} disabled={!form.title}>Añadir</Button>
        </div>
      )}

      {tasks.map((task) => {
        const overdue = task.due_date && task.due_date < today && task.status !== "done";
        return (
          <div key={task.id} className={`card-soft p-4 flex flex-wrap items-center gap-3 ${task.status === "done" ? "opacity-60" : ""}`}>
            <div className="flex-1 min-w-52">
              <p className={`font-medium text-sm ${task.status === "done" ? "line-through" : ""}`}>{task.title}</p>
              <p className="text-xs text-muted-foreground">
                {taskTypeLabel(task.task_type)} · {task.owner || "sin asignar"} · {formatDate(task.due_date)}
                {overdue && <span className="text-red-600 font-medium"> · VENCIDA</span>}
              </p>
            </div>
            <StatusBadge value={task.priority} label={task.priority} />
            {task.status !== "done" ? (
              <Button size="sm" variant="outline" className="rounded-lg" onClick={() => complete(task)}>
                <CheckCircle2 className="w-4 h-4 me-1" /> Completar
              </Button>
            ) : <StatusBadge value="done" label="Completada" />}
          </div>
        );
      })}
      {!tasks.length && <p className="text-sm text-muted-foreground">Sin tareas.</p>}
    </div>
  );
}