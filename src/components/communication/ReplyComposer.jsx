import React from "react";
import { Button } from "@/components/ui/button";
import { Languages, Send, CheckCircle2 } from "lucide-react";
import { getLanguage } from "@/lib/languages";

// Reply card: Spanish draft in, translated client-language draft out.
// Translation and sending stay in the parent page.
export default function ReplyComposer({
  selected, client, reply, draft, busy, needsLawyer, approved,
  onReplyChange, onGenerateDraft, onApprove, onSend, onWaOpen,
}) {
  return (
    <div className="card-soft p-5">
      <h3 className="font-heading font-semibold mb-3">Respuesta</h3>
      <textarea value={reply} onChange={(e) => onReplyChange(e.target.value)}
        placeholder="Escriba la respuesta en español…"
        className="w-full min-h-24 rounded-xl border border-input bg-card p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" />
      <div className="flex flex-wrap gap-2 mt-2">
        <Button variant="outline" className="rounded-xl" onClick={onGenerateDraft} disabled={busy === "draft" || !reply.trim()}>
          <Languages className="w-4 h-4 me-1" />
          {busy === "draft" ? "Generando…" : `Generar borrador en ${getLanguage(client?.written_language || "en").native}`}
        </Button>
        {needsLawyer && !approved && (
          <Button variant="outline" className="rounded-xl text-primary" onClick={onApprove}>
            <CheckCircle2 className="w-4 h-4 me-1" /> Aprobar (letrada)
          </Button>
        )}
        {selected.channel === "whatsapp" ? (
          <Button className="rounded-xl ms-auto" onClick={onWaOpen}
            disabled={!draft.trim() || (needsLawyer && !approved)}>
            <Send className="w-4 h-4 me-1" /> Enviar por WhatsApp
          </Button>
        ) : (
          <Button className="rounded-xl ms-auto" onClick={onSend}
            disabled={!draft.trim() || (needsLawyer && !approved)}>
            <Send className="w-4 h-4 me-1" /> Enviar al cliente
          </Button>
        )}
      </div>
      {draft && (
        <div className="mt-3 p-4 rounded-xl bg-accent/50">
          <p className="text-xs text-muted-foreground mb-1">Borrador en el idioma del cliente (revisar antes de enviar):</p>
          <p dir={getLanguage(client?.written_language || "").rtl ? "rtl" : "ltr"} className="text-sm">{draft}</p>
        </div>
      )}
    </div>
  );
}