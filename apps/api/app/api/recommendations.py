from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.db.session import get_db
from app.models import TrackSection
from app.schemas import RecommendationRead, SimilarRequest
from app.services.similarity import SimilarityService

router = APIRouter(prefix="/recommendations", tags=["recommendations"])


@router.post("/similar", response_model=list[RecommendationRead])
def similar(payload: SimilarRequest, db: Session = Depends(get_db)) -> list[RecommendationRead]:
    reference = (
        db.query(TrackSection)
        .options(joinedload(TrackSection.track), joinedload(TrackSection.drop_features))
        .filter(TrackSection.id == payload.section_id)
        .first()
    )
    if reference is None:
        raise HTTPException(status_code=404, detail="Reference section not found")
    results = SimilarityService().find_similar(db, reference, payload.limit)
    return [
        RecommendationRead(
            section=item.section,
            track=item.section.track,
            score=item.score,
            match_percent=round(item.score * 100),
            reasons=item.reasons,
        )
        for item in results
    ]
