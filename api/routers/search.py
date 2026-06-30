from fastapi import APIRouter, Depends
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession
from api.database import get_db
from api.models import Document
import json

router = APIRouter(tags=["search"])


@router.get("/search")
async def full_text_search(q: str, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(Document)
        .where(Document.is_deleted == False)
        .where(
            or_(
                Document.title.ilike(f"%{q}%"),
                Document.content.ilike(f"%{q}%"),
                Document.synopsis.ilike(f"%{q}%"),
            )
        )
        .order_by(Document.updated_at.desc())
    )
    result = await db.execute(stmt)
    docs = result.scalars().all()
    return [
        {
            "id": d.id,
            "title": d.title,
            "mode": d.mode,
            "snippet": d.content[:200] if d.content else "",
            "updated_at": d.updated_at.isoformat(),
        }
        for d in docs
    ]


@router.get("/backlinks/{doc_id}")
async def get_backlinks(doc_id: str, db: AsyncSession = Depends(get_db)):
    target = await db.get(Document, doc_id)
    if not target:
        return []
    search_term = f"[[{target.title}]]"
    stmt = (
        select(Document)
        .where(Document.is_deleted == False)
        .where(Document.content.ilike(f"%{search_term}%"))
    )
    result = await db.execute(stmt)
    docs = result.scalars().all()
    return [{"id": d.id, "title": d.title, "mode": d.mode} for d in docs]
