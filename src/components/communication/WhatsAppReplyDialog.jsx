import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

const normalize = (s) => (s || "").replace(/\s+/g, " ").trim().toLowerCase();

export default function WhatsAppReplyDialog({ comm, reply, draft, approvedBy, open, onOpenChange, onSent }) {
  const [convs, setConvs] = useState(null);
  const [chosen, setChosen] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !comm) return;
    setConvs(null); setChosen(""); setError("");
    (async () => {
      try {
        const list = await base44.agents.listConversations({ agent_name: "whatsapp_assistant" });
        const sorted = (list || []).slice().reverse();
        setConvs(sorted);
        const target = normalize(comm.original_content);
        const match = sorted.find((c) => (c.messages || []).some((m) => normalize(m.content).includes(target)));
        if (match) setChosen(match.id);
      } catch (e) {
        setConvs([]);
        setError("No se pudieron cargar las conversaciones de WhatsApp.");
      }
    })();
  }, [open, comm]);

  const send = async () => {
    const conv = (convs || []).find((c) => c.id === chosen);
    if (!conv || !draft?.trim()) return;
    setBusy(true);
    try {
      await base44.agents.addMessage(conv, { role: "user", content: `[RESPUESTA DEL DESPACHO] ${draft}` });
      await base44.entities.Communication.update(comm.id, {
        reply_original: reply, reply_translation: draft, status: "sent", approved_by: approvedBy,
      });
      onSent();
      onOpenChange(false);
    } catch (e) {
      setError(`No se pudo enviar por WhatsApp (${e.message || e}). Revise la conexión del cliente o envíe la respuesta por el portal.`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Enviar por WhatsApp</DialogTitle>
          <DialogDescription>
            Seleccione la conversación de WhatsApp de {comm?.client_name}. La respuesta se entregará en su chat, en su idioma.
          </DialogDescription>
        </DialogHeader>
        {convs === null ? (
          <p className="text-sm text-muted-foreground">Cargando conversaciones…</p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {convs.map((c) => {
              const lastUser = [...(c.messages || [])].reverse().find((m) => m.role === "user");
              return (
                <button key={c.id} type="button" onClick={() => setChosen(c.id)}
                  className={`w-full text-start p-3 rounded-xl border transition-colors ${chosen === c.id ? "border-primary bg-accent/60" : "border-border hover:bg-secondary"}`}>
                  <p className="text-sm font-medium truncate">{c.metadata?.name || comm?.client_name || "Cliente"}</p>
                  <p className="text-xs text-muted-foreground truncate">{lastUser?.content || "Sin mensajes"}</p>
                </button>
              );
            })}
            {!convs.length && (
              <p className="text-sm text-muted-foreground">
                No hay conversaciones de WhatsApp. El cliente debe conectar su WhatsApp desde el portal (Mensajes → Conectar WhatsApp).
              </p>
            )}
          </div>
        )}
        {error && <p className="text-xs text-red-700">{error}</p>}
        <DialogFooter>
          <Button onClick={send} disabled={!chosen || busy || !draft?.trim()}>
            <Send className="w-4 h-4 me-1" /> {busy ? "Enviando…" : "Enviar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}