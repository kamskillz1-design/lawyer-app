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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const auth = req.headers.get("Authorization");
  if (!auth) {
    return json({ transcript: "", error_type: "service_unavailable" }, 401);
  }

  const groqKey = Deno.env.get("GROQ_API_KEY");
  if (!groqKey) {
    return json({ transcript: "", error_type: "service_unavailable" }, 500);
  }

  try {
    const body = await req.json().catch(() => ({}));
    const fileUrl = typeof body?.file_url === "string" ? body.file_url : "";
    if (!fileUrl) {
      return json({ transcript: "", error_type: "empty_transcript" }, 400);
    }

    const audioRes = await fetch(fileUrl);
    if (!audioRes.ok) {
      return json({ transcript: "", error_type: "service_unavailable" }, 502);
    }
    const audioBytes = new Uint8Array(await audioRes.arrayBuffer());
    if (!audioBytes.byteLength) {
      return json({ transcript: "", error_type: "empty_transcript" });
    }

    const form = new FormData();
    form.append(
      "file",
      new Blob([audioBytes], { type: audioRes.headers.get("content-type") || "audio/webm" }),
      "voice-note.webm",
    );
    form.append("model", "whisper-large-v3-turbo");
    form.append("response_format", "json");

    const groqRes = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${groqKey}` },
      body: form,
    });
    const groqJson = await groqRes.json().catch(() => ({}));
    if (!groqRes.ok) {
      return json({ transcript: "", error_type: "service_unavailable" }, 502);
    }

    const transcript = String(groqJson.text || "").trim();
    if (!transcript) {
      return json({ transcript: "", error_type: "empty_transcript" });
    }
    return json({ transcript, error_type: null });
  } catch {
    return json({ transcript: "", error_type: "service_unavailable" }, 500);
  }
});
