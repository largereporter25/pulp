from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from api.database import get_db
from api.models import Document
from datetime import datetime

router = APIRouter(tags=["canvas"])


class PositionUpdate(BaseModel):
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
                "id": d.id,
                "title": d.title,
                "mode": d.mode,
                "x": d.canvas_x,
                "y": d.canvas_y,
                "word_count": d.word_count,
                "page_count": d.page_count,
                "updated_at": d.updated_at.isoformat(),
            }
            for d in docs
        ]
    }


@router.patch("/canvas/positions")
async def update_canvas_positions(
    positions: list[PositionUpdate], db: AsyncSession = Depends(get_db)
):
    for pos in positions:
        doc = await db.get(Document, pos.id)
        if doc:
            doc.canvas_x = pos.x
            doc.canvas_y = pos.y
            doc.updated_at = datetime.utcnow()
    await db.commit()
    return {"updated": len(positions)}
