from __future__ import annotations

from pathlib import Path


class StemSeparator:
    """Replaceable interface for future drums/bass/vocals/other separation."""

    def separate(self, audio_path: Path) -> dict[str, Path]:
        return {
            "drums": audio_path,
            "bass": audio_path,
            "vocals": audio_path,
            "other": audio_path,
        }
