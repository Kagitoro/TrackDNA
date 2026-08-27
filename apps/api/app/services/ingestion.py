from __future__ import annotations

import shutil
import uuid
from pathlib import Path
from time import perf_counter

from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models import DropFeatures, Track, TrackSection
from app.schemas import SectionCreate, TrackCreate
from app.services.embedding import EmbeddingService
from app.services.features import FeatureExtractor
from app.services.segmentation import TrackSegmenter


class TrackIngestionService:
    def __init__(
        self,
        segmenter: TrackSegmenter | None = None,
        embedder: EmbeddingService | None = None,
        extractor: FeatureExtractor | None = None,
    ) -> None:
        self.segmenter = segmenter or TrackSegmenter()
        self.embedder = embedder or EmbeddingService()
        self.extractor = extractor or FeatureExtractor()

    def import_upload(self, db: Session, payload: TrackCreate, file: UploadFile) -> tuple[Track, TrackSection]:
        started = perf_counter()
        settings.upload_dir.mkdir(parents=True, exist_ok=True)
        safe_name = Path(file.filename or "track.wav").name
        destination = settings.upload_dir / f"{uuid.uuid4().hex}_{safe_name}"
        print(f"[import] saving upload to {destination}", flush=True)
        with destination.open("wb") as output:
            shutil.copyfileobj(file.file, output, length=1024 * 1024)
        print(
            f"[import] file saved size={destination.stat().st_size} bytes elapsed={perf_counter() - started:.3f}s",
            flush=True,
        )

        track = Track(
            title=payload.title,
            artist=payload.artist,
            genre=payload.genre,
            bpm=payload.bpm,
            key=payload.key,
            audio_source="user_uploaded",
            audio_path=str(destination),
        )
        db.add(track)
        db.flush()
        print(f"[import] track flushed id={track.id} elapsed={perf_counter() - started:.3f}s", flush=True)

        drop = next((section for section in self.segmenter.analyze(destination) if section.type == "drop"), None)
        print(f"[import] segment estimate ready elapsed={perf_counter() - started:.3f}s", flush=True)
        section_payload = SectionCreate(
            type="drop",
            start_time=drop.start_time if drop else 0.0,
            end_time=drop.end_time if drop else 30.0,
        )
        section = self.create_section(db, track, section_payload)
        print(f"[import] section/features ready id={section.id} elapsed={perf_counter() - started:.3f}s", flush=True)
        db.commit()
        print(f"[import] db committed elapsed={perf_counter() - started:.3f}s", flush=True)
        db.refresh(track)
        db.refresh(section)
        print(f"[import] db refreshed elapsed={perf_counter() - started:.3f}s", flush=True)
        return track, section

    def create_section(self, db: Session, track: Track, payload: SectionCreate) -> TrackSection:
        started = perf_counter()
        audio_path = Path(track.audio_path or "")
        embedding = self.embedder.embed_section(audio_path, payload.start_time, payload.end_time)
        print(f"[import] embedding ready elapsed={perf_counter() - started:.3f}s", flush=True)
        section = TrackSection(
            track_id=track.id,
            type=payload.type,
            start_time=payload.start_time,
            end_time=payload.end_time,
            embedding=embedding,
        )
        db.add(section)
        db.flush()
        print(f"[import] section flushed id={section.id} elapsed={perf_counter() - started:.3f}s", flush=True)
        if payload.type.lower() == "drop":
            features = self.extractor.extract_drop_features(audio_path, payload.start_time, payload.end_time)
            db.add(DropFeatures(section_id=section.id, **features))
            print(f"[import] drop features added elapsed={perf_counter() - started:.3f}s", flush=True)
        return section
