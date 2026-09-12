import React from "react";
import { Button } from "@/components/ui/button";
import { Languages, Gavel, AlertTriangle, ListPlus, Mic, MessageCircle, Trash2 } from "lucide-react";
import { SENSITIVITIES, confidenceHint } from "@/lib/constants";
import { useI18n } from "@/lib/i18n";
import { formatDateTime } from "@/lib/format";
import { getLanguage } from "@/lib/languages";
import StatusBadge from "@/components/StatusBadge";
import TranscribeManually from "@/components/communication/TranscribeManually";

export default function MessageDetail({
  selected, needsLawyer, approved, busy,
  onTranslate, onSensitivityChange, onEscalate, onCreateTask, onTranscribed, onDelete,
}) {
  const { t } = useI18n();
  return (
    <div className="card-soft p-5">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className="font-medium text-foreground text-sm">{selected.client_name}</span>
        <span>· {selected.channel} · {selected.original_language} · {formatDateTime(selected.created_date)}</span>
        <StatusBadge value={selected.status} />
        {selected.channel === "whatsapp" && (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
            <MessageCircle className="w-3 h-3" /> WhatsApp
          </span>
        )}
        {needsLawyer && !approved && <span className="flex items-center gap-1 text-red-700 font-medium"><Gavel className="w-3 h-3" /> {t("msg_requires_lawyer")}</span>}
      </div>

      <div dir={getLanguage(selected.original_language || "").rtl ? "rtl" : "ltr"} className="mt-4 p-4 rounded-xl bg-secondary/70">
        <p className="text-sm">{selected.original_content}</p>
        {selected.audio_url && (
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <Mic className="w-4 h-4 text-primary shrink-0" />
            <span className="text-[10px] text-muted-foreground">
              {selected.transcription_status === "failed" ? t("msg_listen_failed") : t("msg_transcribed_auto")}
            </span>
            <audio controls src={selected.audio_url} className="h-9 w-full max-w-sm" />
          </div>
        )}
        {selected.transcription_status === "failed" && (
          <div className="mt-3 flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">{t("msg_trans_failed_hint")}</p>
          </div>
        )}
      </div>

      {selected.staff_translation ? (
        <div className="mt-3 p-4 rounded-xl border-s-4 border-primary/40 bg-card">
          <p className="text-xs text-muted-foreground mb-1">
            {t("msg_translation_label")} ({t("ai_label")}{selected.translation_confidence ? ` · ${confidenceHint(selected.translation_confidence, t)}` : ""})
          </p>
          <p className="text-sm">{selected.staff_translation}</p>
        </div>
      ) : selected.transcription_status === "failed" ? (
        <TranscribeManually comm={selected} onSaved={onTranscribed} />
      ) : (
        <Button variant="outline" className="rounded-xl mt-3" onClick={onTranslate} disabled={busy === "incoming"}>
          <Languages className="w-4 h-4 me-1" /> {busy === "incoming" ? t("msg_translating") : t("msg_translate")}
        </Button>
      )}

      <div className="flex flex-wrap items-center gap-2 mt-4">
        <select className="h-8 rounded-md border border-input bg-card px-2 text-xs" value={selected.sensitivity}
          onChange={(e) => onSensitivityChange(e.target.value)}>
          {SENSITIVITIES.map((s) => <option key={s.id} value={s.id}>{t(s.key)}</option>)}
        </select>
        <Button size="sm" variant="outline" className="rounded-lg text-red-700" onClick={onEscalate}>
          <AlertTriangle className="w-3.5 h-3.5 me-1" /> {t("msg_escalate")}
        </Button>
        <Button size="sm" variant="outline" className="rounded-lg" onClick={onCreateTask}>
          <ListPlus className="w-3.5 h-3.5 me-1" /> {t("msg_create_task")}
        </Button>
        {onDelete && (
          <Button size="sm" variant="outline" className="rounded-lg text-destructive" onClick={onDelete}>
            <Trash2 className="w-3.5 h-3.5 me-1" /> {t("archive") === "archive" ? "Eliminar" : t("archive")}
          </Button>
        )}
      </div>
    </div>
  );
}
