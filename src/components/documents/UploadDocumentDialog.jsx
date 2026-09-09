import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DOC_CATEGORIES } from "@/lib/constants";
import { useI18n } from "@/lib/i18n";
import { Loader2, Upload } from "lucide-react";
import { inputClass as inputCls } from "@/lib/formStyles";
const EMPTY = {
  client_id: "", matter_id: "", checklist_item_id: "", title: "",
  category: "", issue_date: "", expiry_date: "", visibility: "staff",
};

export default function UploadDocumentDialog({ open, onOpenChange, onUploaded }) {
  const { t } = useI18n();
  const [clients, setClients] = useState([]);
  const [matters, setMatters] = useState([]);
  const [checklist, setChecklist] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setForm(EMPTY); setFile(null); setError("");
      base44.entities.Client.list().then(setClients).catch(() => setClients([]));
    }
  }, [open]);

  useEffect(() => {
    if (!form.client_id) { setMatters([]); return; }
    base44.entities.Matter.filter({ client_id: form.client_id }).then(setMatters).catch(() => setMatters([]));
  }, [form.client_id]);

  useEffect(() => {
    if (!form.matter_id) { setChecklist([]); return; }
    base44.entities.ChecklistItem.filter({ matter_id: form.matter_id })
      .then((items) => setChecklist(items.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))))
      .catch(() => setChecklist([]));
  }, [form.matter_id]);

  const setClient = (id) => setForm((f) => ({ ...f, client_id: id, matter_id: "", checklist_item_id: "" }));
  const setMatter = (id) => setForm((f) => ({ ...f, matter_id: id, checklist_item_id: "" }));

  const selectedClient = clients.find((c) => c.id === form.client_id);
  const noPortalLinked = form.visibility === "client" && selectedClient && !selectedClient.portal_user_id;

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.client_id || !form.title.trim() || !form.category || !file) {
      setError(t("doc_form_error"));
      return;
    }
    setSaving(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const matter = matters.find((m) => m.id === form.matter_id);
      await base44.entities.Document.create({
        title: form.title.trim(),
        client_id: selectedClient.id, client_name: selectedClient.legal_name,
        matter_id: matter?.id || "", matter_number: matter?.matter_number || "",
        checklist_item_id: form.checklist_item_id || "",
        category: form.category, source: "staff",
        issue_date: form.issue_date || "", expiry_date: form.expiry_date || "",
        file_url, file_name: file.name,
        review_status: "accepted",
        visibility: form.visibility,
        portal_user_id: form.visibility === "client" ? (selectedClient.portal_user_id || "") : "",
      });
      onUploaded();
      onOpenChange(false);
    } catch (err) {
      setError(t("doc_upload_error"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !saving && onOpenChange(o)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading">{t("upload_doc_btn")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="doc-client">{t("ph_client_required")}</Label>
              <select id="doc-client" className={inputCls} value={form.client_id} onChange={(e) => setClient(e.target.value)}>
                <option value="">{t("doc_select")}</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.legal_name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="doc-matter">{t("matters_title")}</Label>
              <select id="doc-matter" className={inputCls} value={form.matter_id} onChange={(e) => setMatter(e.target.value)} disabled={!form.client_id}>
                <option value="">{t("no_matter_opt")}</option>
                {matters.map((m) => <option key={m.id} value={m.id}>{m.matter_number || m.procedure_type}</option>)}
              </select>
            </div>
          </div>

          {form.matter_id && (
            <div className="space-y-1">
              <Label htmlFor="doc-checklist">{t("doc_checklist_item")}</Label>
              <select id="doc-checklist" className={inputCls} value={form.checklist_item_id}
                onChange={(e) => setForm((f) => ({ ...f, checklist_item_id: e.target.value }))}>
                <option value="">{t("doc_no_link")}</option>
                {checklist.map((i) => <option key={i.id} value={i.id}>{i.title}</option>)}
              </select>
            </div>
          )}

          <div className="space-y-1">
            <Label htmlFor="doc-title">{t("doc_title_lbl")}</Label>
            <input id="doc-title" className={inputCls} value={form.title} maxLength={200}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder={t("doc_title_ph")} />
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <div className="space-y-1 sm:col-span-1">
              <Label htmlFor="doc-category">{t("doc_category_lbl")}</Label>
              <select id="doc-category" className={inputCls} value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                <option value="">{t("doc_select")}</option>
                {DOC_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{t(c.key)}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="doc-issue">{t("doc_issue_lbl")}</Label>
              <input id="doc-issue" type="date" className={inputCls} value={form.issue_date}
                onChange={(e) => setForm((f) => ({ ...f, issue_date: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="doc-expiry">{t("doc_expiry_lbl")}</Label>
              <input id="doc-expiry" type="date" className={inputCls} value={form.expiry_date}
                onChange={(e) => setForm((f) => ({ ...f, expiry_date: e.target.value }))} />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="doc-visibility">{t("doc_visibility")}</Label>
            <select id="doc-visibility" className={inputCls} value={form.visibility}
              onChange={(e) => setForm((f) => ({ ...f, visibility: e.target.value }))}>
              <option value="staff">{t("doc_vis_staff")}</option>
              <option value="client">{t("doc_vis_client")}</option>
            </select>
            {noPortalLinked && (
              <p className="text-xs text-amber-700">{t("doc_no_portal_warn")}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="doc-file">{t("doc_file_lbl")}</Label>
            <input id="doc-file" type="file" accept=".pdf,.jpg,.jpeg,.png" className="w-full text-sm"
              onChange={(e) => setFile(e.target.files?.[0] || null)} disabled={saving} />
            {file && <p className="text-xs text-muted-foreground truncate">{file.name}</p>}
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <DialogFooter className="gap-2 mt-2">
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => onOpenChange(false)} disabled={saving}>{t("cancel")}</Button>
            <Button type="submit" className="rounded-xl" disabled={saving || !file || !form.client_id || !form.title.trim() || !form.category}>
              {saving ? <Loader2 className="w-4 h-4 me-1 animate-spin" /> : <Upload className="w-4 h-4 me-1" />}
              {saving ? t("uploading") : t("upload_doc_btn")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}