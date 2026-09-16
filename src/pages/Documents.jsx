import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { me as authMe } from "@/api/auth";
import { categoryLabel, REVIEW_STATUSES, reviewLabel } from "@/lib/constants";
import { formatDate, todayISO } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Upload } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import StatusBadge from "@/components/StatusBadge";
import UploadDocumentDialog from "@/components/documents/UploadDocumentDialog";
import { inputClass as input } from "@/lib/formStyles";
import InlineMessage from "@/components/InlineMessage";

export default function Documents() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [docs, setDocs] = useState(null);
  const [filter, setFilter] = useState("review_queue");
  const [notes, setNotes] = useState({});
  const [uploadOpen, setUploadOpen] = useState(false);
  const { toast } = useToast();

  const reload = () => base44.entities.Document.list("-created_date").then(setDocs);
  useEffect(() => { reload(); }, []);

  const setReview = async (doc, status) => {
    const me = await authMe();
    await base44.entities.Document.update(doc.id, { review_status: status, review_notes: notes[doc.id] ?? doc.review_notes ?? "", reviewer: me.full_name });
    reload();
  };

  const openDoc = (doc) => {
    if (doc.matter_id) navigate(`/matters/${doc.matter_id}`);
    else if (doc.client_id) navigate(`/clients/${doc.client_id}`);
    else if (doc.file_url) window.open(doc.file_url, "_blank", "noopener");
  };

  if (!docs) return <InlineMessage />;
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
        <h1 className="font-heading text-3xl font-bold">{t("docs_title")}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <select className="h-9 rounded-xl border border-input bg-card px-3 text-sm" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="review_queue">{t("filter_review_queue")}</option>
            <option value="expiring">{t("filter_expiring")}</option>
            {REVIEW_STATUSES.map((s) => <option key={s.id} value={s.id}>{t(s.key)}</option>)}
            <option value="all">{t("filter_all")}</option>
          </select>
          <Button className="rounded-xl" onClick={() => setUploadOpen(true)}>
            <Upload className="w-4 h-4 me-1" /> {t("upload_doc_btn")}
          </Button>
        </div>
      </div>
      <UploadDocumentDialog open={uploadOpen} onOpenChange={setUploadOpen}
        onUploaded={() => { reload(); toast({ title: t("toast_doc_uploaded"), description: t("toast_doc_uploaded_body") }); }} />
      <div className="space-y-2">
        {filtered.map((doc) => (
          <div key={doc.id} className="card-soft p-4 flex flex-wrap items-center gap-3 cursor-pointer hover:bg-secondary/40" onClick={() => openDoc(doc)}>
            <div className="flex-1 min-w-52">
              <p className="font-medium text-sm">{doc.title}</p>
              <p className="text-xs text-muted-foreground">
                {doc.client_name} · {categoryLabel(doc.category, t)} · {t("uploaded_word")} {formatDate(doc.created_date)}
                {doc.expiry_date ? ` · ${t("expires_word")} ${formatDate(doc.expiry_date)}` : ""}
              </p>
            </div>
            <StatusBadge value={doc.review_status} label={reviewLabel(doc.review_status, t)} />
            {doc.matter_id && <span className="text-xs text-muted-foreground">{doc.matter_number}</span>}
            {doc.file_url && (
              <a href={doc.file_url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline" onClick={(e) => e.stopPropagation()}>{t("view")}</a>
            )}
            <select className="h-8 rounded-md border border-input bg-card px-2 text-xs" value={doc.review_status} onClick={(e) => e.stopPropagation()} onChange={(e) => setReview(doc, e.target.value)}>
              {REVIEW_STATUSES.map((s) => <option key={s.id} value={s.id}>{t(s.key)}</option>)}
            </select>
            <input className={input + " h-8 text-xs w-full sm:w-40"} placeholder={t("ph_review_note")}
              value={notes[doc.id] ?? doc.review_notes ?? ""} onClick={(e) => e.stopPropagation()}
              onChange={(e) => setNotes({ ...notes, [doc.id]: e.target.value })}
              onBlur={() => setReview(doc, doc.review_status)} />
          </div>
        ))}
        {!filtered.length && <p className="text-sm text-muted-foreground p-4">{t("no_docs_filter")}</p>}
      </div>
    </div>
  );
}
