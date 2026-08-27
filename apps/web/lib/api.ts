export type Track = {
  id: string;
  title: string;
  artist: string;
  genre: string;
  bpm: number | null;
  key: string | null;
};

export type DropFeatures = {
  energy: number;
  darkness: number;
  brightness: number;
  drop_impact: number;
  low_end_entry_delay: number;
  starts_with_full_kick_bass: boolean;
  melody_density: number;
  vocal_density: number;
  swing: number;
  syncopation: number;
  kick_features: Record<string, number | boolean>;
  bass_features: Record<string, number | boolean>;
  vocal_features: Record<string, number | boolean>;
  groove_features: Record<string, number | boolean>;
};

export type Section = {
  id: string;
  track_id: string;
  type: string;
  start_time: number;
  end_time: number;
  embedding: number[];
  drop_features: DropFeatures | null;
};

export type Recommendation = {
  section: Section;
  track: Track;
  score: number;
  match_percent: number;
  reasons: string[];
};

export type ImportTrackResponse = {
  track: Track;
  section: Section;
};

export type FeedbackCreate = {
  section_id: string;
  rating: number;
  user_id?: string | null;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export function apiUrl(path: string): string {
  return `${API_URL}${path}`;
}

export function sectionAudioUrl(sectionId: string): string {
  return apiUrl(`/sections/${sectionId}/audio`);
}

function networkError(path: string): Error {
  return new Error(`Cannot reach TrackDNA API at ${API_URL}${path}. Check that Docker API is running on localhost:8000.`);
}

export async function apiGet<T>(path: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { cache: "no-store" });
  } catch {
    throw networkError(path);
  }
  if (!response.ok) {
    throw new Error(`API ${response.status}: ${path}`);
  }
  return response.json() as Promise<T>;
}

export async function uploadTrack(form: FormData): Promise<ImportTrackResponse> {
  const path = "/api/tracks/import";
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 60_000);
  let response: Response;
  try {
    response = await fetch(path, {
      method: "POST",
      body: form,
      signal: controller.signal
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Upload timed out after 60s. Check web/api logs or restart containers.");
    }
    throw new Error("Cannot reach TrackDNA web upload route. Check that localhost:3000 is running.");
  } finally {
    window.clearTimeout(timeout);
  }

  if (!response.ok) {
    let detail = "";
    try {
      const body = (await response.json()) as { detail?: unknown };
      detail = typeof body.detail === "string" ? `: ${body.detail}` : "";
    } catch {
      detail = "";
    }
    throw new Error(`Upload failed: ${response.status}${detail}`);
  }
  return response.json() as Promise<ImportTrackResponse>;
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store"
    });
  } catch {
    throw networkError(path);
  }
  if (!response.ok) {
    throw new Error(`API ${response.status}: ${path}`);
  }
  return response.json() as Promise<T>;
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store"
    });
  } catch {
    throw networkError(path);
  }
  if (!response.ok) {
    throw new Error(`API ${response.status}: ${path}`);
  }
  return response.json() as Promise<T>;
}

export async function apiDelete(path: string): Promise<void> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method: "DELETE",
      cache: "no-store"
    });
  } catch {
    throw networkError(path);
  }
  if (!response.ok) {
    throw new Error(`API ${response.status}: ${path}`);
  }
}

export async function createFeedback(body: FeedbackCreate): Promise<void> {
  const path = "/feedback";
  let response: Response;
  try {
    response = await fetch(apiUrl(path), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body)
    });
  } catch {
    throw networkError(path);
  }
  if (!response.ok) {
    throw new Error(`Feedback failed: ${response.status}`);
  }
}
