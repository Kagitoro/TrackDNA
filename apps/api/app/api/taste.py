from __future__ import annotations

from fastapi import APIRouter

from app.core.config import settings
from app.schemas import TasteProfileRead

router = APIRouter(prefix="/taste-profile", tags=["taste"])


@router.get("", response_model=TasteProfileRead)
def taste_profile() -> TasteProfileRead:
    return TasteProfileRead(feature_weights=settings.similarity_weights, embedding=None)
