import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertTriangle, CheckCircle2, CloudOff } from "lucide-react";

// Confirmación de exportación a Dropbox con estados: confirmar, subiendo,
// Dropbox no conectada, error (reintentable) y resumen de éxito.
export default function ExportArchiveDialog({ open, onOpenChange, client, onDone }) {
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
      setError(payload.error || e.message || "Error inesperado durante la exportación.");
      setFailedFiles(payload.failed || []);
      setPhase("error");
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Exportar al archivo de Dropbox</DialogTitle>
          <DialogDescription>
            {client?.legal_name} — se creará primero una copia completa en Dropbox y, solo tras
            verificar la subida, se eliminarán los datos de la aplicación.
          </DialogDescription>
        </DialogHeader>

        {phase === "confirm" && (
          <div className="space-y-3">
            <Alert variant="destructive" className="rounded-xl">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Esta acción es <strong>irreversible</strong>. Se exportarán todos los documentos,
                un resumen en PDF y una copia de seguridad JSON a la carpeta
                <span className="break-all"> /GlobalLaw OS/Archivo/…</span> de la despacho. Después
                se purgarán expedientes, documentos, comunicaciones, citas, facturas y tareas, y el
                cliente quedará reducido a un registro mínimo con la referencia al archivo.
              </AlertDescription>
            </Alert>
            <DialogFooter>
              <Button variant="outline" className="rounded-xl" onClick={() => close(false)}>Cancelar</Button>
              <Button variant="destructive" className="rounded-xl" onClick={run}>
                Exportar y purgar
              </Button>
            </DialogFooter>
          </div>
        )}

        {phase === "busy" && (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-sm font-medium">Subiendo el expediente a Dropbox…</p>
            <p className="text-xs text-muted-foreground">No cierre esta ventana. No se elimina nada hasta verificar cada archivo.</p>
          </div>
        )}

        {phase === "not_connected" && (
          <div className="space-y-3">
            <Alert className="rounded-xl">
              <CloudOff className="h-4 w-4" />
              <AlertDescription>
                La cuenta de Dropbox de la despacho aún no está conectada a la aplicación.
                Conéctela desde la configuración de integraciones y vuelva a intentarlo.
                No se ha eliminado ningún dato.
              </AlertDescription>
            </Alert>
            <DialogFooter>
              <Button variant="outline" className="rounded-xl" onClick={() => close(false)}>Entendido</Button>
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
              <Button variant="outline" className="rounded-xl" onClick={() => close(false)}>Cerrar</Button>
              <Button className="rounded-xl" onClick={run}>Reintentar</Button>
            </DialogFooter>
          </div>
        )}

        {phase === "done" && result && (
          <div className="space-y-3">
            <Alert className="rounded-xl border-emerald-200 bg-emerald-50 text-emerald-800">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                Exportación completada y datos purgados de la aplicación.
                <div className="mt-2 text-xs">
                  <p className="break-all"><strong>Carpeta Dropbox:</strong> {result.folder}</p>
                  <p>{result.documents} documento(s) subido(s) · {result.records?.matters ?? 0} expediente(s) purgado(s)</p>
                </div>
              </AlertDescription>
            </Alert>
            <DialogFooter>
              <Button className="rounded-xl" onClick={() => close(false)}>Cerrar</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}