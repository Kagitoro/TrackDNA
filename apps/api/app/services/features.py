from __future__ import annotations

import hashlib
from pathlib import Path


def _unit(seed: str, salt: str) -> float:
    digest = hashlib.sha256(f"{seed}:{salt}".encode("utf-8")).digest()
    return round(digest[0] / 255.0, 3)


class FeatureExtractor:
    """Deterministic MVP Drop DNA extractor.

    The interface is intentionally stable so a real extractor can replace this
    without changing routes or database models.
    """

    def extract_drop_features(self, audio_path: Path, start_time: float, end_time: float) -> dict:
        seed = f"{audio_path.name}:{start_time}:{end_time}"
        starts_full = _unit(seed, "full-low-end") > 0.58
        delay = 0.0 if starts_full else round(4.0 + _unit(seed, "delay") * 28.0, 2)
        return {
            "energy": _unit(seed, "energy"),
            "darkness": _unit(seed, "darkness"),
            "brightness": _unit(seed, "brightness"),
            "drop_impact": _unit(seed, "impact"),
            "low_end_entry_delay": delay,
            "starts_with_full_kick_bass": starts_full,
            "melody_density": _unit(seed, "melody-density"),
            "vocal_density": _unit(seed, "vocal-density"),
            "swing": _unit(seed, "swing"),
            "syncopation": _unit(seed, "syncopation"),
            "kick_features": {
                "punch": _unit(seed, "kick-punch"),
                "hardness": _unit(seed, "kick-hardness"),
                "length": _unit(seed, "kick-length"),
                "brightness": _unit(seed, "kick-brightness"),
                "straightFourOnFloor": 0.95,
                "subWeight": _unit(seed, "kick-sub"),
                "transientStrength": _unit(seed, "kick-transient"),
            },
            "bass_features": {
                "rolling": _unit(seed, "bass-rolling"),
                "stabby": _unit(seed, "bass-stabby"),
                "sustained": _unit(seed, "bass-sustained"),
                "aggression": _unit(seed, "bass-aggression"),
                "grooveComplexity": _unit(seed, "bass-groove"),
                "noteDensity": _unit(seed, "bass-density"),
                "syncopation": _unit(seed, "bass-syncopation"),
                "subWeight": _unit(seed, "bass-sub"),
                "midBassPresence": _unit(seed, "bass-mid"),
                "bassHookStrength": _unit(seed, "bass-hook"),
            },
            "vocal_features": {
                "present": _unit(seed, "vocal-present") > 0.55,
                "density": _unit(seed, "vocal-density"),
                "shortHook": _unit(seed, "vocal-hook"),
                "spoken": _unit(seed, "vocal-spoken"),
                "sung": _unit(seed, "vocal-sung"),
                "repetitive": _unit(seed, "vocal-repetitive"),
            },
            "groove_features": {
                "swing": _unit(seed, "groove-swing"),
                "syncopation": _unit(seed, "groove-syncopation"),
                "percussionDensity": _unit(seed, "groove-percussion"),
                "grooveStrength": _unit(seed, "groove-strength"),
                "offbeatBassStrength": _unit(seed, "groove-offbeat"),
            },
        }
