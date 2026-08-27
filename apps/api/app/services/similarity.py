from __future__ import annotations

from dataclasses import dataclass

from sqlalchemy.orm import Session, joinedload

from app.core.config import settings
from app.models import DropFeatures, TrackSection, UserFeedback
from app.services.embedding import cosine_similarity


@dataclass(frozen=True)
class SimilarityResult:
    section: TrackSection
    score: float
    reasons: list[str]


def _feature_similarity(left: float, right: float) -> float:
    return max(0.0, 1.0 - abs(left - right))


def _json_similarity(left: dict, right: dict, keys: tuple[str, ...]) -> float:
    if not left or not right:
        return 0.0
    values = [_feature_similarity(float(left.get(key, 0.0)), float(right.get(key, 0.0))) for key in keys]
    return sum(values) / len(values) if values else 0.0


class SimilarityService:
    def find_similar(self, db: Session, reference: TrackSection, limit: int = 20) -> list[SimilarityResult]:
        candidates = (
            db.query(TrackSection)
            .options(joinedload(TrackSection.track), joinedload(TrackSection.drop_features))
            .filter(TrackSection.type == "drop", TrackSection.id != reference.id)
            .all()
        )
        taste_examples = self._taste_examples(db)
        scored = [self._score(reference, candidate, taste_examples) for candidate in candidates if candidate.drop_features]
        scored.sort(key=lambda item: item.score, reverse=True)
        return scored[:limit]

    def _taste_examples(self, db: Session) -> list[tuple[TrackSection, float]]:
        feedback_rows = (
            db.query(UserFeedback)
            .order_by(UserFeedback.created_at.desc())
            .limit(80)
            .all()
        )
        if not feedback_rows:
            return []

        section_ids = {row.section_id for row in feedback_rows}
        sections = (
            db.query(TrackSection)
            .options(joinedload(TrackSection.drop_features))
            .filter(TrackSection.id.in_(section_ids))
            .all()
        )
        by_id = {section.id: section for section in sections if section.drop_features}

        latest_by_section: dict[object, float] = {}
        for row in feedback_rows:
            if row.section_id not in latest_by_section:
                latest_by_section[row.section_id] = row.rating

        return [
            (by_id[section_id], rating)
            for section_id, rating in latest_by_section.items()
            if section_id in by_id and abs(rating) >= 0.1
        ]

    def _score(
        self,
        reference: TrackSection,
        candidate: TrackSection,
        taste_examples: list[tuple[TrackSection, float]] | None = None,
    ) -> SimilarityResult:
        weights = settings.similarity_weights
        left = reference.drop_features
        right = candidate.drop_features
        if left is None or right is None:
            return SimilarityResult(candidate, 0.0, [])

        embedding = cosine_similarity(reference.embedding, candidate.embedding)
        bass = _json_similarity(
            left.bass_features,
            right.bass_features,
            ("rolling", "stabby", "aggression", "grooveComplexity", "subWeight", "bassHookStrength"),
        )
        kick = _json_similarity(
            left.kick_features,
            right.kick_features,
            ("punch", "hardness", "length", "straightFourOnFloor", "transientStrength"),
        )
        groove = _json_similarity(
            left.groove_features,
            right.groove_features,
            ("swing", "syncopation", "percussionDensity", "grooveStrength", "offbeatBassStrength"),
        )
        delay = _feature_similarity(
            min(left.low_end_entry_delay / 32.0, 1.0),
            min(right.low_end_entry_delay / 32.0, 1.0),
        )
        start_match = 1.0 if left.starts_with_full_kick_bass == right.starts_with_full_kick_bass else 0.0
        structure = (delay + start_match) / 2.0
        vocal = _json_similarity(left.vocal_features, right.vocal_features, ("density", "shortHook", "spoken", "sung"))
        energy = _feature_similarity(left.energy, right.energy)

        base_score = (
            embedding * weights["embedding"]
            + bass * weights["bass"]
            + kick * weights["kick"]
            + groove * weights["groove"]
            + structure * weights["structure"]
            + vocal * weights["vocal"]
            + energy * weights["energy"]
        )
        taste_boost = self._taste_boost(candidate, taste_examples or [])
        score = max(0.0, min(1.0, base_score + taste_boost))
        reasons = self._reasons(left, right, bass, kick, groove, structure, energy)
        if taste_boost >= 0.035:
            reasons.insert(0, "Matches your liked drops")
        elif taste_boost <= -0.035:
            reasons.append("Penalized by your dislikes")
        return SimilarityResult(candidate, round(score, 4), reasons)

    def _taste_boost(self, candidate: TrackSection, taste_examples: list[tuple[TrackSection, float]]) -> float:
        if not taste_examples:
            return 0.0

        weighted_sum = 0.0
        total_weight = 0.0
        for example, rating in taste_examples:
            if example.id is not None and candidate.id is not None and example.id == candidate.id:
                weighted_sum += rating
                total_weight += 1.0
                continue

            similarity = self._section_similarity(example, candidate)
            weight = abs(rating)
            weighted_sum += rating * similarity
            total_weight += weight

        if total_weight <= 0:
            return 0.0
        return max(-0.16, min(0.16, (weighted_sum / total_weight) * 0.12))

    def _section_similarity(self, left_section: TrackSection, right_section: TrackSection) -> float:
        left = left_section.drop_features
        right = right_section.drop_features
        if left is None or right is None:
            return 0.0

        bass = _json_similarity(
            left.bass_features,
            right.bass_features,
            ("rolling", "stabby", "aggression", "grooveComplexity", "subWeight", "bassHookStrength"),
        )
        kick = _json_similarity(
            left.kick_features,
            right.kick_features,
            ("punch", "hardness", "length", "straightFourOnFloor", "transientStrength"),
        )
        groove = _json_similarity(
            left.groove_features,
            right.groove_features,
            ("swing", "syncopation", "percussionDensity", "grooveStrength", "offbeatBassStrength"),
        )
        vocal = _json_similarity(left.vocal_features, right.vocal_features, ("density", "shortHook", "spoken", "sung"))
        energy = _feature_similarity(left.energy, right.energy)
        embedding = cosine_similarity(left_section.embedding, right_section.embedding)
        return (
            embedding * 0.30
            + bass * 0.24
            + kick * 0.14
            + groove * 0.16
            + vocal * 0.08
            + energy * 0.08
        )

    def _reasons(
        self,
        left: DropFeatures,
        right: DropFeatures,
        bass: float,
        kick: float,
        groove: float,
        structure: float,
        energy: float,
    ) -> list[str]:
        reasons: list[str] = []
        if bass > 0.75:
            reasons.append("Similar bass movement")
        if kick > 0.75:
            reasons.append("Straight punchy kick match")
        if structure > 0.75:
            if not left.starts_with_full_kick_bass and not right.starts_with_full_kick_bass:
                reasons.append("Delayed low-end entry")
            else:
                reasons.append("Similar drop structure")
        if groove > 0.72:
            reasons.append("Close groove and syncopation")
        if energy > 0.80:
            reasons.append("Similar drop energy")
        if right.vocal_density > 0.55:
            reasons.append("Vocal hook present")
        return reasons or ["Closest weighted Drop DNA match"]
