"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AudioPreview } from "./AudioPreview";
import { apiPost, createFeedback, Recommendation } from "../lib/api";

const feedbackOptions = [
  { label: "Love", rating: 1.0 },
  { label: "Like", rating: 0.7 },
  { label: "Neutral", rating: 0.0 },
  { label: "Dislike", rating: -1.0 }
];

export function ResultsClient({ id }: { id: string }) {
  const [items, setItems] = useState<Recommendation[]>([]);
  const [status, setStatus] = useState("Loading similar drops...");
  const [rated, setRated] = useState<Record<string, string>>({});

  async function loadResults() {
    const recommendations = await apiPost<Recommendation[]>("/recommendations/similar", {
      section_id: id,
      limit: 5
    });
    setItems(recommendations);
    setStatus(recommendations.length ? "Ranked by weighted Drop DNA similarity." : "Import more Tech House drops to generate matches.");
  }

  useEffect(() => {
    loadResults().catch((error: Error) => setStatus(error.message));
  }, [id]);

  async function rate(sectionId: string, label: string, rating: number) {
    setStatus(`Saving ${label} feedback...`);
    try {
      await createFeedback({ section_id: sectionId, rating });
      setRated((current) => ({ ...current, [sectionId]: label }));
      setStatus(`Saved feedback: ${label}.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Feedback failed.");
    }
  }

  return (
    <section className="panel">
      <div className="section-head">
        <div>
          <h1>Best Matches</h1>
          <p className="muted">{status}</p>
        </div>
        <Link className="button" href={`/drop/${id}`}>Back to Drop DNA</Link>
      </div>
      {items.length === 0 ? (
        <div className="empty-state">Import at least two tracks, then return here.</div>
      ) : items.map((item) => (
        <article className="result-card result-card-wide" key={item.section.id}>
          <div className="art" />
          <div>
            <strong>{item.track.title}</strong>
            <div className="muted">{item.track.artist} · {item.track.bpm ?? "-"} BPM · {item.track.key ?? "-"}</div>
            <div className="pill-row">
              {item.reasons.slice(0, 5).map((reason) => <span className="pill" key={reason}>{reason}</span>)}
            </div>
            <AudioPreview
              compact
              sectionId={item.section.id}
              startTime={item.section.start_time}
              endTime={item.section.end_time}
            />
            <div className="feedback-row">
              {feedbackOptions.map((option) => (
                <button
                  className={rated[item.section.id] === option.label ? "selected-feedback" : ""}
                  key={option.label}
                  onClick={() => rate(item.section.id, option.label, option.rating)}
                  type="button"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <div className="match">{item.match_percent}%</div>
        </article>
      ))}
    </section>
  );
}
