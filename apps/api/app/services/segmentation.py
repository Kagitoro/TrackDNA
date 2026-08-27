from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class SectionEstimate:
    type: str
    start_time: float
    end_time: float


class TrackSegmenter:
    """MVP segmenter with one editable drop estimate."""

    def analyze(self, audio_path: Path) -> list[SectionEstimate]:
        _ = audio_path
        return [
            SectionEstimate(type="drop", start_time=0.0, end_time=45.0),
        ]
