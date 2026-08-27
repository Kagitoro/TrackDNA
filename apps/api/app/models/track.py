from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


def uuid_pk() -> uuid.UUID:
    return uuid.uuid4()


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid_pk)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Track(Base):
    __tablename__ = "tracks"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid_pk)
    title: Mapped[str] = mapped_column(String(255), index=True)
    artist: Mapped[str] = mapped_column(String(255), default="Unknown")
    genre: Mapped[str] = mapped_column(String(64), default="TECH_HOUSE", index=True)
    bpm: Mapped[float | None] = mapped_column(Float, nullable=True)
    key: Mapped[str | None] = mapped_column(String(32), nullable=True)
    audio_source: Mapped[str] = mapped_column(String(32), default="user_uploaded")
    preview_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    audio_path: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    sections: Mapped[list["TrackSection"]] = relationship(back_populates="track", cascade="all, delete-orphan")


class TrackSection(Base):
    __tablename__ = "track_sections"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid_pk)
    track_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tracks.id"), index=True)
    type: Mapped[str] = mapped_column(String(64), default="drop", index=True)
    start_time: Mapped[float] = mapped_column(Float, default=0.0)
    end_time: Mapped[float] = mapped_column(Float, default=30.0)
    embedding: Mapped[list[float]] = mapped_column(JSONB, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    track: Mapped[Track] = relationship(back_populates="sections")
    drop_features: Mapped["DropFeatures"] = relationship(back_populates="section", cascade="all, delete-orphan", uselist=False)


class DropFeatures(Base):
    __tablename__ = "drop_features"

    section_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("track_sections.id"), primary_key=True)
    energy: Mapped[float] = mapped_column(Float, default=0.5)
    darkness: Mapped[float] = mapped_column(Float, default=0.5)
    brightness: Mapped[float] = mapped_column(Float, default=0.5)
    drop_impact: Mapped[float] = mapped_column(Float, default=0.5)
    low_end_entry_delay: Mapped[float] = mapped_column(Float, default=0.0)
    starts_with_full_kick_bass: Mapped[bool] = mapped_column(Boolean, default=False)
    melody_density: Mapped[float] = mapped_column(Float, default=0.5)
    vocal_density: Mapped[float] = mapped_column(Float, default=0.0)
    swing: Mapped[float] = mapped_column(Float, default=0.5)
    syncopation: Mapped[float] = mapped_column(Float, default=0.5)
    kick_features: Mapped[dict] = mapped_column(JSONB, default=dict)
    bass_features: Mapped[dict] = mapped_column(JSONB, default=dict)
    vocal_features: Mapped[dict] = mapped_column(JSONB, default=dict)
    groove_features: Mapped[dict] = mapped_column(JSONB, default=dict)

    section: Mapped[TrackSection] = relationship(back_populates="drop_features")


class UserFeedback(Base):
    __tablename__ = "user_feedback"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid_pk)
    user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    section_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("track_sections.id"), index=True)
    rating: Mapped[float] = mapped_column(Float)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class TasteProfile(Base):
    __tablename__ = "taste_profiles"

    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True)
    feature_weights: Mapped[dict] = mapped_column(JSONB, default=dict)
    embedding: Mapped[list[float] | None] = mapped_column(JSONB, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
