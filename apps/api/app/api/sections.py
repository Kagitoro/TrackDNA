from __future__ import annotations

import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session, joinedload

from app.db.session import get_db
from app.models import DropFeatures, TrackSection
from app.schemas import SectionRead, SectionUpdate
from app.services.embedding import EmbeddingService
from app.services.features import FeatureExtractor

router = APIRouter(prefix="/sections", tags=["sections"])


def audio_media_type(path: Path) -> str:
    suffix = path.suffix.lower()
    if suffix == ".mp3":
        return "audio/mpeg"
    if suffix == ".wav":
        return "audio/wav"
    if suffix == ".flac":
        return "audio/flac"
    if suffix in {".aif", ".aiff"}:
        return "audio/aiff"
    if suffix in {".m4a", ".mp4"}:
        return "audio/mp4"
    if suffix == ".ogg":
        return "audio/ogg"
    return "application/octet-stream"


@router.get("/{section_id}", response_model=SectionRead)
def get_section(section_id: uuid.UUID, db: Session = Depends(get_db)) -> TrackSection:
    section = (
        db.query(TrackSection)
        .options(joinedload(TrackSection.drop_features))
        .filter(TrackSection.id == section_id)
        .first()
    )
    if section is None:
        raise HTTPException(status_code=404, detail="Section not found")
    return section


@router.get("/{section_id}/audio")
def get_section_audio(section_id: uuid.UUID, db: Session = Depends(get_db)) -> FileResponse:
    section = (
        db.query(TrackSection)
        .options(joinedload(TrackSection.track))
        .filter(TrackSection.id == section_id)
        .first()
    )
    if section is None:
        raise HTTPException(status_code=404, detail="Section not found")
    if section.track is None or not section.track.audio_path:
        raise HTTPException(status_code=404, detail="Audio file not found")

    audio_path = Path(section.track.audio_path)
    if not audio_path.exists() or not audio_path.is_file():
        raise HTTPException(status_code=404, detail="Audio file missing on disk")

    return FileResponse(audio_path, media_type=audio_media_type(audio_path), filename=audio_path.name)


@router.patch("/{section_id}", response_model=SectionRead)
def update_section(section_id: uuid.UUID, payload: SectionUpdate, db: Session = Depends(get_db)) -> TrackSection:
    if payload.end_time <= payload.start_time:
        raise HTTPException(status_code=422, detail="end_time must be greater than start_time")
    section = (
        db.query(TrackSection)
        .options(joinedload(TrackSection.track), joinedload(TrackSection.drop_features))
        .filter(TrackSection.id == section_id)
        .first()
    )
    if section is None:
        raise HTTPException(status_code=404, detail="Section not found")

    section.start_time = payload.start_time
    section.end_time = payload.end_time
    if section.track.audio_path:
        audio_path = Path(section.track.audio_path)
        section.embedding = EmbeddingService().embed_section(audio_path, payload.start_time, payload.end_time)
        if section.type.lower() == "drop":
            features = FeatureExtractor().extract_drop_features(audio_path, payload.start_time, payload.end_time)
            if section.drop_features is None:
                db.add(DropFeatures(section_id=section.id, **features))
            else:
                for key, value in features.items():
                    setattr(section.drop_features, key, value)

    db.commit()
    db.refresh(section)
    return section
