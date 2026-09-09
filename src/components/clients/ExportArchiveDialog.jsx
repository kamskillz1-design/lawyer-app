import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useI18n } from "@/lib/i18n";
import { Loader2, AlertTriangle, CheckCircle2, CloudOff } from "lucide-react";

// Dropbox export confirmation with phases: confirm, uploading,
// Dropbox not connected, retryable error and success summary.
export default function ExportArchiveDialog({ open, onOpenChange, client, onDone }) {
  const { t } = useI18n();
  const [phase, setPhase] = useState("confirm");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [failedFiles, setFailedFiles] = useState([]);

  const close = (v) => {
    if (!v && phase === "busy") return; // no cerrar durante la subida
    if (!v) { setPhase("confirm"); setResult(null); setError(""); setFailedFiles([]); }
    onOpenChange && onOpenChange(v);
  };

  const run = async () => {
    setPhase("busy");
    try {
      const res = await base44.functions.invoke("exportClientArchive", { client_id: client.id });
      const data = res.data;
      if (data.status === "not_connected") { setPhase("not_connected"); return; }
      setResult(data);
      setPhase("done");
      onDone && onDone(data);
    } catch (e) {
      const payload = e?.response?.data || {};
      setError(payload.error || e.message || t("export_error_default"));
      setFailedFiles(payload.failed || []);
      setPhase("error");
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("export_title")}</DialogTitle>
          <DialogDescription>
            {client?.legal_name} {t("export_desc")}
          </DialogDescription>
        </DialogHeader>

        {phase === "confirm" && (
          <div className="space-y-3">
            <Alert variant="destructive" className="rounded-xl">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{t("export_warning")}</AlertDescription>
            </Alert>
            <DialogFooter>
              <Button variant="outline" className="rounded-xl" onClick={() => close(false)}>{t("cancel")}</Button>
              <Button variant="destructive" className="rounded-xl" onClick={run}>
                {t("export_run_btn")}
              </Button>
            </DialogFooter>
          </div>
        )}

        {phase === "busy" && (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-sm font-medium">{t("export_uploading_msg")}</p>
            <p className="text-xs text-muted-foreground">{t("export_uploading_note")}</p>
          </div>
        )}

        {phase === "not_connected" && (
          <div className="space-y-3">
            <Alert className="rounded-xl">
              <CloudOff className="h-4 w-4" />
              <AlertDescription>{t("export_not_connected")}</AlertDescription>
            </Alert>
            <DialogFooter>
              <Button variant="outline" className="rounded-xl" onClick={() => close(false)}>{t("export_understood")}</Button>
            </DialogFooter>
          </div>
        )}

        {phase === "error" && (
          <div className="space-y-3">
            <Alert variant="destructive" className="rounded-xl">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {error}
                {failedFiles.length > 0 && (
                  <ul className="mt-2 list-disc ps-4 text-xs">
                    {failedFiles.slice(0, 5).map((f, i) => <li key={i} className="break-all">{f}</li>)}
                  </ul>
                )}
              </AlertDescription>
            </Alert>
            <DialogFooter>
              <Button variant="outline" className="rounded-xl" onClick={() => close(false)}>{t("close")}</Button>
              <Button className="rounded-xl" onClick={run}>{t("retry")}</Button>
            </DialogFooter>
          </div>
        )}

        {phase === "done" && result && (
          <div className="space-y-3">
            <Alert className="rounded-xl border-emerald-200 bg-emerald-50 text-emerald-800">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                {t("export_done_msg")}
                <div className="mt-2 text-xs">
                  <p className="break-all"><strong>{t("export_folder_lbl")}</strong> {result.folder}</p>
                  <p>{result.documents} {t("export_doc_unit")} · {result.records?.matters ?? 0} {t("export_matter_unit")}</p>
                </div>
              </AlertDescription>
            </Alert>
            <DialogFooter>
              <Button className="rounded-xl" onClick={() => close(false)}>{t("close")}</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}