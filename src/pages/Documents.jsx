import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { categoryLabel, REVIEW_STATUSES, reviewLabel } from "@/lib/constants";
import { formatDate, todayISO } from "@/lib/format";
import StatusBadge from "@/components/StatusBadge";

const input = "w-full h-9 rounded-md border border-input bg-card px-3 text-sm";

export default function Documents() {
  const [docs, setDocs] = useState(null);
  const [filter, setFilter] = useState("review_queue");
  const [notes, setNotes] = useState({});

  const reload = () => base44.entities.Document.list("-created_date").then(setDocs);
  useEffect(() => { reload(); }, []);

  const setReview = async (doc, status) => {
    const me = await base44.auth.me();
    const reviewNotes = notes[doc.id] ?? doc.review_notes ?? "";
    await base44.entities.Document.update(doc.id, { review_status: status, review_notes: notes[doc.id] ?? doc.review_notes ?? "", reviewer: me.full_name });
    reload();
  };

  if (!docs) return <p className="text-muted-foreground">Cargando…</p>;
  const today = todayISO();

  const filtered = docs.filter((d) => {
    if (filter === "review_queue") return ["uploaded", "under_review"].includes(d.review_status);
    if (filter === "expiring") return d.expiry_date && d.expiry_date >= today && d.expiry_date < new Date(Date.now() + 90 * 864e5).toISOString();
    if (filter === "all") return true;
    return d.review_status === filter;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-3xl font-bold">Documentos</h1>
        <select className="h-9 rounded-xl border border-input bg-card px-3 text-sm" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="review_queue">Cola de revisión</option>
          <option value="expiring">Caducan en 90 días</option>
          {REVIEW_STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          <option value="all">Todos</option>
        </select>
      </div>

      <div className="space-y-2">
        {filtered.map((doc) => (
          <div key={doc.id} className="card-soft p-4 flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-52">
              <p className="font-medium text-sm">{doc.title}</p>
              <p className="text-xs text-muted-foreground">
                {doc.client_name} · {categoryLabel(doc.category)} · subido {formatDate(doc.created_date)}
                {doc.expiry_date ? ` · caduca ${formatDate(doc.expiry_date)}` : ""}
                {doc.legacy_source_path ? ` · ${doc.legacy_source_path}` : ""}
              </p>
              {doc.review_notes && <p className="text-xs text-muted-foreground italic mt-1">Nota: {doc.review_notes}</p>}
            </div>
            <StatusBadge value={doc.review_status} label={reviewLabel(doc.review_status)} />
            {doc.matter_id && (
              <Link to={`/matters/${doc.matter_id}`} className="text-xs text-muted-foreground hover:text-primary">{doc.matter_number}</Link>
            )}
            <a href={doc.file_url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">Ver</a>
            <div className="flex gap-1">
              <select className="h-8 rounded-md border border-input bg-card px-2 text-xs" value={doc.review_status}
                onChange={(e) => setReview(doc, e.target.value)}>
                {REVIEW_STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
            <input className={input + " h-8 text-xs w-40"} placeholder="Nota de revisión"
              value={notes[doc.id] ?? doc.review_notes ?? ""} onChange={(e) => setNotes({ ...notes, [doc.id]: e.target.value })}
              onBlur={() => setReview(doc, doc.review_status)} />
          </div>
        ))}
        {!filtered.length && <p className="text-sm text-muted-foreground p-4">Sin documentos en este filtro.</p>}
      </div>
    </div>
  );
}