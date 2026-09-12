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

See the repo README for local setup.
