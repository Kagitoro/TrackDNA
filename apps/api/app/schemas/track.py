from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class TrackCreate(BaseModel):
    title: str
    artist: str = "Unknown"
    genre: str = "TECH_HOUSE"
    bpm: float | None = None
    key: str | None = None


class TrackRead(BaseModel):
    id: uuid.UUID
    title: str
    artist: str
    genre: str
    bpm: float | None
    key: str | None
    audio_source: str
    preview_url: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class SectionCreate(BaseModel):
    type: str = "drop"
    start_time: float = Field(0.0, ge=0.0)
    end_time: float = Field(30.0, gt=0.0)


class SectionUpdate(BaseModel):
    start_time: float = Field(..., ge=0.0)
    end_time: float = Field(..., gt=0.0)


class DropFeaturesRead(BaseModel):
    energy: float
    darkness: float
    brightness: float
    drop_impact: float
    low_end_entry_delay: float
    starts_with_full_kick_bass: bool
    melody_density: float
    vocal_density: float
    swing: float
    syncopation: float
    kick_features: dict
    bass_features: dict
    vocal_features: dict
    groove_features: dict

    model_config = {"from_attributes": True}


class SectionRead(BaseModel):
    id: uuid.UUID
    track_id: uuid.UUID
    type: str
    start_time: float
    end_time: float
    embedding: list[float]
    created_at: datetime
    drop_features: DropFeaturesRead | None = None

    model_config = {"from_attributes": True}


class ImportTrackResponse(BaseModel):
    track: TrackRead
    section: SectionRead


class SimilarRequest(BaseModel):
    section_id: uuid.UUID
    limit: int = Field(20, ge=1, le=100)


class RecommendationRead(BaseModel):
    section: SectionRead
    track: TrackRead
    score: float
    match_percent: int
    reasons: list[str]


class FeedbackCreate(BaseModel):
    section_id: uuid.UUID
    rating: float = Field(..., ge=-1.0, le=1.0)
    user_id: uuid.UUID | None = None


class FeedbackRead(BaseModel):
    id: uuid.UUID
    section_id: uuid.UUID
    rating: float
    created_at: datetime

    model_config = {"from_attributes": True}


class TasteProfileRead(BaseModel):
    user_id: uuid.UUID | None = None
    feature_weights: dict
    embedding: list[float] | None = None
