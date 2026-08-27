from app.services.embedding import cosine_similarity
from uuid import uuid4

from app.models import DropFeatures, TrackSection
from app.services.similarity import SimilarityService


def test_cosine_similarity_identical_vectors() -> None:
    assert cosine_similarity([1.0, 0.0], [1.0, 0.0]) == 1.0


def test_cosine_similarity_opposite_vectors_normalized_to_zero() -> None:
    assert cosine_similarity([1.0, 0.0], [-1.0, 0.0]) == 0.0


def _section(embedding: list[float], rolling: float, punch: float, energy: float) -> TrackSection:
    section = TrackSection(id=uuid4(), embedding=embedding)
    section.drop_features = DropFeatures(
        energy=energy,
        darkness=0.5,
        brightness=0.5,
        drop_impact=0.7,
        low_end_entry_delay=0.0,
        starts_with_full_kick_bass=True,
        melody_density=0.3,
        vocal_density=0.1,
        swing=0.35,
        syncopation=0.35,
        bass_features={
            "rolling": rolling,
            "stabby": 1.0 - rolling,
            "aggression": 0.5,
            "grooveComplexity": 0.5,
            "subWeight": 0.7,
            "bassHookStrength": 0.5,
        },
        kick_features={
            "punch": punch,
            "hardness": 0.6,
            "length": 0.4,
            "straightFourOnFloor": 1.0,
            "transientStrength": 0.7,
        },
        vocal_features={"density": 0.1, "shortHook": 0.0, "spoken": 0.0, "sung": 0.0},
        groove_features={
            "swing": 0.35,
            "syncopation": 0.35,
            "percussionDensity": 0.5,
            "grooveStrength": 0.7,
            "offbeatBassStrength": 0.6,
        },
    )
    return section


def test_taste_boost_prefers_sections_similar_to_liked_drops() -> None:
    liked = _section([1.0, 0.0], rolling=0.9, punch=0.8, energy=0.8)
    similar = _section([0.95, 0.05], rolling=0.85, punch=0.75, energy=0.78)
    different = _section([0.0, 1.0], rolling=0.1, punch=0.3, energy=0.25)

    service = SimilarityService()

    assert service._taste_boost(similar, [(liked, 1.0)]) > service._taste_boost(different, [(liked, 1.0)])
