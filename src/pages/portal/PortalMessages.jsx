import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Send, MessageCircle, Building2 } from "lucide-react";
import { formatDateTime } from "@/lib/format";
import { getLanguage } from "@/lib/languages";

export default function PortalMessages() {
  const { t, lang } = useI18n();
  const { toast } = useToast();
  const [data, setData] = useState(null);
  const [noAccess, setNoAccess] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const load = async () => {
    const comms = await base44.entities.Communication.filter({ portal_user_id: (await base44.auth.me()).id });
    setData(comms.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
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

  if (noAccess) return <p className="p-6 text-muted-foreground">No client profile is linked to this account yet. Please contact the office.</p>;
  if (!data) return <p className="text-muted-foreground">{t("loading")}</p>;

  return (
    <div className="space-y-6" dir={getLanguage(lang)?.rtl ? "rtl" : "ltr"}>
      <h1 className="font-heading text-3xl font-bold">{t("messages_title")}</h1>

      <form onSubmit={send} className="card-soft p-5">
        <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={t("message_placeholder")}
          className="w-full min-h-28 rounded-xl border border-input bg-card p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" />
        <Button type="submit" className="rounded-xl mt-3" disabled={sending || !text.trim()}>
          <Send className="w-4 h-4 me-1" /> {sending ? t("loading") : t("send")}
        </Button>
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
                <p className="text-sm bg-secondary/70 rounded-xl p-3">{c.original_content}</p>
              </div>
              {c.reply_translation && (
                <div dir={replyLang.rtl ? "rtl" : "ltr"}>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                    <Building2 className="w-3.5 h-3.5" /> {t("office_reply")}
                  </p>
                  <p className="text-sm bg-primary/10 text-primary rounded-xl p-3">{c.reply_translation}</p>
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