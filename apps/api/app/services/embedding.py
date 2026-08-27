from __future__ import annotations

import hashlib
import math
from pathlib import Path


class EmbeddingService:
    """Replaceable placeholder embedding service.

    This is deterministic so tests and demos are stable. It is not a real audio
    embedding model.
    """

    dimensions = 32

    def embed_section(self, audio_path: Path, start_time: float, end_time: float) -> list[float]:
        seed = f"{audio_path.name}:{audio_path.stat().st_size if audio_path.exists() else 0}:{start_time}:{end_time}"
        digest = hashlib.sha256(seed.encode("utf-8")).digest()
        values = []
        for index in range(self.dimensions):
            raw = digest[index % len(digest)] / 255.0
            values.append(raw * 2.0 - 1.0)
        norm = math.sqrt(sum(value * value for value in values)) or 1.0
        return [round(value / norm, 6) for value in values]


def cosine_similarity(left: list[float], right: list[float]) -> float:
    if not left or not right or len(left) != len(right):
        return 0.0
    dot = sum(a * b for a, b in zip(left, right))
    left_norm = math.sqrt(sum(a * a for a in left)) or 1.0
    right_norm = math.sqrt(sum(b * b for b in right)) or 1.0
    return max(0.0, min(1.0, (dot / (left_norm * right_norm) + 1.0) / 2.0))
