# Pulp — The Infinite Writing Canvas

Pulp is a free, open writing studio for **screenplays, prose, poems, songs, and notes** — everything the expensive tools charge for, on one infinite canvas. Think Figma for writing: pan, zoom, and arrange your documents on a boundless board, with a living "pulping fish" drifting behind your work.

Design language inspired by [pulp.to](https://www.pulp.to/): deep red canvas, golden type, Playfair Display + JetBrains Mono.

## Architecture

Python-first, by design:

- **Backend — Python / FastAPI** (`main.py`, `api/`)
  - Documents CRUD, canvas positions, full-text search & backlinks
  - **All exports generated in Python**: PDF (fpdf2), DOCX (python-docx), Fountain, TXT
  - **The pulping fish is generated server-side in Python** (`api/routers/fish.py`) — ASCII frames built from the word "pulp" plus a sine motion path; the frontend just plays them back
  - SQLAlchemy (async) over **SQLite** locally, **Neon Postgres** in production
- **Frontend — React + Vite** (`src/`)
  - Infinite canvas (pan / zoom / drag), 5 writing modes, command palette, autosave
  - `LivingFish` plays the Python-generated fish as the canvas background

## Run locally

```bash
# 1. Backend (Python)
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# 2. Frontend (in another terminal)
npm install
npm run dev          # http://localhost:5000 (proxies /api -> :8000)
```

No database setup needed locally — Pulp creates `pulp.db` (SQLite) automatically.

## Deploy (Vercel + Neon)

1. Push to GitHub and import the repo in Vercel.
2. Vercel auto-detects: build command `npm run build`, output `dist/`, Python serverless function at `api/index.py`.
3. Set the environment variable `DATABASE_URL` to your Neon connection string (`postgresql://...`). The backend rewrites it to the async driver automatically.
4. Deploy. The SPA is served statically; `/api/*` routes to the FastAPI app.

See `.env.example` for configuration.

## API (v2)

| Method | Path | Purpose |
| --- | --- | --- |
| GET/POST | `/api/v2/documents` | List / create documents |
| GET/PATCH/DELETE | `/api/v2/documents/{id}` | Read / update / soft-delete |
| POST | `/api/v2/documents/{id}/duplicate` | Duplicate |
| GET | `/api/v2/documents/{id}/export/{pdf\|docx\|fountain\|txt}` | Export |
| GET/PATCH | `/api/v2/canvas/state`, `/api/v2/canvas/positions` | Canvas layout |
| GET | `/api/v2/search?q=`, `/api/v2/backlinks/{id}` | Search / backlinks |
| GET | `/api/v2/fish/frames`, `/api/v2/fish/ascii` | The pulping fish |

## Writing modes

Screenplay · Prose · Poem · Song · Notes — each with its own typography and page width.

---

Built free, for writers.
