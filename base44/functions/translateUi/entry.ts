import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const target = body.target_language;
    const strings = body.strings;

    if (!target || typeof target !== 'string' || !/^[a-zA-Z]{2,3}(-[A-Za-z0-9]{2,8})?$/.test(target)) {
      return Response.json({ error: 'target_language is required' }, { status: 400 });
    }
    if (!strings || typeof strings !== 'object' || Array.isArray(strings)) {
      return Response.json({ error: 'strings is required' }, { status: 400 });
    }
    const keys = Object.keys(strings);
    if (!keys.length || keys.length > 200) {
      return Response.json({ error: 'Invalid strings payload' }, { status: 400 });
    }
    for (const k of keys) {
      if (typeof strings[k] !== 'string' || strings[k].length > 500) {
        return Response.json({ error: 'Invalid string value for key: ' + k }, { status: 400 });
      }
    }

    // Serve from cache without requiring auth (repeats are free for any visitor)
    const cached = await base44.asServiceRole.entities.UiDictCache.filter({ language: target }).catch(() => []);
    if (cached && cached.length && cached[0].dict) {
      try { return Response.json({ dict: JSON.parse(cached[0].dict) }); } catch (e) { /* regenerate below */ }
    }

    // Cache miss: translating costs an LLM call — only for authenticated app users
    try {
      await base44.auth.me();
    } catch (e) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }

    const properties = {};
    for (const k of keys) properties[k] = { type: 'string' };
    const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: 'Translate each of these user-interface strings into the language with BCP 47 code "' + target + '". Return a JSON object with the exact same keys, where every value is the translated string. Use natural, concise, formal-but-friendly wording suitable for an immigration-law client portal. Keep brand names (LexPath, Bilbao, NIE, TIE) unchanged.\n\n' + JSON.stringify(strings),
      response_json_schema: { type: 'object', properties, required: keys },
    });
    const dict = res && typeof res === 'object' ? res : null;
    if (!dict || Object.keys(dict).length === 0) {
      return Response.json({ error: 'Translation failed' }, { status: 500 });
    }

    await base44.asServiceRole.entities.UiDictCache.create({
      language: target, dict: JSON.stringify(dict),
    }).catch(() => {});
    console.log('translateUi: generated dictionary for ' + target + ' (' + Object.keys(dict).length + ' keys)');
    return Response.json({ dict });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}