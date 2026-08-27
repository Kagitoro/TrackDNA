"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { AudioPreview, type AudioPreviewHandle } from "./AudioPreview";
import { Metric } from "./Metric";
import { WaveformEditor } from "./WaveformEditor";
import { apiGet, apiPatch, createFeedback, Section } from "../lib/api";

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "0:00";
  }
  const wholeMinutes = Math.floor(seconds / 60);
  const rest = seconds - wholeMinutes * 60;
  const restText = rest < 10
    ? `0${rest.toFixed(rest % 1 === 0 ? 0 : 1)}`
    : rest.toFixed(rest % 1 === 0 ? 0 : 1);
  return `${wholeMinutes}:${restText}`;
}

function parseTime(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string") {
    return null;
  }
  const text = value.trim().replace(",", ".");
  if (!text || text.length > 8) {
    return null;
  }
  if (text.includes(":")) {
    const parts = text.split(":");
    if (parts.length !== 2) {
      return null;
    }
    const minutes = Number(parts[0]);
    const seconds = Number(parts[1]);
    if (!Number.isInteger(minutes) || !Number.isFinite(seconds) || minutes < 0 || seconds < 0 || seconds >= 60) {
      return null;
    }
    return minutes * 60 + seconds;
  }
  const seconds = Number(text);
  return Number.isFinite(seconds) && seconds >= 0 ? seconds : null;
}

export function DropClient({ id }: { id: string }) {
  const audioPreviewRef = useRef<AudioPreviewHandle | null>(null);
  const [section, setSection] = useState<Section | null>(null);
  const [status, setStatus] = useState("Loading Drop DNA...");
  const [busy, setBusy] = useState(false);
  const [draftStart, setDraftStart] = useState("0:00");
  const [draftEnd, setDraftEnd] = useState("0:30");
  const [trackDuration, setTrackDuration] = useState(0);
  const [ratingLabel, setRatingLabel] = useState<string | null>(null);

  async function loadSection() {
    const next = await apiGet<Section>(`/sections/${id}`);
    setSection(next);
    setStatus("Drop DNA ready.");
  }

  useEffect(() => {
    loadSection().catch((error: Error) => setStatus(error.message));
  }, [id]);

  useEffect(() => {
    if (!section) {
      return;
    }
    setDraftStart(formatTime(section.start_time));
    setDraftEnd(formatTime(section.end_time));
  }, [section]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const start_time = parseTime(draftStart);
    const end_time = parseTime(draftEnd);
    if (start_time === null || end_time === null) {
      setStatus("Use seconds or mm:ss, for example 45 or 1:20.");
      return;
    }
    if (end_time <= start_time) {
      setStatus("Drop end must be greater than start.");
      return;
    }
    setBusy(true);
    setStatus("Updating section and recalculating Drop DNA...");
    try {
      const next = await apiPatch<Section>(`/sections/${id}`, { start_time, end_time });
      setSection(next);
      setStatus("Drop boundaries updated.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Update failed.");
    } finally {
      setBusy(false);
    }
  }

  if (!section) {
    return (
      <section className="panel">
        <h1>Drop DNA</h1>
        <p className="muted">{status}</p>
      </section>
    );
  }

  const features = section.drop_features;
  const parsedStart = parseTime(draftStart) ?? section.start_time;
  const parsedEnd = parseTime(draftEnd) ?? section.end_time;
  const maxTime = Math.max(45, Math.ceil(trackDuration || parsedEnd || section.end_time));

  function setStartFromSlider(value: string) {
    const nextStart = Math.min(Number(value), Math.max(0, parsedEnd - 0.1));
    setDraftStart(formatTime(nextStart));
    audioPreviewRef.current?.seekPreview(nextStart);
  }

  function setEndFromSlider(value: string) {
    const nextEnd = Math.max(Number(value), parsedStart + 0.1);
    setDraftEnd(formatTime(nextEnd));
    audioPreviewRef.current?.seekPreview(nextEnd);
  }

  async function rateReference(sectionId: string, label: string, rating: number) {
    setStatus(`Saving ${label} feedback...`);
    try {
      await createFeedback({ section_id: sectionId, rating });
      setRatingLabel(label);
      setStatus(`Saved feedback: ${label}.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Feedback failed.");
    }
  }

  return (
    <section className="grid">
      <div className="panel">
        <h1>Drop DNA</h1>
        <p className="muted">Section {formatTime(section.start_time)} - {formatTime(section.end_time)}</p>
        <WaveformEditor
          duration={trackDuration}
          endTime={parsedEnd}
          onEndChange={(seconds) => setDraftEnd(formatTime(seconds))}
          onPreviewSeek={(seconds) => audioPreviewRef.current?.seekPreview(seconds)}
          onStartChange={(seconds) => setDraftStart(formatTime(seconds))}
          sectionId={section.id}
          startTime={parsedStart}
        />
        <div className="waveform-range">
          <input
            aria-label="Drop start slider"
            className="range-input range-start"
            max={maxTime}
            min="0"
            onChange={(event) => setStartFromSlider(event.target.value)}
            step="0.1"
            type="range"
            value={Math.min(parsedStart, maxTime)}
          />
          <input
            aria-label="Drop end slider"
            className="range-input range-end"
            max={maxTime}
            min="0"
            onChange={(event) => setEndFromSlider(event.target.value)}
            step="0.1"
            type="range"
            value={Math.min(parsedEnd, maxTime)}
          />
        </div>
        <AudioPreview
          onDurationChange={setTrackDuration}
          ref={audioPreviewRef}
          sectionId={section.id}
          startTime={parsedStart}
          endTime={parsedEnd}
        />
        <form className="compact-form" key={`${section.start_time}-${section.end_time}`} onSubmit={submit}>
          <div className="form-row">
            <label>
              <span>Drop start</span>
              <input
                autoComplete="off"
                inputMode="text"
                maxLength={8}
                name="start_time"
                onChange={(event) => setDraftStart(event.target.value)}
                placeholder="0:45"
                value={draftStart}
              />
            </label>
            <label>
              <span>Drop end</span>
              <input
                autoComplete="off"
                inputMode="text"
                maxLength={8}
                name="end_time"
                onChange={(event) => setDraftEnd(event.target.value)}
                placeholder="1:20"
                value={draftEnd}
              />
            </label>
          </div>
          <p className="time-hint">Format: seconds or mm:ss. Play drop previews these timings before saving.</p>
          <button disabled={busy} type="submit">{busy ? "Updating..." : "Update Drop"}</button>
        </form>
        <div className="feedback-row feedback-row-large">
          <button
            className={ratingLabel === "Love" ? "selected-feedback" : ""}
            type="button"
            onClick={() => rateReference(section.id, "Love", 1)}
          >
            Love
          </button>
          <button
            className={ratingLabel === "Like" ? "selected-feedback" : ""}
            type="button"
            onClick={() => rateReference(section.id, "Like", 0.7)}
          >
            Like
          </button>
          <button
            className={ratingLabel === "Dislike" ? "selected-feedback" : ""}
            type="button"
            onClick={() => rateReference(section.id, "Dislike", -1)}
          >
            Dislike
          </button>
        </div>
        <p className="muted">{status}</p>
        <Link className="button primary full-width" href={`/results/${section.id}`}>Find Similar Drops</Link>
      </div>
      <div className="panel">
        <h2>Core Features</h2>
        {features ? (
          <>
            <Metric label="Energy" value={features.energy} />
            <Metric label="Darkness" value={features.darkness} />
            <Metric label="Brightness" value={features.brightness} />
            <Metric label="Drop Impact" value={features.drop_impact} />
            <Metric label="Swing" value={features.swing} />
            <Metric label="Syncopation" value={features.syncopation} />
          </>
        ) : <p className="muted">No Drop DNA yet.</p>}
      </div>
      <div className="panel">
        <h2>Structure</h2>
        {features ? (
          <>
            <div className="dna-card">
              <strong>Low-end entry delay</strong>
              <p className="match">{features.low_end_entry_delay}s</p>
            </div>
            <div className="dna-card">
              <strong>Starts with kick + bass</strong>
              <p className="muted">{features.starts_with_full_kick_bass ? "Yes" : "No"}</p>
            </div>
            <div className="pill-row">
              <span className="pill">Melody {Math.round(features.melody_density * 100)}%</span>
              <span className="pill">Vocal {Math.round(features.vocal_density * 100)}%</span>
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
