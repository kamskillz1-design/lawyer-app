import React, { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { me as authMe } from "@/api/auth";
import { supabase } from "@/api/supabaseClient";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Plus } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { confidenceHint } from "@/lib/constants";
import { getLanguage } from "@/lib/languages";
import InlineMessage from "@/components/InlineMessage";
import MessageList from "@/components/communication/MessageList";
import MessageDetail from "@/components/communication/MessageDetail";
import ReplyComposer from "@/components/communication/ReplyComposer";
import WhatsAppReplyDialog from "@/components/communication/WhatsAppReplyDialog";
import StaffComposeDialog from "@/components/communication/StaffComposeDialog";

export default function Communications() {
  const { toast } = useToast();
  const { t } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const [comms, setComms] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [clients, setClients] = useState([]);
  const [selected, setSelected] = useState(null);
  const [reply, setReply] = useState("");
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState("");
  const [approved, setApproved] = useState(false);
  const [waOpen, setWaOpen] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [me, setMe] = useState(null);
  const selectedRef = useRef(null);
  selectedRef.current = selected;

  const reload = async () => {
    setLoadError(false);
    try {
      const [cs, cls] = await Promise.all([
        base44.entities.Communication.list("-created_date"),
        base44.entities.Client.list(),
      ]);
      setComms(cs);
      setClients(cls);
      return cs;
    } catch {
      setLoadError(true);
      return null;
    }
  };
  useEffect(() => {
    reload();
    authMe().then(setMe).catch(() => {});
  }, []);

  useEffect(() => {
    const pre = searchParams.get("client");
    if (pre) {
      setComposeOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    const channel = supabase
      .channel("staff-communications")
      .on("postgres_changes", { event: "*", schema: "public", table: "communications" }, () => {
        reload().then((fresh) => syncSelected(fresh, selectedRef.current));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const syncSelected = (fresh, prev) => {
    if (!prev || !fresh) return;
    const updated = fresh.find((c) => c.id === prev.id);
    if (updated) setSelected(updated);
    else setSelected(null);
  };

  const select = (c) => {
    setSelected(c);
    setReply(c.reply_original || "");
    setDraft(c.reply_translation || "");
    setApproved(!!c.approved_by);
    window.scrollTo({ top: 0 });
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
      const fresh = await reload();
      syncSelected(fresh, selected);
      toast({ title: t("toast_translation_ok"), description: confidenceHint(confidence, t) || "" });
    } catch (e) {
      toast({ title: t("toast_translation_err"), description: e.message, variant: "destructive" });
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
      toast({ title: `${t("draft_generated_prefix")} ${getLanguage(lang).native}`, description: confidenceHint(res.data.confidence, t) || "" });
    } catch (e) {
      toast({ title: t("toast_draft_err"), description: e.message, variant: "destructive" });
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
    const fresh = await reload();
    syncSelected(fresh, selected);
    toast({ title: t("toast_reply_sent"), description: t("toast_reply_sent_body") });
  };

  const handleWaSent = () => {
    reload().then((fresh) => syncSelected(fresh, selected));
    toast({ title: t("toast_wa_sent"), description: t("toast_wa_sent_body") });
  };

  const escalate = async () => {
    await base44.entities.Communication.update(selected.id, { sensitivity: "lawyer_review", status: "lawyer_pending" });
    const fresh = await reload();
    syncSelected(fresh, selected);
    toast({ title: t("toast_escalated") });
  };

  const approveAsLawyer = async () => {
    setApproved(true);
    toast({ title: t("toast_approval"), description: `${me?.full_name || ""} ${t("toast_approval_body")}`.trim() });
  };

  const createTask = async () => {
    await base44.entities.Task.create({
      title: `Seguimiento mensaje: ${selected.client_name}`,
      matter_id: selected.matter_id || "", client_id: selected.client_id,
      matter_number: selected.matter_number || "", owner: me?.full_name || "",
      task_type: "general", status: "todo", priority: "high",
    });
    toast({ title: t("toast_task_created") });
  };

  const changeSensitivity = async (value) => {
    await base44.entities.Communication.update(selected.id, { sensitivity: value });
    const fresh = await reload();
    syncSelected(fresh, selected);
  };

  const applyTranscription = () => {
    reload().then((fresh) => syncSelected(fresh, selected));
  };

  const deleteSelected = async () => {
    if (!selected) return;
    if (!window.confirm("¿Eliminar este mensaje? / Delete this message?")) return;
    try {
      await base44.entities.Communication.delete(selected.id);
      setSelected(null);
      await reload();
      toast({ title: t("saved") });
    } catch (e) {
      toast({ title: t("load_error"), description: e.message, variant: "destructive" });
    }
  };

  if (loadError) return (
    <div className="card-soft p-6 space-y-3">
      <p className="text-sm text-muted-foreground">{t("load_error")}</p>
      <Button size="sm" variant="outline" className="rounded-lg" onClick={reload}>{t("retry")}</Button>
    </div>
  );
  if (!comms) return <InlineMessage />;

  const pending = comms.filter((c) => c.status !== "sent" && c.status !== "internal_note");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-3xl font-bold">{t("msg_center_title")}</h1>
        <Button className="rounded-xl" onClick={() => setComposeOpen(true)}>
          <Plus className="w-4 h-4 me-1" /> {t("new_message")}
        </Button>
      </div>
      <div className="grid lg:grid-cols-[340px_1fr] gap-4 items-start">
        <div className={selected ? "hidden lg:block" : ""}>
          <MessageList comms={comms} pending={pending} selected={selected} onSelect={select} />
        </div>
        <div className="space-y-4">
          {selected && (
            <Button variant="outline" className="rounded-xl lg:hidden" onClick={() => setSelected(null)}>
              <ArrowLeft className="w-4 h-4 me-1" /> {t("back_to_list")}
            </Button>
          )}
          {!selected && <div className="card-soft p-8 text-center text-muted-foreground">{t("select_message")}</div>}
          {selected && (
            <>
              <MessageDetail selected={selected} needsLawyer={needsLawyer} approved={approved} busy={busy}
                onTranslate={translateIncoming} onSensitivityChange={changeSensitivity} onEscalate={escalate}
                onCreateTask={createTask} onTranscribed={applyTranscription} onDelete={deleteSelected} />
              <ReplyComposer selected={selected} client={clientOf(selected)} reply={reply} draft={draft} busy={busy}
                needsLawyer={needsLawyer} approved={approved} onReplyChange={setReply} onGenerateDraft={generateDraft}
                onApprove={approveAsLawyer} onSend={send} onWaOpen={() => setWaOpen(true)} />
            </>
          )}
          <WhatsAppReplyDialog comm={selected} reply={reply} draft={draft} approvedBy={me?.full_name || "Personal"}
            open={waOpen} onOpenChange={setWaOpen} onSent={handleWaSent} />
        </div>
      </div>
      <StaffComposeDialog
        open={composeOpen}
        onOpenChange={(v) => {
          setComposeOpen(v);
          if (!v && searchParams.get("client")) {
            searchParams.delete("client");
            setSearchParams(searchParams, { replace: true });
          }
        }}
        clients={clients}
        preselectId={searchParams.get("client") || ""}
        approvedBy={me?.full_name || "Personal"}
        onSent={() => reload().then((fresh) => syncSelected(fresh, selectedRef.current))}
      />
    </div>
  );
}
