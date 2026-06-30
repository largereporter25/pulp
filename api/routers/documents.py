import json
import uuid
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession
from api.database import get_db
from api.models import Document

router = APIRouter(tags=["documents"])


class DocumentCreate(BaseModel):
    title: str = "Untitled"
    mode: str = "prose"
    content: str = ""
    synopsis: str = ""
    tags: list[str] = []
    canvas_x: float = 0.0
    canvas_y: float = 0.0


class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    mode: Optional[str] = None
    content: Optional[str] = None
    synopsis: Optional[str] = None
    tags: Optional[list[str]] = None
    canvas_x: Optional[float] = None
    canvas_y: Optional[float] = None
    word_count: Optional[int] = None
    page_count: Optional[float] = None


def doc_to_dict(doc: Document) -> dict:
    return {
        "id": doc.id,
        "title": doc.title,
        "mode": doc.mode,
        "content": doc.content,
        "synopsis": doc.synopsis,
        "tags": json.loads(doc.tags or "[]"),
        "canvas_x": doc.canvas_x,
        "canvas_y": doc.canvas_y,
        "word_count": doc.word_count,
        "page_count": doc.page_count,
        "created_at": doc.created_at.isoformat(),
        "updated_at": doc.updated_at.isoformat(),
    }


@router.get("/documents")
async def list_documents(
    mode: Optional[str] = None,
    tag: Optional[str] = None,
    q: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Document).where(Document.is_deleted == False)
    if mode:
        stmt = stmt.where(Document.mode == mode)
    if q:
        stmt = stmt.where(
            or_(Document.title.ilike(f"%{q}%"), Document.content.ilike(f"%{q}%"))
        )
    stmt = stmt.order_by(Document.updated_at.desc())
    result = await db.execute(stmt)
    docs = result.scalars().all()
    if tag:
        docs = [d for d in docs if tag in json.loads(d.tags or "[]")]
    return [doc_to_dict(d) for d in docs]


@router.post("/documents", status_code=201)
async def create_document(body: DocumentCreate, db: AsyncSession = Depends(get_db)):
    doc = Document(
        id=str(uuid.uuid4()),
        title=body.title,
        mode=body.mode,
        content=body.content,
        synopsis=body.synopsis,
        tags=json.dumps(body.tags),
        canvas_x=body.canvas_x,
        canvas_y=body.canvas_y,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)
    return doc_to_dict(doc)


@router.get("/documents/{doc_id}")
async def get_document(doc_id: str, db: AsyncSession = Depends(get_db)):
    doc = await db.get(Document, doc_id)
    if not doc or doc.is_deleted:
        raise HTTPException(404, "Document not found")
    return doc_to_dict(doc)


@router.patch("/documents/{doc_id}")
async def update_document(
    doc_id: str, body: DocumentUpdate, db: AsyncSession = Depends(get_db)
):
    doc = await db.get(Document, doc_id)
    if not doc or doc.is_deleted:
        raise HTTPException(404, "Document not found")
    if body.title is not None:
        doc.title = body.title
    if body.mode is not None:
        doc.mode = body.mode
    if body.content is not None:
        doc.content = body.content
    if body.synopsis is not None:
        doc.synopsis = body.synopsis
    if body.tags is not None:
        doc.tags = json.dumps(body.tags)
    if body.canvas_x is not None:
        doc.canvas_x = body.canvas_x
    if body.canvas_y is not None:
        doc.canvas_y = body.canvas_y
    if body.word_count is not None:
        doc.word_count = body.word_count
    if body.page_count is not None:
        doc.page_count = body.page_count
    doc.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(doc)
    return doc_to_dict(doc)


@router.delete("/documents/{doc_id}", status_code=204)
async def delete_document(doc_id: str, db: AsyncSession = Depends(get_db)):
    doc = await db.get(Document, doc_id)
    if not doc:
        raise HTTPException(404, "Document not found")
    doc.is_deleted = True
    doc.updated_at = datetime.utcnow()
    await db.commit()


@router.post("/documents/{doc_id}/duplicate", status_code=201)
async def duplicate_document(doc_id: str, db: AsyncSession = Depends(get_db)):
    original = await db.get(Document, doc_id)
    if not original or original.is_deleted:
        raise HTTPException(404, "Document not found")
    clone = Document(
        id=str(uuid.uuid4()),
        title=f"{original.title} (copy)",
        mode=original.mode,
        content=original.content,
        synopsis=original.synopsis,
        tags=original.tags,
        canvas_x=original.canvas_x + 40,
        canvas_y=original.canvas_y + 40,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(clone)
    await db.commit()
    await db.refresh(clone)
    return doc_to_dict(clone)
