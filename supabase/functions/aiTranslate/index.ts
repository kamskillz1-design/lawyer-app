const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const MODEL = "llama-3.1-8b-instant";

async function groqChat(apiKey: string, system: string, user: string) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.1,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.message || "groq_failed");
  return String(data?.choices?.[0]?.message?.content || "").trim();
}

function langName(code: string) {
  const c = String(code || "").toLowerCase();
  if (c.startsWith("es")) return "Spanish";
  if (c.startsWith("en")) return "English";
  if (c.startsWith("fr")) return "French";
  if (c.startsWith("ar")) return "Arabic";
  if (c.startsWith("zh")) return "Chinese";
  if (c.startsWith("pt")) return "Portuguese";
  if (c.startsWith("ru")) return "Russian";
  if (c.startsWith("uk")) return "Ukrainian";
  if (c.startsWith("ro")) return "Romanian";
  if (c.startsWith("pl")) return "Polish";
  return code || "the target language";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (!req.headers.get("Authorization")) {
    return json({ error: "Authentication required" }, 401);
  }
  const apiKey = Deno.env.get("GROQ_API_KEY");
  if (!apiKey) return json({ error: "GROQ_API_KEY missing" }, 500);

  try {
    const body = await req.json().catch(() => ({}));
    const mode = body.mode || "translate";

    if (mode === "translate") {
      const text = String(body.text || "").trim();
      const target = body.target_language || "es";
      if (!text) {
        return json({
          translation: "",
          source_language_detected: body.source_language || "",
          confidence: "review_recommended",
          method: "ai",
        });
      }
      const out = await groqChat(
        apiKey,
        `You are a professional legal-office translator. Translate the user's message into ${langName(target)}. Return only the translation. Preserve names, emails, dates, case numbers, and NIE/passport numbers. Do not add commentary.`,
        text,
      );
      return json({
        translation: out || text,
        source_language_detected: body.source_language || "",
        confidence: "review_recommended",
        method: "ai",
      });
    }

    if (mode === "draft_reply") {
      const reply = String(body.reply_text || "").trim();
      const target = body.target_language || "en";
      if (!reply) {
        return json({ translation: "", confidence: "review_recommended", method: "ai" });
      }
      const ctx = body.context ? `\nContext: ${body.context}` : "";
      const out = await groqChat(
        apiKey,
        `You translate a Spanish law-office reply into ${langName(target)} for the client. Return only the translated reply. Keep a clear, respectful tone. Preserve names, dates, and references.${ctx}`,
        reply,
      );
      return json({
        translation: out || reply,
        confidence: "review_recommended",
        method: "ai",
      });
    }

    if (mode === "batch_translate") {
      const texts = body.texts && typeof body.texts === "object" ? body.texts : {};
      const target = body.target_language || "es";
      const translations: Record<string, string> = {};
      const ids = Object.keys(texts);
      for (const id of ids) {
        const src = String(texts[id] || "");
        if (!src.trim()) {
          translations[id] = src;
          continue;
        }
        translations[id] = await groqChat(
          apiKey,
          `Translate into ${langName(target)}. Return only the translation. Preserve names and official numbers.`,
          src,
        ) || src;
      }
      return json({ translations });
    }

    return json({ error: `Unknown aiTranslate mode: ${mode}` }, 400);
  } catch {
    return json({ error: "translate_failed" }, 500);
  }
});
