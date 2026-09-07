import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";

export default function TranscribeManually({ comm, onSaved }) {
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!text.trim() || saving) return;
    setSaving(true);
    try {
      await base44.entities.Communication.update(comm.id, {
        original_content: text.trim(),
        transcription_status: "done",
      });
      onSaved(text.trim());
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-3 flex flex-col sm:flex-row gap-2 items-stretch sm:items-start">
      <textarea value={text} onChange={(e) => setText(e.target.value)}
        placeholder="Transcriba aquí el contenido del audio…"
        className="flex-1 min-h-16 rounded-xl border border-input bg-card p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" />
      <Button variant="outline" className="rounded-xl shrink-0" onClick={save} disabled={!text.trim() || saving}>
        <Save className="w-4 h-4 me-1" /> {saving ? "Guardando…" : "Guardar transcripción"}
      </Button>
    </div>
  );
}