from __future__ import annotations

import uuid
from time import perf_counter
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from sqlalchemy.orm import Session, joinedload

from app.core.config import settings
from app.db.session import get_db
from app.models import Track, TrackSection, UserFeedback
from app.schemas import ImportTrackResponse, SectionCreate, SectionRead, TrackCreate, TrackRead
from app.services.ingestion import TrackIngestionService

router = APIRouter(prefix="/tracks", tags=["tracks"])


@router.get("/search", response_model=list[TrackRead])
def search_tracks(q: str = "", limit: int = Query(50, ge=1, le=50), db: Session = Depends(get_db)) -> list[Track]:
    query = db.query(Track).filter(Track.genre == "TECH_HOUSE")
    if q:
        query = query.filter(Track.title.ilike(f"%{q}%") | Track.artist.ilike(f"%{q}%"))
    return query.order_by(Track.created_at.desc()).limit(limit).all()


@router.get("/{track_id}", response_model=TrackRead)
def get_track(track_id: uuid.UUID, db: Session = Depends(get_db)) -> Track:
    track = db.get(Track, track_id)
    if track is None:
        raise HTTPException(status_code=404, detail="Track not found")
    return track


@router.delete("/{track_id}")
def delete_track(track_id: uuid.UUID, db: Session = Depends(get_db)) -> dict[str, str]:
    track = db.query(Track).options(joinedload(Track.sections)).filter(Track.id == track_id).first()
    if track is None:
        raise HTTPException(status_code=404, detail="Track not found")

    audio_path = Path(track.audio_path) if track.audio_path else None
    section_ids = [section.id for section in track.sections]
    if section_ids:
        db.query(UserFeedback).filter(UserFeedback.section_id.in_(section_ids)).delete(synchronize_session=False)
    db.delete(track)
    db.commit()

    if audio_path and audio_path.exists() and audio_path.is_file():
        upload_dir = settings.upload_dir.resolve()
        resolved_audio = audio_path.resolve()
        try:
            resolved_audio.relative_to(upload_dir)
        except ValueError:
            return {"status": "deleted"}
        resolved_audio.unlink(missing_ok=True)
    return {"status": "deleted"}


@router.get("/{track_id}/sections", response_model=list[SectionRead])
def get_sections(track_id: uuid.UUID, db: Session = Depends(get_db)) -> list[TrackSection]:
    return (
        db.query(TrackSection)
        .options(joinedload(TrackSection.drop_features))
        .filter(TrackSection.track_id == track_id)
        .order_by(TrackSection.start_time)
        .all()
    )


@router.post("/{track_id}/sections", response_model=SectionRead)
def create_section(track_id: uuid.UUID, payload: SectionCreate, db: Session = Depends(get_db)) -> TrackSection:
    track = db.get(Track, track_id)
    if track is None:
        raise HTTPException(status_code=404, detail="Track not found")
    section = TrackIngestionService().create_section(db, track, payload)
    db.commit()
    db.refresh(section)
    return section


@router.post("/admin/import", response_model=ImportTrackResponse)
def import_track(
    title: str = Form(...),
    artist: str = Form("Unknown"),
    bpm: str | None = Form(None),
    key: str | None = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> ImportTrackResponse:
    started = perf_counter()
    print(
        f"[import] received request filename={file.filename!r} content_type={file.content_type!r}",
        flush=True,
    )
    parsed_bpm: float | None = None
    if bpm is not None and bpm.strip():
        try:
            parsed_bpm = float(bpm.replace(",", "."))
        except ValueError as exc:
            raise HTTPException(status_code=422, detail="bpm must be a number") from exc
    parsed_key = key.strip() if key and key.strip() else None
    track, section = TrackIngestionService().import_upload(
        db,
        TrackCreate(title=title.strip(), artist=artist.strip() or "Unknown", bpm=parsed_bpm, key=parsed_key),
        file,
    )
    print(
        f"[import] response ready track={track.id} section={section.id} total={perf_counter() - started:.3f}s",
        flush=True,
    )
    return ImportTrackResponse(track=track, section=section)
