"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { apiDelete, apiGet, Section, Track, uploadTrack } from "../lib/api";

type TrackWithDrop = {
  track: Track;
  drop: Section | null;
};

const discoverLimit = 20;

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DiscoverClient() {
  const [items, setItems] = useState<TrackWithDrop[]>([]);
  const [status, setStatus] = useState("Ready to import local Tech House audio. UI v2");
  const [busy, setBusy] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  async function loadTracks() {
    const tracks = await apiGet<Track[]>(`/tracks/search?limit=${discoverLimit}`);
    const withDrops: TrackWithDrop[] = [];
    for (const track of tracks) {
      try {
        const sections = await apiGet<Section[]>(`/tracks/${track.id}/sections`);
        withDrops.push({ track, drop: sections.find((section) => section.type === "drop") ?? sections[0] ?? null });
      } catch {
        withDrops.push({ track, drop: null });
      }
    }
    setItems(withDrops);
  }

  useEffect(() => {
    loadTracks().catch((error: Error) => setStatus(error.message));
  }, []);

  useEffect(() => {
    if (!busy) {
      setElapsedSeconds(0);
      return;
    }
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [busy]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) {
      setStatus("Choose an audio file first.");
      return;
    }

    if (String(form.get("bpm") ?? "").trim() === "") {
      form.delete("bpm");
    }
    if (String(form.get("key") ?? "").trim() === "") {
      form.delete("key");
    }

    setBusy(true);
    setElapsedSeconds(0);
    setStatus(`Uploading audio (${formatFileSize(file.size)}) and creating Drop DNA...`);
    try {
      const result = await uploadTrack(form);
      setStatus(`Imported: ${result.track.title}. Drop created.`);
      setItems((current) => [{ track: result.track, drop: result.section }, ...current]);
      event.currentTarget.reset();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteImportedTrack(track: Track) {
    const ok = window.confirm(`Delete "${track.title}" from Imported Drops?`);
    if (!ok) {
      return;
    }
    setBusy(true);
    setStatus(`Deleting: ${track.title}...`);
    try {
      await apiDelete(`/tracks/${track.id}`);
      setItems((current) => current.filter((item) => item.track.id !== track.id));
      setStatus(`Deleted: ${track.title}.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Delete failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="discover-layout">
      <form className="upload-card" onSubmit={submit}>
        <div>
          <h2>Import Reference Track</h2>
          <p className="muted">Use local/licensed Tech House audio. MVP starts with an editable 0:00-0:45 drop.</p>
        </div>
        <label>
          <span>Title</span>
          <input name="title" placeholder="Night Driver" required />
        </label>
        <label>
          <span>Artist</span>
          <input name="artist" placeholder="Kairo C." defaultValue="Unknown" />
        </label>
        <div className="form-row">
          <label>
            <span>BPM optional</span>
            <input name="bpm" placeholder="Auto later / 128" inputMode="decimal" maxLength={6} />
          </label>
          <label>
            <span>Key optional</span>
            <input name="key" placeholder="Auto later / E min" maxLength={16} />
          </label>
        </div>
        <label>
          <span>Audio file</span>
          <input name="file" type="file" accept="audio/*,.wav,.mp3,.aif,.aiff,.flac" required />
        </label>
        <button className="primary" disabled={busy} type="submit">
          {busy ? "Uploading and Creating Drop DNA..." : "Upload and Create Drop"}
        </button>
        <p className="muted">
          {status}
          {busy && elapsedSeconds > 0 ? ` ${elapsedSeconds}s` : ""}
        </p>
      </form>

      <section className="track-list">
        <div className="section-head">
          <div>
            <h2>Imported Drops</h2>
            <p className="muted">Open Drop DNA, then run similarity search.</p>
          </div>
          <button type="button" onClick={() => loadTracks()}>Refresh</button>
        </div>
        {items.length === 0 ? (
          <div className="empty-state">No tracks yet. Import 2-10 Tech House files to test similarity.</div>
        ) : (
          items.map(({ track, drop }) => (
            <article className="result-card" key={track.id}>
              <div className="art" />
              <div>
                <strong>{track.title}</strong>
                <div className="muted">{track.artist} · {track.bpm ?? "-"} BPM · {track.key ?? "-"}</div>
                <div className="pill-row">
                  <span className="pill">TECH HOUSE</span>
                  <span className="pill">DROP DNA</span>
                </div>
              </div>
              {drop ? (
                <div className="card-actions">
                  <Link className="button primary" href={`/drop/${drop.id}`}>Open</Link>
                  <button disabled={busy} type="button" onClick={() => deleteImportedTrack(track)}>Delete</button>
                </div>
              ) : (
                <div className="card-actions">
                  <span className="muted">No drop</span>
                  <button disabled={busy} type="button" onClick={() => deleteImportedTrack(track)}>Delete</button>
                </div>
              )}
            </article>
          ))
        )}
      </section>
    </div>
  );
}
