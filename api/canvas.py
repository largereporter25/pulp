from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import List
from datetime import datetime

from database import get_db
from models import Document

router = APIRouter(tags=["canvas"])


class CanvasPosition(BaseModel):
    id: str
    x: float
    y: float


@router.get("/canvas/state")
async def get_canvas_state(db: AsyncSession = Depends(get_db)):
    stmt = select(Document).where(Document.is_deleted == False)
    result = await db.execute(stmt)
    docs = result.scalars().all()
    return {
        "documents": [
            {
                "id": d.id, "title": d.title, "mode": d.mode,
                "x": d.canvas_x, "y": d.canvas_y,
                "word_count": d.word_count, "page_count": d.page_count,
                "tags": d.tags or [],
                "updated_at": d.updated_at.isoformat() if d.updated_at else None,
            }
            for d in docs
        ]
    }


@router.patch("/canvas/positions")
async def update_canvas_positions(
    positions: List[CanvasPosition],
    db: AsyncSession = Depends(get_db)
):
    for pos in positions:
        doc = await db.get(Document, pos.id)
        if doc:
            doc.canvas_x = pos.x
            doc.canvas_y = pos.y
            doc.updated_at = datetime.utcnow()
    await db.commit()
    return {"updated": len(positions)}
