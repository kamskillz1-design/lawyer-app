import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Languages, Send, Gavel, CheckCircle2, ListPlus, AlertTriangle, Mic } from "lucide-react";
import { SENSITIVITIES, sensitivityLabel } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";
import { getLanguage } from "@/lib/languages";
import StatusBadge from "@/components/StatusBadge";

const CONFIDENCE_HINT = {
  normal: "Traducción fiable",
  review_recommended: "Revisar antes de enviar",
  uncertain: "Traducción dudosa — considerar traducción humana",
  human_required: "Requiere traducción/intérprete humano",
};

export default function Communications() {
  const { toast } = useToast();
  const [comms, setComms] = useState(null);
  const [clients, setClients] = useState([]);
  const [selected, setSelected] = useState(null);
  const [reply, setReply] = useState("");
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState("");
  const [approved, setApproved] = useState(false);
  const [me, setMe] = useState(null);

  const reload = async () => {
    const [cs, cls] = await Promise.all([
      base44.entities.Communication.list("-created_date"),
      base44.entities.Client.list(),
    ]);
    setComms(cs);
    setClients(cls);
  };
  useEffect(() => {
    reload();
    base44.auth.me().then(setMe).catch(() => {});
  }, []);

  const select = (c) => {
    setSelected(c);
    setReply(c.reply_original || "");
    setDraft(c.reply_translation || "");
    setApproved(!!c.approved_by);
  };

  const clientOf = (c) => clients.find((x) => x.id === c?.client_id);
  const needsLawyer = selected && ["lawyer_review", "urgent"].includes(selected.sensitivity);

  const translateIncoming = async () => {
    setBusy("incoming");
    try {
      const res = await base44.functions.invoke("aiTranslate", {
        mode: "translate", text: selected.original_content,
        source_language: selected.original_language || "", target_language: "es",
      });
      const { translation, confidence, source_language_detected } = res.data;
      await base44.entities.Communication.update(selected.id, {
        staff_translation: translation, translation_method: "ai",
        translation_confidence: confidence || "review_recommended",
        original_language: selected.original_language || source_language_detected || "",
        status: "pending_review",
      });
      reload();
      setSelected({ ...selected, staff_translation: translation, translation_confidence: confidence, status: "pending_review" });
      toast({ title: "Traducción generada", description: CONFIDENCE_HINT[confidence] || "" });
    } catch (e) {
      toast({ title: "Error de traducción", description: e.message, variant: "destructive" });
    } finally {
      setBusy("");
    }
  };

  const generateDraft = async () => {
    if (!reply.trim()) return;
    setBusy("draft");
    try {
      const lang = clientOf(selected)?.written_language || "en";
      const res = await base44.functions.invoke("aiTranslate", {
        mode: "draft_reply", reply_text: reply, target_language: lang,
        context: `Expediente: ${selected.matter_number || ""}; idioma del cliente: ${lang}`,
      });
      setDraft(res.data.translation);
      toast({ title: `Borrador generado en ${getLanguage(lang).native}`, description: CONFIDENCE_HINT[res.data.confidence] || "" });
    } catch (e) {
      toast({ title: "Error generando borrador", description: e.message, variant: "destructive" });
    } finally {
      setBusy("");
    }
  };

  const send = async () => {
    if (!draft.trim()) return;
    await base44.entities.Communication.update(selected.id, {
      reply_original: reply, reply_translation: draft,
      status: "sent", approved_by: me?.full_name || "Personal",
    });
    await base44.entities.AuditLog.create({
      entity_type: "Communication", entity_id: selected.id, action: "sent",
      actor_name: me?.full_name || "Personal",
      summary: `Respuesta enviada a ${selected.client_name} (traducción IA revisada)`,
    });
    reload();
    select({ ...selected, status: "sent", reply_original: reply, reply_translation: draft });
    toast({ title: "Respuesta enviada", description: "El cliente la verá en su portal en su idioma." });
  };

  const escalate = async () => {
    await base44.entities.Communication.update(selected.id, { sensitivity: "lawyer_review", status: "lawyer_pending" });
    reload();
    select({ ...selected, sensitivity: "lawyer_review", status: "lawyer_pending" });
    toast({ title: "Escalada a la letrada" });
  };

  const approveAsLawyer = async () => {
    setApproved(true);
    toast({ title: "Aprobación registrada", description: `${me?.full_name || ""} aprobó el contenido legal.` });
  };

  const createTask = async () => {
    await base44.entities.Task.create({
      title: `Seguimiento mensaje: ${selected.client_name}`,
      matter_id: selected.matter_id || "", client_id: selected.client_id,
      matter_number: selected.matter_number || "", owner: me?.full_name || "",
      task_type: "general", status: "todo", priority: "high",
    });
    toast({ title: "Tarea creada" });
  };

  if (!comms) return <p className="text-muted-foreground">Cargando…</p>;

  const pending = comms.filter((c) => c.status !== "sent" && c.status !== "internal_note");

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-3xl font-bold">Centro de mensajes y traducción</h1>

      <div className="grid lg:grid-cols-[340px_1fr] gap-4">
        <div className="card-soft p-2 h-fit lg:max-h-[70vh] overflow-y-auto">
          {pending.map((c) => (
            <button key={c.id} onClick={() => select(c)}
              className={`w-full text-start p-3 rounded-xl hover:bg-secondary transition-colors ${selected?.id === c.id ? "bg-secondary" : ""}`}>
              <p className="font-medium text-sm flex items-center justify-between">
                {c.client_name}
                <StatusBadge value={c.status} />
              </p>
              <p className="text-xs text-muted-foreground truncate">{c.original_content}</p>
              {c.audio_url && <span className="inline-flex items-center gap-1 text-[10px] text-primary mt-0.5"><Mic className="w-3 h-3" /> nota de voz</span>}
              <p className="text-[10px] text-muted-foreground mt-1">
                {c.original_language} · {c.channel} · {sensitivityLabel(c.sensitivity)}
              </p>
            </button>
          ))}
          {!pending.length && <p className="text-sm text-muted-foreground p-3">Sin mensajes pendientes.</p>}

          {comms.some((c) => c.status === "sent") && (
            <details className="p-2">
              <summary className="text-xs text-muted-foreground cursor-pointer p-1">Enviados ({comms.filter((c) => c.status === "sent").length})</summary>
              {comms.filter((c) => c.status === "sent").slice(0, 8).map((c) => (
                <button key={c.id} onClick={() => select(c)} className="w-full text-start p-2 rounded-lg hover:bg-secondary">
                  <p className="text-xs font-medium">{c.client_name}</p>
                  <p className="text-[10px] text-muted-foreground">{formatDateTime(c.created_date)}</p>
                </button>
              ))}
            </details>
          )}
        </div>

        <div className="space-y-4">
          {!selected && <div className="card-soft p-8 text-center text-muted-foreground">Seleccione un mensaje para gestionarlo.</div>}
          {selected && (
            <>
              <div className="card-soft p-5">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground text-sm">{selected.client_name}</span>
                  <span>· {selected.channel} · {selected.original_language} · {formatDateTime(selected.created_date)}</span>
                  <StatusBadge value={selected.status} />
                  {needsLawyer && !approved && <span className="flex items-center gap-1 text-red-700 font-medium"><Gavel className="w-3 h-3" /> requiere aprobación letrada</span>}
                </div>

                <div dir={getLanguage(selected.original_language || "").rtl ? "rtl" : "ltr"} className="mt-4 p-4 rounded-xl bg-secondary/70">
                  <p className="text-sm">{selected.original_content}</p>
                  {selected.audio_url && (
                    <div className="flex items-center gap-2 mt-3">
                      <Mic className="w-4 h-4 text-primary shrink-0" />
                      <span className="text-[10px] text-muted-foreground">Transcrito automáticamente de la nota de voz original:</span>
                      <audio controls src={selected.audio_url} className="h-9 w-full max-w-sm" />
                    </div>
                  )}
                </div>

                {selected.staff_translation ? (
                  <div className="mt-3 p-4 rounded-xl border-s-4 border-primary/40 bg-card">
                    <p className="text-xs text-muted-foreground mb-1">Traducción al español (IA{selected.translation_confidence ? ` · ${CONFIDENCE_HINT[selected.translation_confidence]}` : ""})</p>
                    <p className="text-sm">{selected.staff_translation}</p>
                  </div>
                ) : (
                  <Button variant="outline" className="rounded-xl mt-3" onClick={translateIncoming} disabled={busy === "incoming"}>
                    <Languages className="w-4 h-4 me-1" /> {busy === "incoming" ? "Traduciendo…" : "Traducir al español"}
                  </Button>
                )}

                <div className="flex flex-wrap items-center gap-2 mt-4">
                  <select className="h-8 rounded-md border border-input bg-card px-2 text-xs" value={selected.sensitivity}
                    onChange={async (e) => {
                      await base44.entities.Communication.update(selected.id, { sensitivity: e.target.value });
                      select({ ...selected, sensitivity: e.target.value });
                      reload();
                    }}>
                    {SENSITIVITIES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                  <Button size="sm" variant="outline" className="rounded-lg text-red-700" onClick={escalate}>
                    <AlertTriangle className="w-3.5 h-3.5 me-1" /> Escalar a letrada
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-lg" onClick={createTask}>
                    <ListPlus className="w-3.5 h-3.5 me-1" /> Crear tarea
                  </Button>
                </div>
              </div>

              <div className="card-soft p-5">
                <h3 className="font-heading font-semibold mb-3">Respuesta</h3>
                <textarea value={reply} onChange={(e) => setReply(e.target.value)}
                  placeholder="Escriba la respuesta en español…"
                  className="w-full min-h-24 rounded-xl border border-input bg-card p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" />
                <div className="flex flex-wrap gap-2 mt-2">
                  <Button variant="outline" className="rounded-xl" onClick={generateDraft} disabled={busy === "draft" || !reply.trim()}>
                    <Languages className="w-4 h-4 me-1" />
                    {busy === "draft" ? "Generando…" : `Generar borrador en ${getLanguage(clientOf(selected)?.written_language || "en").native}`}
                  </Button>
                  {needsLawyer && !approved && (
                    <Button variant="outline" className="rounded-xl text-primary" onClick={approveAsLawyer}>
                      <CheckCircle2 className="w-4 h-4 me-1" /> Aprobar (letrada)
                    </Button>
                  )}
                  <Button className="rounded-xl ms-auto" onClick={send}
                    disabled={!draft.trim() || (needsLawyer && !approved)}>
                    <Send className="w-4 h-4 me-1" /> Enviar al cliente
                  </Button>
                </div>
                {draft && (
                  <div className="mt-3 p-4 rounded-xl bg-accent/50">
                    <p className="text-xs text-muted-foreground mb-1">Borrador en el idioma del cliente (revisar antes de enviar):</p>
                    <p dir={getLanguage(clientOf(selected)?.written_language || "").rtl ? "rtl" : "ltr"} className="text-sm">{draft}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}