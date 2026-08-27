# TrackDNA Tech House MVP

TrackDNA is a vertical-slice MVP for finding similar Tech House drops by section DNA, not by isolated samples.

## Development

```bash
docker compose up
```

On Windows you can also run:

```bat
run_trackdna.bat
```

Services:

- `web`: Next.js UI
- `api`: FastAPI backend
- `postgres`: PostgreSQL with pgvector
- `redis`: queue backend
- `audio-worker`: placeholder audio analysis worker

## MVP Flow

1. Upload licensed/local Tech House audio.
2. Create or adjust one drop section.
3. Generate placeholder embedding and deterministic Drop DNA.
4. Select a reference drop.
5. Find similar drops.
6. Rate results.

## Current UI Flow

Open:

```text
http://localhost:3000/discover
```

Then:

1. Upload at least two local Tech House audio files.
2. Click `Open` on one imported track.
3. Adjust `Drop start` and `Drop end` if needed.
4. Click `Find Similar Drops`.
5. Rate results with `Love`, `Like`, `Neutral`, or `Dislike`.

This repository intentionally does not download copyrighted music from Spotify, Beatport, or other streaming services.
