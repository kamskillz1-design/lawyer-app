import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/components/ui/use-toast";
import { confidenceHint } from "@/lib/constants";
import { getLanguage } from "@/lib/languages";
import { inputClass as input } from "@/lib/formStyles";

export default function StaffComposeDialog({ open, onOpenChange, clients, preselectId, approvedBy, onSent }) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [clientId, setClientId] = useState(preselectId || "");
  const [spanish, setSpanish] = useState("");
  const [draft, setDraft] = useState("");
  const [confidence, setConfidence] = useState("");
  const [busy, setBusy] = useState("");

  useEffect(() => {
    if (open) {
      setClientId(preselectId || "");
      setSpanish("");
      setDraft("");
      setConfidence("");
    }
  }, [open, preselectId]);

  const client = clients.find((c) => c.id === clientId);
  const hasPortal = !!(client && client.portal_user_id);
  const targetLang = client?.written_language || "en";

  const translate = async () => {
    if (!clientId) { toast({ title: t("compose_need_client"), variant: "destructive" }); return; }
    if (!spanish.trim()) { toast({ title: t("compose_need_text"), variant: "destructive" }); return; }
    setBusy("draft");
    try {
      const res = await base44.functions.invoke("aiTranslate", {
        mode: "draft_reply",
        reply_text: spanish,
        target_language: targetLang,
        context: `Cliente: ${client.legal_name}; idioma: ${targetLang}`,
      });
      setDraft(res.data?.translation || spanish);
      setConfidence(res.data?.confidence || "review_recommended");
      toast({ title: `${t("draft_generated_prefix")} ${getLanguage(targetLang).native}`, description: confidenceHint(res.data?.confidence, t) || "" });
    } catch (e) {
      toast({ title: t("toast_draft_err"), description: e.message, variant: "destructive" });
    } finally {
      setBusy("");
    }
  };

  const send = async () => {
    if (!hasPortal) return;
    if (!draft.trim() || !spanish.trim()) return;
    setBusy("send");
    try {
      await base44.entities.Communication.create({
        client_id: client.id,
        client_name: client.legal_name,
        portal_user_id: client.portal_user_id,
        direction: "outbound",
        channel: "portal",
        sender: approvedBy || "Personal",
        original_language: "es",
        original_content: spanish,
        reply_original: spanish,
        reply_translation: draft,
        status: "sent",
        approved_by: approvedBy || "Personal",
        sensitivity: "routine",
        action_required: false,
      });
      toast({ title: t("toast_reply_sent"), description: t("toast_reply_sent_body") });
      onOpenChange(false);
      if (onSent) onSent();
    } catch (e) {
      toast({ title: t("send_error"), description: e.message, variant: "destructive" });
    } finally {
      setBusy("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{t("new_message")}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground">{t("compose_pick_client")}</label>
            <select className={input} value={clientId} onChange={(e) => { setClientId(e.target.value); setDraft(""); }}>
              <option value="">{t("ph_client_required")}</option>
              {clients.filter((c) => c.status !== "archived").map((c) => (
                <option key={c.id} value={c.id}>{c.legal_name}</option>
              ))}
            </select>
          </div>
          {client && !hasPortal && (
            <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-3">{t("compose_no_portal")}</p>
          )}
          <div>
            <label className="text-xs text-muted-foreground">{t("compose_spanish")}</label>
            <textarea className={input + " min-h-28 py-2"} value={spanish} onChange={(e) => setSpanish(e.target.value)} />
          </div>
          <Button variant="outline" className="rounded-xl" onClick={translate} disabled={busy === "draft" || !hasPortal}>
            {busy === "draft" ? t("loading") : t("compose_translate")}
          </Button>
          {draft && (
            <div className="p-3 rounded-xl bg-accent/50">
              <p className="text-xs text-muted-foreground mb-1">
                {t("msg_draft_hint")} {confidence ? `· ${confidenceHint(confidence, t)}` : ""}
              </p>
              <p className="text-sm" dir={getLanguage(targetLang).rtl ? "rtl" : "ltr"}>{draft}</p>
            </div>
          )}
          <Button className="w-full rounded-xl" onClick={send} disabled={!draft.trim() || !hasPortal || busy === "send"}>
            {busy === "send" ? t("loading") : t("compose_send")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
