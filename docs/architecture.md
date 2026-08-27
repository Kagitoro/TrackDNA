# TrackDNA Architecture

## Product Boundary

TrackDNA searches similar Tech House track sections, with the MVP focused on drops. It must not rely on isolated bass, kick, synth, or vocal samples as the main search object.

## System Shape

```text
Next.js web
  -> FastAPI
  -> PostgreSQL + pgvector
  -> Redis queue
  -> Audio analysis worker
```

## Core Domain

- `Track`: metadata and source information for local/licensed audio.
- `TrackSection`: section boundaries such as intro, build, drop, breakdown, outro.
- `DropFeatures`: normalized musical features for a drop.
- `UserFeedback`: Love/Like/Neutral/Dislike rating.
- `TasteProfile`: user preference weights and optional preferred embedding.

## Audio Pipeline

```text
Audio Track
  -> Track segmentation
  -> Drop extraction
  -> Feature extraction
  -> Audio embedding
  -> Drop DNA
  -> Similarity ranking
```

The MVP uses replaceable placeholder services:

- `TrackSegmenter`: creates a default drop section.
- `EmbeddingService`: deterministic placeholder embedding.
- `FeatureExtractor`: deterministic Drop DNA.
- `SimilarityService`: weighted similarity over embeddings and features.

These are interfaces by design. Stem separation and specialized audio embeddings come later.

## Similarity Weights

Weights are configuration, not route logic:

```text
embedding 35%
bass      20%
kick      10%
groove    15%
structure 10%
vocal      5%
energy     5%
```

## Legal Constraint

The MVP stores only local, licensed, preview, or user-uploaded audio. It does not download full copyrighted tracks from streaming services.
