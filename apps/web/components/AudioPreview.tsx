"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { sectionAudioUrl } from "../lib/api";

export type AudioPreviewHandle = {
  seekPreview: (seconds: number) => void;
};

type AudioPreviewProps = {
  sectionId: string;
  startTime: number;
  endTime: number;
  compact?: boolean;
  onDurationChange?: (duration: number) => void;
};

function formatClock(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "0:00";
  }
  const minutes = Math.floor(seconds / 60);
  const rest = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${rest}`;
}

export const AudioPreview = forwardRef<AudioPreviewHandle, AudioPreviewProps>(function AudioPreview(
  { sectionId, startTime, endTime, compact = false, onDurationChange },
  ref,
) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [dropOnly, setDropOnly] = useState(false);
  const [currentTime, setCurrentTime] = useState(startTime);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (dropOnly) {
      const audio = audioRef.current;
      if (audio) {
        audio.currentTime = Math.max(0, startTime);
        setCurrentTime(audio.currentTime);
      }
    }
  }, [dropOnly, startTime, endTime]);

  useImperativeHandle(ref, () => ({
    seekPreview(seconds: number) {
      const audio = audioRef.current;
      if (!audio || !Number.isFinite(seconds)) {
        return;
      }
      audio.currentTime = Math.max(0, seconds);
      setCurrentTime(audio.currentTime);
      if (audio.paused) {
        void audio.play();
      }
    },
  }));

  function seekToStart() {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    if (dropOnly) {
      const start = Math.max(0, startTime);
      if (audio.currentTime < start || audio.currentTime >= endTime) {
        audio.currentTime = start;
      }
    }
  }

  function handlePlay() {
    seekToStart();
    setPlaying(true);
  }

  function handlePause() {
    setPlaying(false);
  }

  function handleLoadedMetadata() {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    const nextDuration = Number.isFinite(audio.duration) ? audio.duration : 0;
    setDuration(nextDuration);
    onDurationChange?.(nextDuration);
    setCurrentTime(audio.currentTime || startTime);
  }

  function handleTimeUpdate() {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    setCurrentTime(audio.currentTime);
    if (dropOnly && audio.currentTime >= endTime) {
      audio.pause();
      audio.currentTime = Math.max(0, startTime);
      setCurrentTime(audio.currentTime);
      setPlaying(false);
    }
  }

  function handleScrub(value: string) {
    const audio = audioRef.current;
    const nextTime = Number(value);
    if (!audio || !Number.isFinite(nextTime)) {
      return;
    }
    audio.currentTime = nextTime;
    setCurrentTime(nextTime);
    if (audio.paused) {
      void audio.play();
    }
  }

  function playDrop() {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    audio.currentTime = Math.max(0, startTime);
    setCurrentTime(audio.currentTime);
    setDropOnly(true);
    void audio.play();
  }

  return (
    <div className={compact ? "audio-preview audio-preview-compact" : "audio-preview"}>
      <div className="audio-preview-head">
        <span>{playing ? "Playing" : "Paused"}</span>
        <span>{formatClock(currentTime)} / {formatClock(duration)}</span>
      </div>
      <input
        aria-label="Track scrubber"
        className="track-scrubber"
        disabled={duration <= 0}
        max={duration || 0}
        min="0"
        onChange={(event) => handleScrub(event.target.value)}
        onInput={(event) => handleScrub(event.currentTarget.value)}
        step="0.1"
        type="range"
        value={Math.min(currentTime, duration || currentTime)}
      />
      <div className="audio-preview-actions">
        <button className={dropOnly ? "selected-feedback" : ""} onClick={() => setDropOnly((value) => !value)} type="button">
          Drop only
        </button>
        <button onClick={playDrop} type="button">Play drop</button>
        <span>{formatClock(startTime)} - {formatClock(endTime)}</span>
      </div>
      <audio
        controls
        onLoadedMetadata={handleLoadedMetadata}
        onPause={handlePause}
        onPlay={handlePlay}
        onTimeUpdate={handleTimeUpdate}
        preload="metadata"
        ref={audioRef}
        src={sectionAudioUrl(sectionId)}
      />
    </div>
  );
});
