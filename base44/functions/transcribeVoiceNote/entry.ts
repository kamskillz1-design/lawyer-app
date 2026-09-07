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
      return Response.json({ error: 'file_url is required' }, { status: 400 });
    }

    const { transcript } = await base44.asServiceRole.integrations.Core.TranscribeAudio({ audio_url: file_url });
    return Response.json({ transcript: (transcript || '').trim() });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}