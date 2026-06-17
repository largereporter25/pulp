# Pulp

**The canvas where every script begins.** A free, screenplay-first writing studio for scripts, poems, songs, and prose — everything the expensive tools charge for, open to everyone.

![Pulp](https://img.shields.io/badge/status-live-f5b942)

## Features

- **Screenplay engine** — Industry-standard formatting (Scene / Action / Character / Dialogue / Parenthetical / Transition) with `Tab` to cycle elements, `Enter` to continue intelligently, smart auto-capitalization, and auto-detection of scene headings & transitions.
- **Four writing modes** — Screenplay, Poem, Song, and Prose, each with its own typographic soul.
- **The page is a canvas** — A floating, cinematic dark-studio surface, not just a text box.
- **Cloud autosave** — Every keystroke persists to Neon Postgres. Pick up anywhere.
- **Focus mode** — `⌘.` strips the UI to just you and the page.
- **Export** — Print/PDF, Fountain (`.fountain`), and plain text.
- **Live stats** — Word count and accurate screenplay page estimates.

## Keyboard shortcuts

| Action | Shortcut |
| --- | --- |
| Set element type | `⌘1`–`⌘6` |
| Cycle element type | `Tab` / `Shift+Tab` |
| New element | `Enter` |
| Save now | `⌘S` |
| Toggle focus mode | `⌘.` |

## Stack

- **Frontend** — Vite + React + TypeScript + Tailwind CSS
- **Backend** — Vercel serverless functions (`/api`)
- **Database** — Neon Postgres (`@neondatabase/serverless`)

## Local development

```bash
npm install
# set DATABASE_URL in .env (Neon connection string)
node devserver.mjs   # local API shim on :5050
npm run dev          # Vite on :5000
```

## Deploy

Deployed on Vercel. Set the `DATABASE_URL` environment variable to your Neon connection string. The `documents` table:

```sql
CREATE TABLE documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT 'Untitled',
  mode text NOT NULL DEFAULT 'screenplay',
  content jsonb NOT NULL DEFAULT '[]'::jsonb,
  synopsis text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

---

Built free, for writers.
