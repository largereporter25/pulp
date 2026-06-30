#!/usr/bin/env python3
"""
Pulp v2 — Main entry point.
Runs FastAPI + serves Vite build from dist/
Usage: python main.py
"""

import os
import sys
import uvicorn
from pathlib import Path
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from api.database import init_db
from api.routers import documents, canvas, export, search

app = FastAPI(
    title="Pulp API",
    description="The infinite writing canvas — API v2",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers
app.include_router(documents.router, prefix="/api/v2")
app.include_router(canvas.router, prefix="/api/v2")
app.include_router(export.router, prefix="/api/v2")
app.include_router(search.router, prefix="/api/v2")

# Serve Vite build if it exists
dist_path = Path("dist")
if dist_path.exists():
    app.mount("/assets", StaticFiles(directory="dist/assets"), name="assets")

    @app.get("/{full_path:path}")
    async def spa_fallback(full_path: str):
        index_file = dist_path / "index.html"
        if index_file.exists():
            return FileResponse(str(index_file))
        return {"message": "Run: npm run build"}
else:
    @app.get("/")
    async def root():
        return {"message": "Pulp API running. Run 'npm run build' to serve the frontend."}


@app.on_event("startup")
async def startup_event():
    await init_db()


if __name__ == "__main__":
    banner = """
\033[33m
  ██████╗ ██╗   ██╗██╗     ██████╗ 
  ██╔══██╗██║   ██║██║     ██╔══██╗
  ██████╔╝██║   ██║██║     ██████╔╝
  ██╔═══╝ ██║   ██║██║     ██╔═══╝ 
  ██║     ╚██████╔╝███████╗██║     
  ╚═╝      ╚═════╝ ╚══════╝╚═╝     
\033[0m
  \033[90mThe infinite writing canvas\033[0m
  \033[32m→ http://localhost:8000\033[0m
  \033[90mAPI: /api/v2 | Docs: /docs\033[0m
    """
    print(banner)
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=os.getenv("DEV", "false").lower() == "true",
    )
