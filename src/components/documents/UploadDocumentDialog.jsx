import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DOC_CATEGORIES } from "@/lib/constants";
import { Loader2, Upload } from "lucide-react";

const inputCls = "w-full h-9 rounded-md border border-input bg-card px-3 text-sm";
const EMPTY = {
  client_id: "", matter_id: "", checklist_item_id: "", title: "",
  category: "", issue_date: "", expiry_date: "", visibility: "staff",
};

export default function UploadDocumentDialog({ open, onOpenChange, onUploaded }) {
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
      setError("Complete el cliente, el título, la categoría y seleccione un archivo.");
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
      setError("No se pudo subir el documento. Inténtelo de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !saving && onOpenChange(o)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading">Subir documento</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="doc-client">Cliente *</Label>
              <select id="doc-client" className={inputCls} value={form.client_id} onChange={(e) => setClient(e.target.value)}>
                <option value="">Seleccione…</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.legal_name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="doc-matter">Expediente</Label>
              <select id="doc-matter" className={inputCls} value={form.matter_id} onChange={(e) => setMatter(e.target.value)} disabled={!form.client_id}>
                <option value="">Sin expediente</option>
                {matters.map((m) => <option key={m.id} value={m.id}>{m.matter_number || m.procedure_type}</option>)}
              </select>
            </div>
          </div>

          {form.matter_id && (
            <div className="space-y-1">
              <Label htmlFor="doc-checklist">Elemento del checklist (opcional)</Label>
              <select id="doc-checklist" className={inputCls} value={form.checklist_item_id}
                onChange={(e) => setForm((f) => ({ ...f, checklist_item_id: e.target.value }))}>
                <option value="">No vincular</option>
                {checklist.map((i) => <option key={i.id} value={i.id}>{i.title}</option>)}
              </select>
            </div>
          )}

          <div className="space-y-1">
            <Label htmlFor="doc-title">Título *</Label>
            <input id="doc-title" className={inputCls} value={form.title} maxLength={200}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="p. ej. Resolución de arraigo social" />
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <div className="space-y-1 sm:col-span-1">
              <Label htmlFor="doc-category">Categoría *</Label>
              <select id="doc-category" className={inputCls} value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                <option value="">Seleccione…</option>
                {DOC_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="doc-issue">Fecha de emisión</Label>
              <input id="doc-issue" type="date" className={inputCls} value={form.issue_date}
                onChange={(e) => setForm((f) => ({ ...f, issue_date: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="doc-expiry">Fecha de caducidad</Label>
              <input id="doc-expiry" type="date" className={inputCls} value={form.expiry_date}
                onChange={(e) => setForm((f) => ({ ...f, expiry_date: e.target.value }))} />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="doc-visibility">Visibilidad</Label>
            <select id="doc-visibility" className={inputCls} value={form.visibility}
              onChange={(e) => setForm((f) => ({ ...f, visibility: e.target.value }))}>
              <option value="staff">Solo personal</option>
              <option value="client">Visible al cliente (portal)</option>
            </select>
            {noPortalLinked && (
              <p className="text-xs text-amber-700">Este cliente no tiene cuenta de portal vinculada; el documento no aparecerá en su portal.</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="doc-file">Archivo (PDF, JPG o PNG) *</Label>
            <input id="doc-file" type="file" accept=".pdf,.jpg,.jpeg,.png" className="w-full text-sm"
              onChange={(e) => setFile(e.target.files?.[0] || null)} disabled={saving} />
            {file && <p className="text-xs text-muted-foreground truncate">{file.name}</p>}
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <DialogFooter className="gap-2 mt-2">
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
            <Button type="submit" className="rounded-xl" disabled={saving || !file || !form.client_id || !form.title.trim() || !form.category}>
              {saving ? <Loader2 className="w-4 h-4 me-1 animate-spin" /> : <Upload className="w-4 h-4 me-1" />}
              {saving ? "Subiendo…" : "Subir documento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}