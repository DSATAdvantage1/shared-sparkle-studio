# Bring DSAT Advantage into this Lovable project

I inspected your repo `DSATAdvantage1/DSAT-Advantage`. Two things need fixing before we can edit the app together.

## 1. Urgent: secrets are public in that repo

The repo is public and contains `Essential/.env` and `Essential/.env.local`. `.env.local` includes a `SUPABASE_SERVICE_ROLE_KEY` slot — that key bypasses all database security if it was filled in.

Do this now, on your side:
- In your Supabase/Cloud project, rotate the service role key (and the anon/publishable key if you want to be safe).
- Delete `.env` and `.env.local` from the repo and add them to `.gitignore` (note: your ignore file was committed as `gitignore`, without the leading dot, so it is not actually active).
- Ideally make the repo private.

## 2. The repo is missing the actual app code

What is in `Essential/`: `package.json`, `vite.config.ts`, `tsconfig.json`, `wrangler.jsonc`, `components.json`, eslint/prettier config, `scripts/`, `public/favicon.ico`, plus a committed `node_modules/` and `dist/` build output.

What is **not** there: the entire `src/` folder — no routes, components, styles, or Supabase integration files. Also missing: `index.html`-level entry files and any `supabase/migrations`. The dotfiles were also mangled (`gitignore`, `env`, `prettierrc`, `prettierrc` lost their leading dots), which suggests the upload was done by dragging files rather than a real `git push`.

So there is nothing to import yet. From `dist/` I can see the app has routes like `admin`, `admin.upload`, `admin.question-bank`, `admin.edit.$id`, `exams`, `test`, `questions-bank` (math / reading-writing / practice), `vocabulary`, `score-estimator`, `auth`, plus a PDF import pipeline — but built bundles are not editable source.

## What you should do

From your project folder on your PC:

```bash
cd path/to/Essential
git init            # if not already a repo
git remote add origin https://github.com/DSATAdvantage1/DSAT-Advantage.git
# make sure .gitignore (with the dot) contains: node_modules, dist, .env, .env.local
git add -A
git commit -m "Full source"
git push -u origin main --force
```

The push must include `src/` and exclude `node_modules/` and `dist/`.

## What I will do once the source is up

1. Pull the full source from the repo.
2. Confirm it matches this project's stack — good news: your `package.json` is already the Lovable TanStack Start template (React 19, TanStack Router/Start/Query, Tailwind v4, shadcn, Supabase), so it should drop in almost unchanged.
3. Copy `src/` (routes, components, lib, styles, Supabase integration) into this project, merging `package.json` dependencies (`pdfjs-dist`, `recharts`, `embla-carousel-react`, etc.) and `components.json`.
4. Enable Lovable Cloud here and recreate the database schema and RLS policies as migrations, then wire the app to the Cloud credentials instead of your old `.env` values. Your existing question-bank data would need a separate export/import — tell me if you want that.
5. Fix any build errors, verify each route renders, then we continue building normally.

## Technical notes

- Committed `node_modules/` and `dist/` should be removed from the repo; they bloat it and are regenerated on build.
- `wrangler.jsonc` and the Cloudflare vite plugin are for your own deploy; Lovable handles hosting, so those may be dropped or kept unused.
- Server code must stay Worker-compatible (no `child_process`, no native binaries). Your PDF pipeline uses `pdfjs-dist`, which is fine.
- Any hardcoded Supabase URL/keys in the source get replaced with this project's Cloud environment variables.

## Alternative

If pushing the full source is awkward, you can instead zip the `Essential` folder (without `node_modules` and `dist`) and upload it directly in this chat — I can import from that too.
