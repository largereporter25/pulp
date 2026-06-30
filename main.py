#!/usr/bin/env python3
"""Pulp — Next-Gen Infinite Writing Canvas. Run: python main.py"""
import os
from pathlib import Path

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import uvicorn

from database import engine, Base
from api.documents import router as documents_router
from api.canvas import router as canvas_router
from api.export_routes import router as export_router
from api.search import router as search_router

app = FastAPI(title="Pulp API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(documents_router, prefix="/api/v2")
app.include_router(canvas_router, prefix="/api/v2")
app.include_router(export_router, prefix="/api/v2")
app.include_router(search_router, prefix="/api/v2")

dist_path = Path("dist")
if dist_path.exists():
    app.mount("/assets", StaticFiles(directory="dist/assets"), name="assets")

    @app.get("/")
    async def serve_index():
        return FileResponse("dist/index.html")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = dist_path / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(str(file_path))
        return FileResponse("dist/index.html")
else:
    @app.get("/health")
    async def health():
        return {"status": "ok", "note": "Run npm run build first"}


async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

app.add_event_handler("startup", startup)


if __name__ == "__main__":
    print("\n\033[38;5;214m  PULP  \033[0m")
    print("\033[90m  Ideas are like fish. Go deeper.\033[0m")
    print("\n\033[38;5;214m  → http://localhost:8000\033[0m")
    print("\033[90m  API: /api/v2 | Docs: /docs\033[0m\n")
    if not dist_path.exists():
        print("\033[33m  ⚠  dist/ not found. Run: npm install && npm run build\033[0m\n")
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=os.getenv("DEV", "false").lower() == "true"
    )
