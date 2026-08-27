CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS tracks (
    id UUID PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    artist VARCHAR(255) NOT NULL DEFAULT 'Unknown',
    genre VARCHAR(64) NOT NULL DEFAULT 'TECH_HOUSE',
    bpm DOUBLE PRECISION,
    key VARCHAR(32),
    audio_source VARCHAR(32) NOT NULL DEFAULT 'user_uploaded',
    preview_url TEXT,
    audio_path TEXT,
    created_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS ix_tracks_genre ON tracks (genre);
CREATE INDEX IF NOT EXISTS ix_tracks_title ON tracks (title);

CREATE TABLE IF NOT EXISTS track_sections (
    id UUID PRIMARY KEY,
    track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    type VARCHAR(64) NOT NULL DEFAULT 'drop',
    start_time DOUBLE PRECISION NOT NULL DEFAULT 0,
    end_time DOUBLE PRECISION NOT NULL DEFAULT 30,
    embedding JSONB NOT NULL DEFAULT '[]'::jsonb,
    embedding_vector vector(32),
    created_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS ix_track_sections_track_id ON track_sections (track_id);
CREATE INDEX IF NOT EXISTS ix_track_sections_type ON track_sections (type);

CREATE TABLE IF NOT EXISTS drop_features (
    section_id UUID PRIMARY KEY REFERENCES track_sections(id) ON DELETE CASCADE,
    energy DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    darkness DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    brightness DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    drop_impact DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    low_end_entry_delay DOUBLE PRECISION NOT NULL DEFAULT 0,
    starts_with_full_kick_bass BOOLEAN NOT NULL DEFAULT false,
    melody_density DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    vocal_density DOUBLE PRECISION NOT NULL DEFAULT 0,
    swing DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    syncopation DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    kick_features JSONB NOT NULL DEFAULT '{}'::jsonb,
    bass_features JSONB NOT NULL DEFAULT '{}'::jsonb,
    vocal_features JSONB NOT NULL DEFAULT '{}'::jsonb,
    groove_features JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS user_feedback (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    section_id UUID NOT NULL REFERENCES track_sections(id) ON DELETE CASCADE,
    rating DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS ix_user_feedback_section_id ON user_feedback (section_id);

CREATE TABLE IF NOT EXISTS taste_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    feature_weights JSONB NOT NULL DEFAULT '{}'::jsonb,
    embedding JSONB,
    embedding_vector vector(32),
    updated_at TIMESTAMP NOT NULL
);
