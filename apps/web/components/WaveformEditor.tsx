"use client";

import { PointerEvent, useEffect, useMemo, useRef, useState } from "react";
import { sectionAudioUrl } from "../lib/api";

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

type WaveformEditorProps = {
  sectionId: string;
  startTime: number;
  endTime: number;
  duration: number;
  onStartChange: (seconds: number) => void;
  onEndChange: (seconds: number) => void;
  onPreviewSeek?: (seconds: number) => void;
};

function formatClock(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "0:00";
  }
  const minutes = Math.floor(seconds / 60);
  const rest = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${rest}`;
}

function buildFallbackPeaks(count: number): number[] {
  return Array.from({ length: count }, (_, index) => {
    const wave = Math.sin(index * 0.24) * 0.24 + Math.sin(index * 0.067) * 0.2;
    return Math.max(0.12, Math.min(0.86, 0.42 + wave));
  });
}

function peaksFromChannel(channel: Float32Array, barCount: number, gain = 1): number[] {
  const blockSize = Math.max(1, Math.floor(channel.length / barCount));
  return Array.from({ length: barCount }, (_, index) => {
    const start = index * blockSize;
    const end = Math.min(channel.length, start + blockSize);
    let sum = 0;
    for (let cursor = start; cursor < end; cursor += 1) {
      sum += channel[cursor] * channel[cursor];
    }
    return Math.min(1, Math.sqrt(sum / Math.max(1, end - start)) * gain);
  });
}

export function WaveformEditor({
  sectionId,
  startTime,
  endTime,
  duration,
  onStartChange,
  onEndChange,
  onPreviewSeek,
}: WaveformEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dragTargetRef = useRef<"start" | "end" | null>(null);
  const lastPreviewRef = useRef(0);
  const [peaks, setPeaks] = useState<number[]>(() => buildFallbackPeaks(360));
  const [status, setStatus] = useState("Загружаю waveform...");
  const safeDuration = Math.max(duration, endTime, startTime, 1);

  const selection = useMemo(() => {
    const left = Math.max(0, Math.min(1, startTime / safeDuration));
    const right = Math.max(0, Math.min(1, endTime / safeDuration));
    return { left, right };
  }, [endTime, safeDuration, startTime]);

  useEffect(() => {
    let cancelled = false;

    async function loadWaveform() {
      setStatus("Загружаю waveform...");
      try {
        const response = await fetch(sectionAudioUrl(sectionId), { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`audio ${response.status}`);
        }
        const buffer = await response.arrayBuffer();
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) {
          throw new Error("Web Audio API is not available");
        }
        const context = new AudioContextClass();
        const decoded = await context.decodeAudioData(buffer.slice(0));
        await context.close();
        if (cancelled) {
          return;
        }
        const barCount = Math.min(1400, Math.max(360, Math.floor(decoded.duration * 7)));
        setPeaks(peaksFromChannel(decoded.getChannelData(0), barCount, 3.2));
        setStatus("Весь трек виден. Клик/drag меняет тайминг.");
      } catch {
        if (!cancelled) {
          setPeaks(buildFallbackPeaks(360));
          setStatus("Waveform fallback. Клик/drag меняет тайминг.");
        }
      }
    }

    loadWaveform();
    return () => {
      cancelled = true;
    };
  }, [sectionId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const rect = canvas.getBoundingClientRect();
    const scale = window.devicePixelRatio || 1;
    const width = Math.max(1, Math.floor(rect.width * scale));
    const height = Math.max(1, Math.floor(rect.height * scale));
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(2, 8, 14, 0.64)";
    ctx.fillRect(0, 0, width, height);

    const middle = height / 2;
    const gap = 2 * scale;
    const displayBars = Math.min(360, Math.max(120, Math.floor(width / (3.2 * scale))));
    const barWidth = Math.max(2 * scale, width / displayBars - gap);

    Array.from({ length: displayBars }).forEach((_, index) => {
      const ratio = index / Math.max(1, displayBars - 1);
      const peakIndex = Math.max(0, Math.min(peaks.length - 1, Math.floor(ratio * peaks.length)));
      const peak = peaks[peakIndex] ?? 0.2;
      const x = index * (barWidth + gap);
      const barHeight = Math.max(4 * scale, peak * height * 0.74);
      const y = middle - barHeight / 2;
      const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
      gradient.addColorStop(0, "rgba(44, 233, 222, 0.2)");
      gradient.addColorStop(0.5, "rgba(44, 233, 222, 0.72)");
      gradient.addColorStop(1, "rgba(156, 92, 255, 0.28)");
      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, barWidth, barHeight);
    });

    const startX = selection.left * width;
    const endX = selection.right * width;
    ctx.fillStyle = "rgba(44, 233, 222, 0.16)";
    ctx.fillRect(startX, 0, Math.max(2 * scale, endX - startX), height);

    ctx.strokeStyle = "rgba(255, 255, 255, 0.88)";
    ctx.lineWidth = 2 * scale;
    ctx.beginPath();
    ctx.moveTo(startX, 0);
    ctx.lineTo(startX, height);
    ctx.moveTo(endX, 0);
    ctx.lineTo(endX, height);
    ctx.stroke();
  }, [peaks, safeDuration, selection]);

  function secondsFromPointer(event: PointerEvent<HTMLCanvasElement>): number {
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    return ratio * safeDuration;
  }

  function updateBoundary(target: "start" | "end", seconds: number) {
    const nextSeconds = Math.max(0, Math.min(safeDuration, seconds));
    if (target === "end") {
      onEndChange(Math.max(startTime + 0.1, nextSeconds));
    } else {
      onStartChange(Math.min(nextSeconds, endTime - 0.1));
    }
    const now = window.performance.now();
    if (now - lastPreviewRef.current > 75) {
      onPreviewSeek?.(nextSeconds);
      lastPreviewRef.current = now;
    }
  }

  function nearestBoundary(seconds: number): "start" | "end" {
    return Math.abs(seconds - startTime) <= Math.abs(seconds - endTime) ? "start" : "end";
  }

  function handlePointerDown(event: PointerEvent<HTMLCanvasElement>) {
    const seconds = secondsFromPointer(event);
    const target = event.shiftKey ? "end" : nearestBoundary(seconds);
    dragTargetRef.current = target;
    event.currentTarget.setPointerCapture(event.pointerId);
    updateBoundary(target, seconds);
    onPreviewSeek?.(seconds);
  }

  function handlePointerMove(event: PointerEvent<HTMLCanvasElement>) {
    if (!dragTargetRef.current) {
      return;
    }
    updateBoundary(dragTargetRef.current, secondsFromPointer(event));
  }

  function handlePointerUp(event: PointerEvent<HTMLCanvasElement>) {
    if (dragTargetRef.current) {
      onPreviewSeek?.(secondsFromPointer(event));
    }
    dragTargetRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  return (
    <div className="waveform-editor">
      <canvas
        aria-label="Track waveform editor"
        onPointerCancel={handlePointerUp}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        ref={canvasRef}
      />
      <div className="waveform-meta">
        <span>{formatClock(startTime)} - {formatClock(endTime)}</span>
        <span>Full track: 0:00 - {formatClock(safeDuration)}</span>
        <span>{status}</span>
      </div>
    </div>
  );
}
