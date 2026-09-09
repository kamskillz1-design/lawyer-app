import React from "react";
import { Button } from "@/components/ui/button";
import { Languages, Send, CheckCircle2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { getLanguage } from "@/lib/languages";

// Reply card: Spanish draft in, translated client-language draft out.
// Translation and sending stay in the parent page.
export default function ReplyComposer({
  selected, client, reply, draft, busy, needsLawyer, approved,
  onReplyChange, onGenerateDraft, onApprove, onSend, onWaOpen,
}) {
  const { t } = useI18n();
  return (
    <div className="card-soft p-5">
      <h3 className="font-heading font-semibold mb-3">{t("msg_reply_title")}</h3>
      <textarea value={reply} onChange={(e) => onReplyChange(e.target.value)}
        placeholder={t("msg_reply_placeholder")}
        className="w-full min-h-24 rounded-xl border border-input bg-card p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" />
      <div className="flex flex-wrap gap-2 mt-2">
        <Button variant="outline" className="rounded-xl" onClick={onGenerateDraft} disabled={busy === "draft" || !reply.trim()}>
          <Languages className="w-4 h-4 me-1" />
          {busy === "draft" ? t("generating") : `${t("msg_generate_prefix")} ${getLanguage(client?.written_language || "en").native}`}
        </Button>
        {needsLawyer && !approved && (
          <Button variant="outline" className="rounded-xl text-primary" onClick={onApprove}>
            <CheckCircle2 className="w-4 h-4 me-1" /> {t("msg_approve")}
          </Button>
        )}
        {selected.channel === "whatsapp" ? (
          <Button className="rounded-xl ms-auto" onClick={onWaOpen}
            disabled={!draft.trim() || (needsLawyer && !approved)}>
            <Send className="w-4 h-4 me-1" /> {t("msg_send_whatsapp")}
          </Button>
        ) : (
          <Button className="rounded-xl ms-auto" onClick={onSend}
            disabled={!draft.trim() || (needsLawyer && !approved)}>
            <Send className="w-4 h-4 me-1" /> {t("msg_send_client")}
          </Button>
        )}
      </div>
      {draft && (
        <div className="mt-3 p-4 rounded-xl bg-accent/50">
          <p className="text-xs text-muted-foreground mb-1">{t("msg_draft_hint")}</p>
          <p dir={getLanguage(client?.written_language || "").rtl ? "rtl" : "ltr"} className="text-sm">{draft}</p>
        </div>
      )}
    </div>
  );
}