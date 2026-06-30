import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, Text, JSON
from database import Base


class Document(Base):
    __tablename__ = "documents"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, default="Untitled")
    mode = Column(String, default="prose")  # screenplay|prose|poem|song|notes
    content = Column(JSON, default=dict)
    synopsis = Column(Text, default="")
    tags = Column(JSON, default=list)
    canvas_x = Column(Float, default=0.0)
    canvas_y = Column(Float, default=0.0)
    word_count = Column(Integer, default=0)
    page_count = Column(Float, default=0.0)
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    bpm = Column(Integer, nullable=True)
    key_signature = Column(String, nullable=True)
    draft_date = Column(String, nullable=True)
    contact_info = Column(Text, nullable=True)
