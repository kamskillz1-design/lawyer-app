import { entities } from "@/api/entities";

async function aiTranslate(body = {}) {
  const mode = body.mode || "translate";
  if (mode === "translate") {
    return {
      translation: body.text || "",
      source_language_detected: body.source_language || "",
      confidence: "review_recommended",
      notes: "LLM not configured off-platform",
      method: "staff",
    };
  }
  if (mode === "draft_reply") {
    return {
      translation: body.reply_text || "",
      confidence: "review_recommended",
      method: "staff",
    };
  }
  if (mode === "batch_translate") {
    const texts = body.texts || {};
    const translations = {};
    Object.keys(texts).forEach((id) => {
      translations[id] = texts[id];
    });
    return { translations };
  }
  throw new Error(`Unknown aiTranslate mode: ${mode}`);
}

async function translateUi(body = {}) {
  const cached = await entities.UiDictCache.filter({ language: body.target_language }).catch(() => []);
  const cachedDict = cached[0]?.dict && typeof cached[0].dict === "object" ? cached[0].dict : {};
  const strings = body.strings || {};
  return { dict: { ...strings, ...cachedDict } };
}

async function transcribeVoiceNote() {
  return { transcript: "", error_type: "service_unavailable" };
}

async function exportClientArchive() {
  return { status: "not_connected" };
}

const HANDLERS = {
  aiTranslate,
  translateUi,
  transcribeVoiceNote,
  exportClientArchive,
};

export async function invoke(name, payload) {
  const fn = HANDLERS[name];
  if (!fn) throw new Error(`Unknown function: ${name}`);
  const data = await fn(payload || {});
  return { data };
}
