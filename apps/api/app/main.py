from __future__ import annotations

import time

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import OperationalError

from app.api import feedback_router, recommendations_router, sections_router, taste_router, tracks_router
from app.db.session import Base, engine


def wait_for_database() -> None:
    last_error: Exception | None = None
    for _ in range(30):
        try:
            Base.metadata.create_all(bind=engine)
            return
        except OperationalError as exc:
            last_error = exc
            time.sleep(1)
    if last_error is not None:
        raise last_error


def create_app() -> FastAPI:
    app = FastAPI(title="TrackDNA API", version="0.1.0")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.on_event("startup")
    def create_tables() -> None:
        wait_for_database()

    app.include_router(tracks_router)
    app.include_router(sections_router)
    app.include_router(recommendations_router)
    app.include_router(feedback_router)
    app.include_router(taste_router)

    @app.get("/")
    def root() -> dict[str, str]:
        return {
            "name": "TrackDNA API",
            "health": "/health",
            "docs": "/docs",
        }

    @app.get("/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    return app


app = create_app()
