# PULP — Infinite Writing Canvas

> *"Ideas are like fish. If you want to catch the big fish, you've got to go deeper."*  
> — David Lynch

Pulp is the next-gen free writing platform for screenwriters, poets, novelists, songwriters, and note-takers. It replaces Final Draft, Scrivener, Bear, and Notion — for free, forever.

## Features

- 🎬 **Screenplay** — WGA-standard formatting, Tab-cycle elements, Fountain export
- 📖 **Prose** — Clean long-form writing, headings, rich formatting
- 📜 **Poem** — Generous line-height, stanza breaks, centered layout
- 🎵 **Song** — Verse/Chorus/Bridge structure, chord annotations
- 📝 **Notes** — Markdown-first, [[WikiLinks]], backlinks
- ∞ **Infinite Canvas** — Drag documents anywhere, pan and zoom freely
- 🐟 **The Fish** — David Lynch's swimming fish ASCII mascot
- 🎯 **Focus Mode** — Strip everything away. Just you and the page.
- 📤 **Export** — PDF, Fountain, DOCX, TXT

## Quick Start (Local)

```bash
# 1. Install dependencies
npm install
pip install -r requirements.txt

# 2. Build frontend
npm run build

# 3. Run Pulp
python main.py
# → http://localhost:8000
```

## Dev Mode (hot reload)

```bash
# Terminal 1
uvicorn main:app --reload --port 8000

# Terminal 2  
npm run dev
# → http://localhost:5173
```

## Deploy to Vercel + Neon

1. Push this repo to GitHub
2. Import project in Vercel
3. Add env var: `DATABASE_URL=postgresql://...` (from Neon dashboard)
4. Framework: Vite
5. Build command: `npm run build`
6. Output directory: `dist`
7. Deploy ✓

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React + Vite + TypeScript + Tailwind |
| Backend | **Python FastAPI** |
| Database | SQLite (local) / Neon Postgres (prod) |
| ORM | SQLAlchemy async |
| Export | fpdf2 (PDF), python-docx (DOCX) |
| Fonts | Courier Prime, Newsreader, Playfair Display, Inter |

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `⌘K` | Search |
| `⌘.` | Toggle Focus Mode |
| `⌘E` | Export menu |
| `⌘S` | Force save |
| `Tab` | Next screenplay element |
| `Shift+Tab` | Previous screenplay element |
| `Escape` | Close modals / exit focus |

## Screenplay Elements (Tab cycle)

`Scene Heading` → `Action` → `Character` → `Dialogue` → `Parenthetical` → `Transition`

---

Built with ❤️ — Free. Forever. No paywall.
