import React, { useEffect, useRef, useState } from "react";
import { Mic, Square, Loader2 } from "lucide-react";

export default function VoiceRecorder({ onRecorded, busy = false, labels = {} }) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState("");
  const recRef = useRef(null);

  useEffect(() => {
    if (!recording) return;
    setSeconds(0);
    const iv = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(iv);
  }, [recording]);

  const start = async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const opts = MediaRecorder.isTypeSupported("audio/webm") ? { mimeType: "audio/webm" } : {};
      const rec = new MediaRecorder(stream, opts);
      const chunks = [];
      rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
      rec.onstop = () => {
        stream.getTracks().forEach((tr) => tr.stop());
        setRecording(false);
        const blob = new Blob(chunks, { type: rec.mimeType || "audio/webm" });
        if (blob.size > 0) onRecorded(blob);
      };
      recRef.current = rec;
      rec.start();
      setRecording(true);
    } catch (e) {
      const blocked = ["NotAllowedError", "PermissionDeniedError", "NotFoundError"].includes(e?.name);
      setError(blocked ? (labels.micBlocked || labels.noMic || "") : (labels.noMic || ""));
      setRecording(false);
    }
  };

  const stop = () => recRef.current?.stop();
  const mmss = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <span className="inline-flex flex-col">
      <span className="inline-flex items-center gap-2">
        <button type="button" onClick={recording ? stop : start} disabled={busy}
          className={`inline-flex items-center gap-2 h-9 px-4 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
            recording ? "bg-destructive text-destructive-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          }`}>
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : recording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          {busy ? labels.sending : recording ? `${labels.stop} (${mmss})` : labels.start}
        </button>
        {recording && <span className="w-2 h-2 rounded-full bg-destructive animate-pulse shrink-0" aria-hidden />}
      </span>
      {error && <span className="text-xs text-destructive mt-1 max-w-64">{error}</span>}
    </span>
  );
}