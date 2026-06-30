from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database import get_db
from models import Document
from api.documents import doc_to_dict

router = APIRouter(tags=["search"])


@router.get("/search")
async def full_text_search(q: str = Query(..., min_length=1), db: AsyncSession = Depends(get_db)):
    stmt = select(Document).where(Document.is_deleted == False)
    result = await db.execute(stmt)
    docs = result.scalars().all()
    q_lower = q.lower()
    matched = [
        d for d in docs
        if q_lower in (d.title or "").lower() or q_lower in str(d.content or "").lower()
    ]
    return [doc_to_dict(d) for d in matched]


@router.get("/backlinks/{doc_id}")
async def get_backlinks(doc_id: str, db: AsyncSession = Depends(get_db)):
    doc = await db.get(Document, doc_id)
    if not doc:
        return []
    stmt = select(Document).where(Document.is_deleted == False)
    result = await db.execute(stmt)
    docs = result.scalars().all()
    return [
        {"id": d.id, "title": d.title, "mode": d.mode}
        for d in docs
        if d.id != doc_id and f"[[{doc.title}]]" in str(d.content or "")
    ]
