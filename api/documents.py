from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional, List
import uuid
from datetime import datetime

from database import get_db
from models import Document

router = APIRouter(tags=["documents"])


class DocumentCreate(BaseModel):
    title: str = "Untitled"
    mode: str = "prose"
    content: dict = {}
    synopsis: str = ""
    tags: List[str] = []
    canvas_x: float = 0.0
    canvas_y: float = 0.0
    bpm: Optional[int] = None
    key_signature: Optional[str] = None


class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[dict] = None
    synopsis: Optional[str] = None
    tags: Optional[List[str]] = None
    canvas_x: Optional[float] = None
    canvas_y: Optional[float] = None
    word_count: Optional[int] = None
    page_count: Optional[float] = None
    bpm: Optional[int] = None
    key_signature: Optional[str] = None
    draft_date: Optional[str] = None
    contact_info: Optional[str] = None


def doc_to_dict(doc: Document) -> dict:
    return {
        "id": doc.id, "title": doc.title, "mode": doc.mode,
        "content": doc.content, "synopsis": doc.synopsis,
        "tags": doc.tags or [], "canvas_x": doc.canvas_x, "canvas_y": doc.canvas_y,
        "word_count": doc.word_count, "page_count": doc.page_count,
        "bpm": doc.bpm, "key_signature": doc.key_signature,
        "draft_date": doc.draft_date, "contact_info": doc.contact_info,
        "created_at": doc.created_at.isoformat() if doc.created_at else None,
        "updated_at": doc.updated_at.isoformat() if doc.updated_at else None,
    }


@router.get("/documents")
async def list_documents(
    mode: Optional[str] = None,
    tag: Optional[str] = None,
    q: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Document).where(Document.is_deleted == False)
    result = await db.execute(stmt)
    docs = result.scalars().all()
    if mode:
        docs = [d for d in docs if d.mode == mode]
    if tag:
        docs = [d for d in docs if tag in (d.tags or [])]
    if q:
        q_lower = q.lower()
        docs = [d for d in docs if q_lower in (d.title or "").lower() or q_lower in str(d.content).lower()]
    docs.sort(key=lambda d: d.updated_at or datetime.min, reverse=True)
    return [doc_to_dict(d) for d in docs]


@router.post("/documents", status_code=201)
async def create_document(payload: DocumentCreate, db: AsyncSession = Depends(get_db)):
    doc = Document(
        id=str(uuid.uuid4()), title=payload.title, mode=payload.mode,
        content=payload.content, synopsis=payload.synopsis, tags=payload.tags,
        canvas_x=payload.canvas_x, canvas_y=payload.canvas_y,
        bpm=payload.bpm, key_signature=payload.key_signature,
        created_at=datetime.utcnow(), updated_at=datetime.utcnow(),
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)
    return doc_to_dict(doc)


@router.get("/documents/{doc_id}")
async def get_document(doc_id: str, db: AsyncSession = Depends(get_db)):
    doc = await db.get(Document, doc_id)
    if not doc or doc.is_deleted:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc_to_dict(doc)


@router.patch("/documents/{doc_id}")
async def update_document(doc_id: str, payload: DocumentUpdate, db: AsyncSession = Depends(get_db)):
    doc = await db.get(Document, doc_id)
    if not doc or doc.is_deleted:
        raise HTTPException(status_code=404, detail="Document not found")
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(doc, field, value)
    doc.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(doc)
    return doc_to_dict(doc)


@router.delete("/documents/{doc_id}", status_code=204)
async def delete_document(doc_id: str, db: AsyncSession = Depends(get_db)):
    doc = await db.get(Document, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    doc.is_deleted = True
    doc.updated_at = datetime.utcnow()
    await db.commit()


@router.post("/documents/{doc_id}/duplicate", status_code=201)
async def duplicate_document(doc_id: str, db: AsyncSession = Depends(get_db)):
    original = await db.get(Document, doc_id)
    if not original or original.is_deleted:
        raise HTTPException(status_code=404, detail="Document not found")
    copy = Document(
        id=str(uuid.uuid4()), title=f"{original.title} (Copy)",
        mode=original.mode, content=original.content, synopsis=original.synopsis,
        tags=list(original.tags or []),
        canvas_x=original.canvas_x + 40, canvas_y=original.canvas_y + 40,
        created_at=datetime.utcnow(), updated_at=datetime.utcnow(),
    )
    db.add(copy)
    await db.commit()
    await db.refresh(copy)
    return doc_to_dict(copy)
