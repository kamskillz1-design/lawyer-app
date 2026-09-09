import React from "react";
import { Mic, MessageCircle } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { sensitivityLabel } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";
import StatusBadge from "@/components/StatusBadge";

// Pending/sent message sidebar of the communications center.
export default function MessageList({ comms, pending, selected, onSelect }) {
  const { t } = useI18n();
  const sent = comms.filter((c) => c.status === "sent");
  return (
    <div className="card-soft p-2 h-fit lg:max-h-[70vh] overflow-y-auto">
      {pending.map((c) => (
        <button key={c.id} onClick={() => onSelect(c)}
          className={`w-full text-start p-3 rounded-xl hover:bg-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${selected?.id === c.id ? "bg-secondary" : ""}`}>
          <p className="font-medium text-sm flex items-center justify-between gap-2 min-w-0">
            <span className="truncate">{c.client_name}</span>
            {c.channel === "whatsapp" && (
              <span className="inline-flex items-center gap-1 shrink-0 text-[10px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                <MessageCircle className="w-3 h-3" /> WhatsApp
              </span>
            )}
            <StatusBadge value={c.status} />
          </p>
          <p className="text-xs text-muted-foreground truncate">{c.original_content}</p>
          {c.audio_url && <span className="inline-flex items-center gap-1 text-[10px] text-primary mt-0.5"><Mic className="w-3 h-3" /> {t("msg_voice_note")}</span>}
          {c.transcription_status === "failed" && <span className="block text-[10px] text-amber-700 font-medium mt-0.5">{t("msg_trans_failed")}</span>}
          <p className="text-[10px] text-muted-foreground mt-1">
            {c.original_language} · {c.channel} · {sensitivityLabel(c.sensitivity, t)}
          </p>
        </button>
      ))}
      {!pending.length && <p className="text-sm text-muted-foreground p-3">{t("msg_no_pending")}</p>}

      {sent.length > 0 && (
        <details className="p-2">
          <summary className="text-xs text-muted-foreground cursor-pointer p-1">{t("msg_sent_section")} ({sent.length})</summary>
          {sent.slice(0, 8).map((c) => (
            <button key={c.id} onClick={() => onSelect(c)}
              className={`w-full text-start p-2 rounded-lg hover:bg-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${selected?.id === c.id ? "bg-secondary" : ""}`}>
              <p className="text-xs font-medium">{c.client_name}</p>
              <p className="text-[10px] text-muted-foreground">{formatDateTime(c.created_date)}</p>
            </button>
          ))}
        </details>
      )}
    </div>
  );
}