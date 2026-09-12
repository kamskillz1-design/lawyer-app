# Legal Lex

Immigration practice app (staff office + client portal). Vite + React, Supabase, Vercel.

## Local

```bash
npm install
cp .env.example .env.local
# fill VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm run dev
```

Run `supabase/schema.sql` once in the Supabase SQL Editor before using the UI.

See **DEPLOY.md** for Auth URLs, the `documents` bucket, Vercel, and leftover side effects.
