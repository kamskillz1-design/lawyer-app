import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Plus, CheckCircle2, Zap, Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import useTaskTitles from "@/hooks/useTaskTitles";
import { TASK_TYPES, taskTypeLabel } from "@/lib/constants";
import { formatDate, todayISO } from "@/lib/format";
import StatusBadge from "@/components/StatusBadge";
import { inputClass as input } from "@/lib/formStyles";
import InlineMessage from "@/components/InlineMessage";

export default function Tasks() {
  const { t } = useI18n();
  const [tasks, setTasks] = useState(null);
  const [matters, setMatters] = useState([]);
  const [filter, setFilter] = useState("open");
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: "", matter_id: "", due_date: "", priority: "medium", task_type: "general", owner: "" });
  const titles = useTaskTitles(tasks);

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

  if (!tasks) return <InlineMessage />;
  const today = todayISO();

  const filtered = tasks.filter((tk) => {
    const open = tk.status !== "done";
    if (filter === "open") return open;
    if (filter === "overdue") return open && tk.due_date && tk.due_date < today;
    if (filter === "today") return open && tk.due_date === today;
    if (filter === "done") return !open;
    return true;
  }).sort((a, b) => (a.due_date || "9999").localeCompare(b.due_date || "9999"));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-3xl font-bold">{t("tasks_title")}</h1>
        <div className="flex flex-wrap gap-2 min-w-0">
          <select className="h-9 max-w-full rounded-xl border border-input bg-card px-3 text-sm" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="open">{t("filter_open")}</option><option value="overdue">{t("filter_overdue")}</option>
            <option value="today">{t("today")}</option><option value="done">{t("filter_done")}</option>
          </select>
          <Button className="rounded-xl" onClick={() => setAdding(!adding)}><Plus className="w-4 h-4 me-1" /> {t("new_task")}</Button>
        </div>
      </div>

      {adding && (
        <div className="card-soft p-4 grid md:grid-cols-6 gap-3 items-end">
          <input className={input + " md:col-span-2"} placeholder={t("ph_title")} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <select className={input} value={form.matter_id} onChange={(e) => setForm({ ...form, matter_id: e.target.value })}>
            <option value="">{t("no_matter_opt")}</option>
            {matters.map((m) => <option key={m.id} value={m.id}>{m.matter_number} · {m.client_name}</option>)}
          </select>
          <input type="date" className={input} value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
          <select className={input} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
            <option value="low">{t("prio_low")}</option><option value="medium">{t("prio_medium")}</option>
            <option value="high">{t("prio_high")}</option><option value="urgent">{t("prio_urgent")}</option>
          </select>
          <select className={input} value={form.task_type} onChange={(e) => setForm({ ...form, task_type: e.target.value })}>
            {TASK_TYPES.map((tt) => <option key={tt.id} value={tt.id}>{t(tt.key)}</option>)}
          </select>
          <input className={input + " md:col-span-2"} placeholder={t("ph_owner")} value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} />
          <Button className="rounded-lg md:col-span-1" onClick={add} disabled={!form.title}>{t("add")}</Button>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map((tk) => {
          const overdue = tk.due_date && tk.due_date < today && tk.status !== "done";
          return (
            <div key={tk.id} className={`card-soft p-4 flex flex-wrap items-center gap-3 ${tk.status === "done" ? "opacity-60" : ""}`}>
              <div className="flex-1 min-w-52">
                <p className={`font-medium text-sm ${tk.status === "done" ? "line-through" : ""}`}>
                  {titles[tk.id]?.title ?? tk.title}
                  {titles[tk.id]?.translating && <Loader2 className="w-3 h-3 animate-spin inline ms-1 align-middle text-muted-foreground" />}
                </p>
                <p className="text-xs text-muted-foreground">
                  {taskTypeLabel(tk.task_type, t)} · {tk.owner || t("unassigned")}
                  {tk.matter_id && <> · <Link to={`/matters/${tk.matter_id}`} className="hover:text-primary">{tk.matter_number}</Link></>}
                  {tk.due_date && ` · ${formatDate(tk.due_date)}`}
                  {overdue && <span className="text-red-600 font-medium"> · {t("overdue_flag")}</span>}
                </p>
              </div>
              <StatusBadge value={tk.priority} label={t("prio_" + tk.priority)} />
              {tk.source === "automation" && (
                <span className="inline-flex items-center gap-1 text-xs text-primary font-medium whitespace-nowrap">
                  <Zap className="w-3 h-3" /> AUTO
                </span>
              )}
              {tk.status !== "done" && (
                <Button size="sm" variant="outline" className="rounded-lg" onClick={() => complete(tk)}>
                  <CheckCircle2 className="w-4 h-4 me-1" /> {t("complete_btn")}
                </Button>
              )}
            </div>
          );
        })}
        {!filtered.length && <p className="text-sm text-muted-foreground p-4">{t("no_tasks_filter")}</p>}
      </div>
    </div>
  );
}