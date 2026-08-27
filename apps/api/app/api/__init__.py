from app.api.feedback import router as feedback_router
from app.api.recommendations import router as recommendations_router
from app.api.sections import router as sections_router
from app.api.taste import router as taste_router
from app.api.tracks import router as tracks_router

__all__ = [
    "feedback_router",
    "recommendations_router",
    "sections_router",
    "taste_router",
    "tracks_router",
]
