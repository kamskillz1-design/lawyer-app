import React, { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { me as authMe } from "@/api/auth";
import { Button } from "@/components/ui/button";
import { Upload, Download } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { categoryLabel, REVIEW_STATUSES, reviewLabel } from "@/lib/constants";
import { formatDate, todayISO } from "@/lib/format";
import StatusBadge from "@/components/StatusBadge";
import { inputClass as input } from "@/lib/formStyles";
import InlineMessage from "@/components/InlineMessage";

export default function MatterDocuments({ matter }) {
  const { t } = useI18n();
  const [docs, setDocs] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [reviewNotes, setReviewNotes] = useState({});
  const fileRef = useRef(null);

  const reload = () => base44.entities.Document.filter({ matter_id: matter.id }).then(setDocs);
  useEffect(() => { reload(); }, [matter.id]);

  const upload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const category = prompt(t("doc_category_prompt"), "");
      await base44.entities.Document.create({
        title: file.name, client_id: matter.client_id, client_name: matter.client_name,
        matter_id: matter.id, matter_number: matter.matter_number, portal_user_id: matter.portal_user_id || "",
        category: category || "other", source: "staff", file_url, file_name: file.name,
        review_status: "under_review", visibility: "client",
      });
      const matching = await base44.entities.ChecklistItem.filter({ matter_id: matter.id, status: "needed" });
      const item = matching.find((i) => i.category === (category || "other"));
      if (item) await base44.entities.ChecklistItem.update(item.id, { status: "uploaded" });
      reload();
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const review = async (doc, status) => {
    const notes = reviewNotes[doc.id] ?? doc.review_notes ?? "";
    const reviewer = (await authMe()).full_name;
    await base44.entities.Document.update(doc.id, { review_status: status, review_notes: notes, reviewer });
    if (["accepted", "needs_correction"].includes(status)) {
      const items = await base44.entities.ChecklistItem.filter({ matter_id: matter.id, category: doc.category });
      const item = items.find((i) => i.status !== "not_required");
      if (item) await base44.entities.ChecklistItem.update(item.id, { status: status === "accepted" ? "accepted" : "needs_correction", client_note: notes });
    }
    reload();
  };

  if (!docs) return <InlineMessage className="text-sm" text={t("loading_docs")} />;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">{docs.length} {t("docs_word")} · {t("review_word")} {todayISO()}</p>
        <input ref={fileRef} type="file" id="matter-doc-upload" className="hidden" onChange={upload} />
        <Button size="sm" className="rounded-lg" onClick={() => fileRef.current?.click()} disabled={uploading}>
          <Upload className="w-4 h-4 me-1" /> {uploading ? t("uploading") : t("upload_doc_btn")}
        </Button>
      </div>
      {docs.map((doc) => {
        const expired = doc.expiry_date && doc.expiry_date < todayISO();
        return (
          <div key={doc.id} className="card-soft p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-52">
                <p className="font-medium text-sm">{doc.title}</p>
                <p className="text-xs text-muted-foreground">
                  {categoryLabel(doc.category, t)} · {doc.source === "client" ? t("comm_client") : doc.source}
                  {doc.expiry_date ? ` · ${t("expires_word")} ${formatDate(doc.expiry_date)}` : ""}
                  {expired && <span className="text-red-600 font-medium"> · {t("doc_expired")}</span>}
                </p>
              </div>
              <StatusBadge value={doc.review_status} label={reviewLabel(doc.review_status, t)} />
              <a href={doc.file_url} target="_blank" rel="noreferrer" className="p-2 rounded-lg hover:bg-secondary text-muted-foreground" title={t("view_download")}>
                <Download className="w-4 h-4" />
              </a>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <input className={input + " flex-1 min-w-40 h-8 text-xs"} placeholder={t("ph_review_note_client")}
                value={reviewNotes[doc.id] ?? doc.review_notes ?? ""} onChange={(e) => setReviewNotes({ ...reviewNotes, [doc.id]: e.target.value })} />
              <select className="h-8 rounded-md border border-input bg-card px-2 text-xs" value={doc.review_status}
                onChange={(e) => review(doc, e.target.value)}>
                {REVIEW_STATUSES.map((s) => <option key={s.id} value={s.id}>{t(s.key)}</option>)}
              </select>
            </div>
          </div>
        );
      })}
      {!docs.length && <p className="text-sm text-muted-foreground">{t("no_docs_matter")}</p>}
    </div>
  );
}
