import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    try {
      await base44.auth.me();
    } catch (e) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const file_url = body.file_url;
    if (!file_url || typeof file_url !== 'string' || !/^https:\/\//.test(file_url)) {
      return Response.json({ error: 'file_url is required', error_type: 'invalid_file' }, { status: 400 });
    }

    let lastError = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const result = await base44.asServiceRole.integrations.Core.TranscribeAudio({ audio_url: file_url });
        // The integration returns the transcript as a plain string, not an object.
        const text = (typeof result === 'string' ? result : (result?.transcript || '')).trim();
        if (!text) {
          return Response.json({ transcript: '', error_type: 'empty_transcript' });
        }
        return Response.json({ transcript: text });
      } catch (error) {
        lastError = error;
        if (attempt < 3) await new Promise((r) => setTimeout(r, 1500));
      }
    }
    return Response.json({
      transcript: '',
      error_type: 'service_unavailable',
      error: lastError?.message || 'transcription failed',
    });
  } catch (error) {
    return Response.json({ error: error.message, error_type: 'invalid_file' }, { status: 500 });
  }
}