from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import UserFeedback
from app.schemas import FeedbackCreate, FeedbackRead

router = APIRouter(prefix="/feedback", tags=["feedback"])


@router.post("", response_model=FeedbackRead)
def create_feedback(payload: FeedbackCreate, db: Session = Depends(get_db)) -> UserFeedback:
    feedback = UserFeedback(user_id=payload.user_id, section_id=payload.section_id, rating=payload.rating)
    db.add(feedback)
    db.commit()
    db.refresh(feedback)
    return feedback
