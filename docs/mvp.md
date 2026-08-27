# TrackDNA MVP

## Goal

Build the first working loop:

```text
Upload Tech House tracks
  -> select drop
  -> analyze
  -> display Drop DNA
  -> select reference
  -> find similar drops
  -> rate results
```

## Phase 1 Scope

- Monorepo structure.
- Docker Compose with web, api, postgres, redis, audio-worker.
- FastAPI backend.
- PostgreSQL schema with pgvector.
- Local audio upload endpoint.
- Track and TrackSection models.
- Manual drop section support.
- Placeholder embedding service.
- Weighted similarity service.
- Basic results page.
- Feedback endpoint.

## Out Of Scope

- Spotify/Beatport full integrations.
- Copyrighted audio downloading.
- Custom neural network training.
- Stem separation.
- Automatic production-grade segmentation.

## Demo Target

1. Import 10 local Tech House files.
2. Create one drop per track.
3. Generate placeholder embeddings.
4. Pick a reference drop.
5. Return top 5 similar drops.
6. Store feedback.

## Implemented Vertical Slice

- Upload form on `/discover`.
- Imported tracks list on `/discover`.
- Drop DNA page on `/drop/[id]`.
- Manual drop boundary update through `PATCH /sections/{id}`.
- Similarity results on `/results/[id]`.
- Feedback buttons that persist ratings through `POST /feedback`.
