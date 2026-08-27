"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AudioPreview } from "./AudioPreview";
import { apiGet, createFeedback, Section, Track } from "../lib/api";

type ReviewDrop = {
  track: Track;
  section: Section;
};

const ratingActions = [
  { label: "Dislike", rating: -1, className: "review-action-negative" },
  { label: "Like", rating: 0.7, className: "review-action-positive" },
  { label: "Love", rating: 1, className: "review-action-love" },
];

const reviewBatchSize = 12;

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "0:00";
  }
  const minutes = Math.floor(seconds / 60);
  const rest = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${rest}`;
}

export function ReviewClient() {
  const [drops, setDrops] = useState<ReviewDrop[]>([]);
  const [index, setIndex] = useState(0);
  const [status, setStatus] = useState("Loading drops...");
  const [busy, setBusy] = useState(false);
  const [lastRating, setLastRating] = useState<string | null>(null);

  async function loadDrops() {
    setStatus("Loading drops...");
    const tracks = await apiGet<Track[]>(`/tracks/search?limit=${reviewBatchSize}`);
    const loaded: Array<ReviewDrop | null> = [];
    for (const track of tracks) {
      try {
        const sections = await apiGet<Section[]>(`/tracks/${track.id}/sections`);
        const section = sections.find((item) => item.type === "drop") ?? sections[0] ?? null;
        loaded.push(section ? { track, section } : null);
      } catch {
        loaded.push(null);
      }
    }
    const nextDrops = loaded.filter((item): item is ReviewDrop => item !== null);
    setDrops(nextDrops);
    setIndex(0);
    setLastRating(null);
    setStatus(nextDrops.length ? "Listen and rate drops to train your taste." : "Import Tech House tracks first.");
  }

  useEffect(() => {
    loadDrops().catch((error: Error) => setStatus(error.message));
  }, []);

  const current = drops[index] ?? null;
  const progress = useMemo(() => {
    if (!drops.length) {
      return "0 / 0";
    }
    return `${Math.min(index + 1, drops.length)} / ${drops.length}`;
  }, [drops.length, index]);

  async function rateCurrent(label: string, rating: number) {
    if (!current || busy) {
      return;
    }
    setBusy(true);
    setStatus(`Saving ${label}...`);
    try {
      await createFeedback({ section_id: current.section.id, rating });
      setLastRating(label);
      setIndex((value) => Math.min(value + 1, drops.length));
      setStatus(`Saved ${label}.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Feedback failed.");
    } finally {
      setBusy(false);
    }
  }

  function skipCurrent() {
    setLastRating("Skipped");
    setIndex((value) => Math.min(value + 1, drops.length));
  }

  function restartReview() {
    setIndex(0);
    setLastRating(null);
    setStatus(drops.length ? "Review restarted." : "Import Tech House tracks first.");
  }

  if (!current) {
    return (
      <section className="panel review-shell">
        <div className="review-empty">
          <div>
            <p className="muted">Review Drops</p>
            <h1>{drops.length ? "Review complete" : "No drops yet"}</h1>
            <p className="muted">{drops.length ? "You rated every imported drop in this pass." : status}</p>
          </div>
          <div className="review-empty-actions">
            <button type="button" onClick={restartReview} disabled={!drops.length}>Start again</button>
            <button type="button" onClick={() => loadDrops()}>Refresh</button>
            <Link className="button primary" href="/discover">Import Drops</Link>
          </div>
        </div>
      </section>
    );
  }

  const features = current.section.drop_features;

  return (
    <section className="panel review-shell">
      <div className="review-header">
        <div>
          <p className="muted">Review Drops</p>
          <h1>Train your Tech House taste</h1>
        </div>
        <div className="review-progress">
          <span>{progress}</span>
          <button type="button" onClick={() => loadDrops()}>Refresh</button>
        </div>
      </div>

      <article className="review-card">
        <div className="review-art">
          <div className="review-art-wave" />
        </div>
        <div className="review-card-body">
          <div className="review-card-title">
            <div>
              <h2>{current.track.title}</h2>
              <p className="muted">{current.track.artist}</p>
            </div>
            <Link className="button" href={`/drop/${current.section.id}`}>Open DNA</Link>
          </div>
          <div className="pill-row">
            <span className="pill">{current.track.bpm ?? "-"} BPM</span>
            <span className="pill">{current.track.key ?? "Key unknown"}</span>
            <span className="pill">{formatTime(current.section.start_time)} - {formatTime(current.section.end_time)}</span>
          </div>
          <AudioPreview
            compact
            sectionId={current.section.id}
            startTime={current.section.start_time}
            endTime={current.section.end_time}
          />
          {features ? (
            <div className="review-feature-grid">
              <span>Energy {Math.round(features.energy * 100)}%</span>
              <span>Dark {Math.round(features.darkness * 100)}%</span>
              <span>Impact {Math.round(features.drop_impact * 100)}%</span>
              <span>Vocal {Math.round(features.vocal_density * 100)}%</span>
            </div>
          ) : (
            <p className="muted">No Drop DNA features yet.</p>
          )}
        </div>
      </article>

      <div className="review-actions">
        {ratingActions.map((action) => (
          <button
            className={action.className}
            disabled={busy}
            key={action.label}
            onClick={() => rateCurrent(action.label, action.rating)}
            type="button"
          >
            {action.label}
          </button>
        ))}
      </div>
      <div className="review-footer">
        <button disabled={busy} type="button" onClick={skipCurrent}>Skip</button>
        <span className="muted">{lastRating ? `Last: ${lastRating}. ` : ""}{status}</span>
      </div>
    </section>
  );
}
