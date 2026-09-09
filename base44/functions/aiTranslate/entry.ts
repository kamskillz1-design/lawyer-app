import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

const MAX_TEXT = 5000;
const SCHEMA = {
  type: 'object',
  properties: {
    translation: { type: 'string' },
    source_language_detected: { type: 'string' },
    confidence: { type: 'string' },
    notes: { type: 'string' }
  },
  required: ['translation']
};

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();
    const mode = body.mode || 'translate';

    if (mode === 'translate') {
      const { text, source_language, target_language } = body;
      if (!text || !target_language) return Response.json({ error: 'Faltan el texto o el idioma destino' }, { status: 400 });
      if (text.length > MAX_TEXT) return Response.json({ error: 'Texto demasiado largo' }, { status: 400 });
      const prompt = 'Eres un traductor profesional para una despacho de extranjería en Bilbao, España. ' +
        'Traduce el siguiente mensaje de un cliente. Idioma origen (detecta si no se indica): ' + (source_language || 'auto-detección') +
        '. Idioma destino: ' + target_language + '.\n\n' +
        'Devuelve un objeto JSON con: translation (la traducción fiel y natural), source_language_detected (código BCP 47 del idioma detectado), ' +
        'confidence (uno de: normal, review_recommended, uncertain, human_required — usa human_required o uncertain si el texto es jurídicamente complejo, ambiguo, dialectal o ilegible).\n\nMensaje:\n' + text;
      const result = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt, response_json_schema: SCHEMA });
      return Response.json({ translation: result.translation, source_language_detected: result.source_language_detected, confidence: result.confidence || 'review_recommended', method: 'ai' });
    }

    // Batch translation of short internal strings (e.g. staff-typed task titles).
    // One LLM call per page: texts is a { id: text } map, the response maps the
    // same ids to their translations.
    if (mode === 'batch_translate') {
      const { texts, source_language, target_language } = body;
      if (!target_language || typeof target_language !== 'string') return Response.json({ error: 'Falta el idioma destino' }, { status: 400 });
      if (!texts || typeof texts !== 'object' || Array.isArray(texts)) return Response.json({ error: 'Faltan los textos' }, { status: 400 });
      const ids = Object.keys(texts);
      if (!ids.length || ids.length > 100) return Response.json({ error: 'Número de textos no válido' }, { status: 400 });
      for (const id of ids) {
        if (typeof texts[id] !== 'string' || !texts[id].trim() || texts[id].length > 500) {
          return Response.json({ error: 'Texto no válido: ' + id }, { status: 400 });
        }
      }
      const prompt = 'Eres un traductor profesional para un despacho de extranjería en Bilbao, España. ' +
        'Traduce cada uno de los siguientes textos del personal del despacho (idioma origen: ' + (source_language || 'es') +
        ') al idioma con código BCP 47: ' + target_language + '. Son títulos de tareas internas (frases cortas). ' +
        'Mantén sin cambios nombres propios, números de expediente y fechas. No añadas contenido nuevo. ' +
        'Devuelve un objeto JSON con una única clave "translations" cuyo valor es un objeto con exactamente las mismas claves y la traducción fiel de cada texto.\n\n' + JSON.stringify(texts);
      const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: { translations: { type: 'object' } },
          required: ['translations'],
        },
      });
      const translations = (result && result.translations && typeof result.translations === 'object') ? result.translations : {};
      return Response.json({ translations });
    }

    if (mode === 'draft_reply') {
      const { reply_text, target_language, context } = body;
      if (!reply_text || !target_language) return Response.json({ error: 'Faltan la respuesta o el idioma destino' }, { status: 400 });
      if (reply_text.length > MAX_TEXT) return Response.json({ error: 'Texto demasiado largo' }, { status: 400 });
      const prompt = 'Eres un traductor profesional para un despacho de extranjería en Bilbao, España. ' +
        'Traduce la siguiente respuesta del personal del despacho (escrita en español) al idioma del cliente: ' + target_language + '. ' +
        'Mantén sin cambios nombres propios, fechas, números de documento y referencias. No añadas contenido nuevo. ' +
        'Contexto del expediente (solo como ayuda de traducción): ' + (context || 'sin contexto') + '\n\n' +
        'Devuelve un objeto JSON con: translation (la traducción), confidence (normal, review_recommended, uncertain, human_required).\n\nRespuesta:\n' + reply_text;
      const result = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt, response_json_schema: SCHEMA });
      return Response.json({ translation: result.translation, confidence: result.confidence || 'review_recommended', method: 'ai' });
    }

    return Response.json({ error: 'Modo no válido' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}