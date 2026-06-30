#!/usr/bin/env python3
"""
Pulp — Python FastAPI backend.
Run locally: python main.py
Production: set DATABASE_URL env var to a Neon Postgres connection string.
"""
import os
import sys
import json
import uuid
from datetime import datetime, timezone
from pathlib import Path
from contextlib import asynccontextmanager
from typing import Any, List, Optional

try:
    from fastapi import FastAPI, HTTPException, Request
    from fastapi.middleware.cors import CORSMiddleware
    from fastapi.staticfiles import StaticFiles
    from fastapi.responses import FileResponse, StreamingResponse, JSONResponse
    from pydantic import BaseModel
import uvicorn
except ImportError:
    print("\n[Pulp] Missing dependencies. Run: pip install -r requirements.txt\n")
    sys.exit(1)

# ── In-memory store (SQLite/Postgres swap-in later) ──────────────────────────
# For local dev without a database: pure in-memory dict.
# For production: replace with SQLAlchemy + asyncpg (Neon).
_STORE: dict[str, dict] = {}

def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

def new_doc(mode: str, title: str = "Untitled", content: Any = None, synopsis: str = "") -> dict:
    doc_id = str(uuid.uuid4())
    ts = now_iso()
    return {
        "id": doc_id,
        "title": title,
        "mode": mode,
        "content": content or [],
        "synopsis": synopsis,
        "canvas_x": 0.0,
        "canvas_y": 0.0,
        "tags": [],
        "word_count": 0,
        "page_count": 1.0,
        "is_deleted": False,
        "created_at": ts,
        "updated_at": ts,
    }

def count_words(content: Any) -> int:
    if not isinstance(content, list):
        return 0
    text = " ".join(
        (item.get("text") or "") for item in content if isinstance(item, dict)
    )
    return len(text.split()) if text.strip() else 0

# ── Pydantic models ───────────────────────────────────────────────────────────
class CreateDoc(BaseModel):
    title: str = "Untitled"
    mode: str = "prose"
    content: Any = None
    synopsis: str = ""

class PatchDoc(BaseModel):
    title: Optional[str] = None
    mode: Optional[str] = None
    content: Optional[Any] = None
    synopsis: Optional[str] = None
    canvas_x: Optional[float] = None
    canvas_y: Optional[float] = None
    tags: Optional[List[str]] = None

class CanvasPosition(BaseModel):
    id: str
    x: float
    y: float

class CanvasPositions(BaseModel):
    positions: List[CanvasPosition]

# ── App ───────────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("\n" + "─" * 38)
    print("  PULP is running")
    print("  → http://localhost:8000")
    print("  API docs → http://localhost:8000/docs")
    print("─" * 38 + "\n")
    yield

app = FastAPI(title="Pulp API", version="2.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Document endpoints ────────────────────────────────────────────────────────
@app.get("/api/documents")
async def list_docs(mode: Optional[str] = None, q: Optional[str] = None):
    docs = [d for d in _STORE.values() if not d["is_deleted"]]
    if mode:
        docs = [d for d in docs if d["mode"] == mode]
    if q:
        q_lower = q.lower()
        docs = [d for d in docs if q_lower in (d.get("title") or "").lower()]
    return sorted(docs, key=lambda d: d["updated_at"], reverse=True)

@app.post("/api/documents", status_code=201)
async def create_doc(body: CreateDoc):
    doc = new_doc(body.mode, body.title, body.content, body.synopsis)
    _STORE[doc["id"]] = doc
    return doc

@app.get("/api/documents/{doc_id}")
async def get_doc(doc_id: str):
    doc = _STORE.get(doc_id)
    if not doc or doc["is_deleted"]:
        raise HTTPException(404, "Document not found")
    return doc

@app.patch("/api/documents/{doc_id}")
async def patch_doc(doc_id: str, body: PatchDoc):
    doc = _STORE.get(doc_id)
    if not doc or doc["is_deleted"]:
        raise HTTPException(404, "Document not found")
    if body.title is not None:    doc["title"] = body.title
    if body.mode is not None:     doc["mode"] = body.mode
    if body.content is not None:
        doc["content"] = body.content
        doc["word_count"] = count_words(body.content)
    if body.synopsis is not None: doc["synopsis"] = body.synopsis
    if body.canvas_x is not None: doc["canvas_x"] = body.canvas_x
    if body.canvas_y is not None: doc["canvas_y"] = body.canvas_y
    if body.tags is not None:     doc["tags"] = body.tags
    doc["updated_at"] = now_iso()
    return doc

@app.delete("/api/documents/{doc_id}", status_code=204)
async def delete_doc(doc_id: str):
    doc = _STORE.get(doc_id)
    if doc:
        doc["is_deleted"] = True
        doc["updated_at"] = now_iso()

@app.post("/api/documents/{doc_id}/duplicate", status_code=201)
async def duplicate_doc(doc_id: str):
    original = _STORE.get(doc_id)
    if not original or original["is_deleted"]:
        raise HTTPException(404, "Document not found")
    duped = new_doc(
        original["mode"],
        f"{original['title']} (copy)",
        original["content"],
        original["synopsis"],
    )
    duped["canvas_x"] = original["canvas_x"] + 240
    duped["canvas_y"] = original["canvas_y"] + 40
    _STORE[duped["id"]] = duped
    return duped

# ── Canvas endpoints ──────────────────────────────────────────────────────────
@app.get("/api/canvas/state")
async def canvas_state():
    docs = [
        {
            "id": d["id"], "title": d["title"], "mode": d["mode"],
            "canvas_x": d["canvas_x"], "canvas_y": d["canvas_y"],
            "word_count": d["word_count"], "updated_at": d["updated_at"],
        }
        for d in _STORE.values() if not d["is_deleted"]
    ]
    return {"documents": docs}

@app.patch("/api/canvas/positions", status_code=204)
async def update_canvas_positions(body: CanvasPositions):
    for pos in body.positions:
        if pos.id in _STORE and not _STORE[pos.id]["is_deleted"]:
            _STORE[pos.id]["canvas_x"] = pos.x
            _STORE[pos.id]["canvas_y"] = pos.y
            _STORE[pos.id]["updated_at"] = now_iso()

# ── Search ────────────────────────────────────────────────────────────────────
@app.get("/api/search")
async def search(q: str = ""):
    if not q.strip():
        return []
    q_lower = q.lower()
    results = [
        d for d in _STORE.values()
        if not d["is_deleted"] and (
            q_lower in (d.get("title") or "").lower() or
            q_lower in json.dumps(d.get("content", [])).lower()
        )
    ]
    return sorted(results, key=lambda d: d["updated_at"], reverse=True)[:20]

@app.get("/api/backlinks/{doc_id}")
async def backlinks(doc_id: str):
    target = _STORE.get(doc_id)
    if not target:
        raise HTTPException(404, "Document not found")
    title = target["title"]
    link_pattern = f"[[{title}]]"
    results = [
        d for d in _STORE.values()
        if not d["is_deleted"] and d["id"] != doc_id and
        link_pattern in json.dumps(d.get("content", []))
    ]
    return results

# ── Export (plain text; PDF/DOCX needs fpdf2/python-docx) ─────────────────────
@app.get("/api/documents/{doc_id}/export/txt")
async def export_txt(doc_id: str):
    doc = _STORE.get(doc_id)
    if not doc or doc["is_deleted"]:
        raise HTTPException(404)
    content = doc.get("content", [])
    lines = []
    if isinstance(content, list):
        for item in content:
            if isinstance(item, dict):
                t = item.get("text") or item.get("content") or ""
                lines.append(t)
    text = "\n".join(lines)
    filename = (doc["title"] or "document").replace("/", "-") + ".txt"
    return StreamingResponse(
        iter([text]),
        media_type="text/plain",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )

@app.get("/api/documents/{doc_id}/export/fountain")
async def export_fountain(doc_id: str):
    doc = _STORE.get(doc_id)
    if not doc or doc["is_deleted"]:
        raise HTTPException(404)
    lines = []
    title = doc.get("title") or "Untitled"
    lines.append(f"Title: {title}")
    lines.append("")
    content = doc.get("content", [])
    if isinstance(content, list):
        for item in content:
            if not isinstance(item, dict): continue
            t = item.get("type", "action")
            text = item.get("text", "")
            if t == "scene":         lines.append(text.upper())
            elif t == "action":      lines.append(text)
            elif t == "character":   lines.append("\t" + text.upper())
            elif t == "dialogue":    lines.append("\t\t" + text)
            elif t == "parenthetical": lines.append("\t(" + text + ")")
            elif t == "transition":  lines.append(">" + text.upper())
            else:                    lines.append(text)
            lines.append("")
    fountain = "\n".join(lines)
    filename = title.replace("/", "-") + ".fountain"
    return StreamingResponse(
        iter([fountain]),
        media_type="text/plain",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )

# ── Static file serving (Vite build) ─────────────────────────────────────────
DIST = Path(__file__).parent / "dist"

if DIST.exists():
    app.mount("/assets", StaticFiles(directory=str(DIST / "assets")), name="assets")

    @app.get("/favicon.svg")
    async def favicon():
        f = DIST / "favicon.svg"
        if f.exists(): return FileResponse(str(f))
        raise HTTPException(404)

    @app.get("/{full_path:path}")
    async def spa_fallback(full_path: str):
        if full_path.startswith("api"): raise HTTPException(404)
        index = DIST / "index.html"
        if index.exists(): return FileResponse(str(index))
        raise HTTPException(404)
else:
    @app.get("/")
    async def root():
        return JSONResponse({
            "status": "API running",
            "note": "Run 'npm run build' to serve the frontend.",
            "docs": "/docs",
        })

# ── Entry ─────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
