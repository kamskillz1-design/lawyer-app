import React from "react";
import { base44 } from "@/api/base44Client";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

export default function WhatsAppConnectCard() {
  const { t } = useI18n();
  return (
    <div className="card-soft p-5 border-s-4 border-emerald-500/60">
      <h3 className="font-heading font-semibold flex items-center gap-2">
        <MessageCircle className="w-4 h-4 text-emerald-600 shrink-0" />
        {t("whatsapp_connect_title")}
      </h3>
      <p className="text-sm text-muted-foreground mt-1">{t("whatsapp_connect_body")}</p>
      <a href={base44.agents.getWhatsAppConnectURL("whatsapp_assistant")} target="_blank" rel="noreferrer">
        <Button variant="outline" className="rounded-xl mt-3">{t("whatsapp_connect_btn")}</Button>
      </a>
    </div>
  );
}