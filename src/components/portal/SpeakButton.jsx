import React, { useState } from "react";
import { Volume2, Square } from "lucide-react";

export default function SpeakButton({ text, lang, label = "Listen" }) {
  const [speaking, setSpeaking] = useState(false);

  const toggle = () => {
    const synth = window.speechSynthesis;
    if (!synth || !text) return;
    if (speaking) {
      synth.cancel();
      setSpeaking(false);
      return;
    }
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const code = lang || "en";
    utterance.lang = code;
    const voice = synth.getVoices().find((v) => v.lang.toLowerCase().startsWith(code.slice(0, 2).toLowerCase()));
    if (voice) utterance.voice = voice;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    synth.speak(utterance);
  };

  return (
    <button type="button" onClick={toggle} title={label} aria-label={label}
      className="shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
      {speaking ? <Square className="w-3.5 h-3.5" /> : <Volume2 className="w-4 h-4" />}
    </button>
  );
}