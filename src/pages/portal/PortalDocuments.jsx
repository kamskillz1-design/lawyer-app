import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/components/ui/use-toast";
import { Upload, Download, FileCheck2, Info } from "lucide-react";
import { formatDate } from "@/lib/format";
import { getLanguage } from "@/lib/languages";
import { cn } from "@/lib/utils";

const STATUS_STYLE = {
  needed: "bg-amber-50 text-amber-800 border-amber-200",
  uploaded: "bg-sky-50 text-sky-800 border-sky-200",
  being_checked: "bg-violet-50 text-violet-800 border-violet-200",
  accepted: "bg-emerald-50 text-emerald-800 border-emerald-200",
  needs_correction: "bg-red-50 text-red-800 border-red-200",
  not_required: "bg-stone-100 text-stone-600 border-stone-200",
};

export default function PortalDocuments() {
  const { t, checklistText, lang } = useI18n();
  const { toast } = useToast();
  const [data, setData] = useState(null);
  const [noAccess, setNoAccess] = useState(false);
  const [uploadingId, setUploadingId] = useState("");

  const load = async () => {
    const me = await base44.auth.me();
    const clients = await base44.entities.Client.filter({ portal_user_id: me.id });
    const client = clients[0];
    if (!client) { setNoAccess(true); return; }
    const [matters, items, docs] = await Promise.all([
      base44.entities.Matter.filter({ portal_user_id: me.id }),
      base44.entities.ChecklistItem.filter({ portal_user_id: me.id }),
      base44.entities.Document.filter({ portal_user_id: me.id }),
    ]);
    setData({ me, client, matters, items, docs });
  };

  useEffect(() => { load().catch(() => setNoAccess(true)); }, []);

  const upload = async (item, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingId(item.id);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.Document.create({
        title: file.name, client_id: item.client_id, client_name: item.client_name,
        matter_id: item.matter_id, matter_number: item.matter_number,
        portal_user_id: item.portal_user_id, checklist_item_id: item.id,
        category: item.category, source: "client", file_url, file_name: file.name,
        review_status: "uploaded", visibility: "client", original_language: lang,
      });
      await base44.entities.ChecklistItem.update(item.id, { status: "uploaded" });
      toast({ title: t("doc_upload_success") });
      load();
    } finally {
      setUploadingId("");
      e.target.value = "";
    }
  };

  if (noAccess) return <p className="p-6 text-muted-foreground">{t("no_client_profile")}</p>;
  if (!data) return <p className="text-muted-foreground">{t("loading")}</p>;

  const { matters, items, docs, client } = data;

  return (
    <div className="space-y-6" dir={getLanguage(lang)?.rtl ? "rtl" : "ltr"}>
      <h1 className="font-heading text-3xl font-bold">{t("checklist_title")}</h1>
      <p className="text-sm text-muted-foreground -mt-4">{t("upload_hint")}</p>

      {matters.map((m) => {
        const matterItems = items.filter((i) => i.matter_id === m.id).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
        const matterDocs = docs.filter((d) => d.matter_id === m.id);
        return (
          <div key={m.id} className="card-soft p-5">
            <h2 className="font-heading text-xl font-semibold mb-4">{m.procedure_type} <span className="text-sm text-muted-foreground font-body">· {m.matter_number}</span></h2>
            <div className="space-y-3">
              {matterItems.map((item) => (
                <div key={item.id} className={cn("p-4 rounded-xl border", STATUS_STYLE[item.status] || STATUS_STYLE.needed)}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex-1 min-w-52">
                      <p className="font-medium text-sm">{item.title_client || item.title}</p>
                      <p className="text-xs opacity-80 mt-1">
                        {item.why_required}
                        {item.deadline ? ` · ${t("deadline")}: ${formatDate(item.deadline)}` : ""}
                        {item.apostille_required ? ` · ${t("apostille_req")}` : ""}
                        {item.translation_required ? ` · ${t("translation_req")}` : ""}
                      </p>
                      {item.status === "needs_correction" && item.client_note && (
                        <p className="text-xs mt-2 p-2 bg-white/70 rounded-lg"><Info className="w-3 h-3 inline me-1" />{item.client_note}</p>
                      )}
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-wide">{checklistText(item.status)}</span>
                    {item.status !== "accepted" && item.status !== "not_required" && (
                      <label className={`cursor-pointer inline-flex items-center gap-1.5 text-sm bg-white/80 hover:bg-white px-3 py-2 rounded-lg border transition-colors ${uploadingId === item.id ? "opacity-60" : ""}`}>
                        {uploadingId === item.id ? <>{t("loading")}</> : (<><Upload className="w-4 h-4" /> {t("upload")}</>)}
                        <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => upload(item, e)} />
                      </label>
                    )}
                  </div>
                </div>
              ))}
              {!matterItems.length && <p className="text-sm text-muted-foreground">—</p>}
            </div>

            {matterDocs.length > 0 && (
              <div className="mt-5">
                <h3 className="text-sm font-semibold flex items-center gap-2 mb-2"><FileCheck2 className="w-4 h-4 text-primary" /> {t("nav_documents")}</h3>
                <div className="grid sm:grid-cols-2 gap-2">
                  {matterDocs.map((d) => (
                    <a key={d.id} href={d.file_url} target="_blank" rel="noreferrer"
                      className="flex items-center justify-between p-3 rounded-xl border bg-card hover:bg-secondary text-sm">
                      <span className="truncate me-2">{d.file_name || d.title}</span>
                      <Download className="w-4 h-4 text-muted-foreground shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
      {!matters.length && <p className="text-muted-foreground p-4 card-soft">{t("no_cases")}</p>}
    </div>
  );
}