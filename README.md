# Pulp ✦

> *Ideas are like fish. If you want to catch the big fish, you've got to go deeper.* — David Lynch

**Pulp** is a next-generation, free, infinite-canvas writing tool for screenwriters, novelists, poets, songwriters, and note-takers. Replaces Final Draft, Scrivener, Bear, and Notion — at zero cost.

---

## Features

- 🎬 **Screenplay** — WGA-standard formatting
- 📖 **Prose** — Long-form essays, journalism, fiction
- 📜 **Poem** — Lyrical layout with breathing room
- 🎵 **Song** — Verse/chorus/bridge structure
- 📝 **Notes** — Markdown-first with `[[WikiLinks]]`
- 🌊 **Infinite Canvas** — Drag, zoom, pan freely
- 🐟 **The Fish** — Hover for a David Lynch quote
- 📤 **Export** — PDF, Fountain, Word (.docx), TXT
- 🔄 **Autosave** — Every keystroke saved automatically
- 🌑 **Focus Mode** — `Cmd+.` hides all chrome

---

## Run Locally (Python)

```bash
npm install && pip install -r requirements.txt
npm run build
python main.py
# → http://localhost:8000
```

## Dev Mode

```bash
# Terminal 1
npm run dev
# Terminal 2
DEV=true python main.py
```

---

## Deploy to Vercel + Neon

1. Push repo to GitHub
2. Connect to [vercel.com](https://vercel.com)
3. Add env var: `DATABASE_URL=postgresql+asyncpg://...` (from Neon dashboard)
4. Deploy

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Cmd+.` | Toggle Focus Mode |
| `Cmd+E` | Export menu |
| `Escape` | Close popover |

---

*Pulp. The canvas never ends.*
