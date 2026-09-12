# Deploy Legal Lex (Vercel + Supabase)

SPA: Vite + React Router. Build: `vite` / `vite build`.

## Code

- [ ] No `@base44` packages
- [ ] One `src/api/supabaseClient.js`
- [ ] Entity façades in `src/api/entities.js`
- [ ] Auth via `src/api/auth.js` + AuthContext
- [ ] Uploads: Storage bucket `documents`
- [ ] Run `supabase/schema.sql` once
- [ ] `vercel.json` SPA rewrites
- [ ] `.env.example` only
- [ ] `npm install` so lockfile does not pin `@base44/*`

## Supabase

- Auth URLs: Vercel production + `http://localhost:5173`
- Providers: Email + Google
- Callback: `https://<project>.supabase.co/auth/v1/callback`
- Public bucket: `documents`
- Promote staff: `update public.profiles set role = 'admin' where email = 'you@firm.com';`

## Speech-to-text (optional)

Secret name must be exactly `GROQ_API_KEY` (Dashboard → Edge Functions → Secrets).

Deploy the function (Dashboard → Edge Functions → Deploy a new function, name `transcribeVoiceNote`, paste `supabase/functions/transcribeVoiceNote/index.ts`) or:

```bash
npx supabase functions deploy transcribeVoiceNote --project-ref YOUR_PROJECT_REF
```

Verify JWT is enabled. Redeploy Vercel after `src/api/functions.js` is on `main`.
