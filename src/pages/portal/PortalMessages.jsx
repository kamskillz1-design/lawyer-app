import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Send, MessageCircle, Building2, Mic } from "lucide-react";
import VoiceRecorder from "@/components/portal/VoiceRecorder";
import SpeakButton from "@/components/portal/SpeakButton";
import { formatDateTime } from "@/lib/format";
import { getLanguage } from "@/lib/languages";

export default function PortalMessages() {
  const { t, lang } = useI18n();
  const { toast } = useToast();
  const [data, setData] = useState(null);
  const [noAccess, setNoAccess] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [voiceBusy, setVoiceBusy] = useState(false);
  const [clientProfile, setClientProfile] = useState(null);

  const load = async () => {
    const me = await base44.auth.me();
    const [comms, clients] = await Promise.all([
      base44.entities.Communication.filter({ portal_user_id: me.id }),
      base44.entities.Client.filter({ portal_user_id: me.id }),
    ]);
    setData(comms.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
    setClientProfile(clients[0] || null);
  };
  useEffect(() => { load().catch(() => setNoAccess(true)); }, []);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    try {
      const me = await base44.auth.me();
      const clients = await base44.entities.Client.filter({ portal_user_id: me.id });
      const client = clients[0];
      if (!client) throw new Error("No linked client profile");
      await base44.entities.Communication.create({
        client_id: client.id, client_name: client.legal_name, portal_user_id: me.id,
        direction: "inbound", channel: "portal", sender: client.legal_name,
        original_language: client.written_language || lang, original_content: text,
        status: "received", sensitivity: "routine", action_required: true,
      });
      setText("");
      toast({ title: t("sent_success") });
      load();
    } finally {
      setSending(false);
    }
  };

  const sendVoice = async (blob) => {
    setVoiceBusy(true);
    try {
      const file = new File([blob], "voice-note.webm", { type: blob.type || "audio/webm" });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const res = await base44.functions.invoke("transcribeVoiceNote", { file_url });
      const transcript = (res.data && res.data.transcript) || "";
      if (!transcript.trim()) throw new Error("empty transcript");
      const me = await base44.auth.me();
      const client = clientProfile || (await base44.entities.Client.filter({ portal_user_id: me.id }))[0];
      if (!client) throw new Error("No linked client profile");
      await base44.entities.Communication.create({
        client_id: client.id, client_name: client.legal_name, portal_user_id: me.id,
        direction: "inbound", channel: "portal", sender: client.legal_name,
        original_language: client.written_language || lang, original_content: transcript,
        audio_url: file_url,
        status: "received", sensitivity: "routine", action_required: true,
      });
      toast({ title: t("sent_success") });
      load();
    } catch (e) {
      toast({ title: t("voice_error"), variant: "destructive" });
    } finally {
      setVoiceBusy(false);
    }
  };

  if (noAccess) return <p className="p-6 text-muted-foreground">No client profile is linked to this account yet. Please contact the office.</p>;
  if (!data) return <p className="text-muted-foreground">{t("loading")}</p>;

  return (
    <div className="space-y-6" dir={getLanguage(lang)?.rtl ? "rtl" : "ltr"}>
      <h1 className="font-heading text-3xl font-bold">{t("messages_title")}</h1>

      <form onSubmit={send} className="card-soft p-5">
        <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={t("message_placeholder")}
          className="w-full min-h-28 rounded-xl border border-input bg-card p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" />
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <Button type="submit" className="rounded-xl" disabled={sending || !text.trim()}>
            <Send className="w-4 h-4 me-1" /> {sending ? t("loading") : t("send")}
          </Button>
          <VoiceRecorder
            busy={voiceBusy}
            onRecorded={sendVoice}
            labels={{
              start: t("record_voice"), stop: t("stop_recording"),
              sending: t("voice_sending"), noMic: t("voice_error"),
            }}
          />
        </div>
      </form>

      <div className="space-y-3">
        {data.map((c) => {
          const replyLang = getLanguage(c.original_language || lang);
          return (
            <div key={c.id} className="card-soft p-4 space-y-3">
              <div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                  <MessageCircle className="w-3.5 h-3.5" /> {t("your_message")} · {formatDateTime(c.created_date)}
                </p>
                <div className="flex items-start gap-2">
                  <p className="text-sm bg-secondary/70 rounded-xl p-3 flex-1">{c.original_content}</p>
                  <SpeakButton text={c.original_content} lang={clientProfile?.written_language || c.original_language || lang} label={t("listen")} />
                </div>
                {c.audio_url && (
                  <div className="flex items-center gap-2 mt-2">
                    <Mic className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <audio controls src={c.audio_url} className="h-9 w-full max-w-xs" />
                  </div>
                )}
              </div>
              {c.reply_translation && (
                <div dir={replyLang.rtl ? "rtl" : "ltr"}>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                    <Building2 className="w-3.5 h-3.5" /> {t("office_reply")}
                  </p>
                  <div className="flex items-start gap-2">
                    <p className="text-sm bg-primary/10 text-primary rounded-xl p-3 flex-1">{c.reply_translation}</p>
                    <SpeakButton text={c.reply_translation} lang={clientProfile?.written_language || lang} label={t("listen")} />
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {!data.length && <p className="text-sm text-muted-foreground">{t("no_messages")}</p>}
      </div>
    </div>
  );
}