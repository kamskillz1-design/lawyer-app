import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { CONFIDENCE_HINT } from "@/lib/constants";
import { getLanguage } from "@/lib/languages";
import InlineMessage from "@/components/InlineMessage";
import MessageList from "@/components/communication/MessageList";
import MessageDetail from "@/components/communication/MessageDetail";
import ReplyComposer from "@/components/communication/ReplyComposer";
import WhatsAppReplyDialog from "@/components/communication/WhatsAppReplyDialog";

// Communications center: owns message data, translation and sending flows.
// Presentation is delegated to MessageList, MessageDetail and ReplyComposer.
export default function Communications() {
  const { toast } = useToast();
  const [comms, setComms] = useState(null);
  const [clients, setClients] = useState([]);
  const [selected, setSelected] = useState(null);
  const [reply, setReply] = useState("");
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState("");
  const [approved, setApproved] = useState(false);
  const [waOpen, setWaOpen] = useState(false);
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

  const handleWaSent = () => {
    reload();
    select({ ...selected, status: "sent", reply_original: reply, reply_translation: draft });
    toast({ title: "Respuesta enviada por WhatsApp", description: "El cliente la recibirá en su chat de WhatsApp." });
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

  const changeSensitivity = async (value) => {
    await base44.entities.Communication.update(selected.id, { sensitivity: value });
    select({ ...selected, sensitivity: value });
    reload();
  };

  const applyTranscription = (text) => {
    select({ ...selected, original_content: text, transcription_status: "done" });
    reload();
  };

  if (!comms) return <InlineMessage />;

  const pending = comms.filter((c) => c.status !== "sent" && c.status !== "internal_note");

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-3xl font-bold">Centro de mensajes y traducción</h1>

      <div className="grid lg:grid-cols-[340px_1fr] gap-4">
        <MessageList comms={comms} pending={pending} selected={selected} onSelect={select} />

        <div className="space-y-4">
          {!selected && <div className="card-soft p-8 text-center text-muted-foreground">Seleccione un mensaje para gestionarlo.</div>}
          {selected && (
            <>
              <MessageDetail
                selected={selected}
                needsLawyer={needsLawyer}
                approved={approved}
                busy={busy}
                onTranslate={translateIncoming}
                onSensitivityChange={changeSensitivity}
                onEscalate={escalate}
                onCreateTask={createTask}
                onTranscribed={applyTranscription}
              />
              <ReplyComposer
                selected={selected}
                client={clientOf(selected)}
                reply={reply}
                draft={draft}
                busy={busy}
                needsLawyer={needsLawyer}
                approved={approved}
                onReplyChange={setReply}
                onGenerateDraft={generateDraft}
                onApprove={approveAsLawyer}
                onSend={send}
                onWaOpen={() => setWaOpen(true)}
              />
            </>
          )}
          <WhatsAppReplyDialog
            comm={selected} reply={reply} draft={draft}
            approvedBy={me?.full_name || "Personal"}
            open={waOpen} onOpenChange={setWaOpen} onSent={handleWaSent}
          />
        </div>
      </div>
    </div>
  );
}