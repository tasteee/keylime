-- Keylime on D1. Dates are ISO text. Booleans are 0/1.
-- JSON columns hold JSON text.

CREATE TABLE users (
	id TEXT PRIMARY KEY,
	email TEXT NOT NULL UNIQUE,
	userName TEXT NOT NULL UNIQUE,
	avatarUrl TEXT,
	bio TEXT NOT NULL DEFAULT '',
	createdAt TEXT NOT NULL,
	updatedAt TEXT NOT NULL
);

CREATE INDEX users_by_created ON users (createdAt);

CREATE TABLE projects (
	id TEXT PRIMARY KEY,
	title TEXT NOT NULL,
	description TEXT NOT NULL DEFAULT '',
	userId TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
	isPublic INTEGER NOT NULL DEFAULT 0,
	key TEXT NOT NULL,
	scale TEXT NOT NULL,
	octave TEXT NOT NULL DEFAULT '3',
	bpm INTEGER NOT NULL DEFAULT 120,
	minVelocity INTEGER NOT NULL DEFAULT 60,
	maxVelocity INTEGER NOT NULL DEFAULT 100,
	progressionChords TEXT NOT NULL DEFAULT '[]',
	progressionDurationBars REAL NOT NULL DEFAULT 0,
	chordSymbols TEXT NOT NULL DEFAULT '[]',
	patternSignals TEXT NOT NULL DEFAULT '[]',
	patternSignalRows TEXT NOT NULL DEFAULT '{}',
	patternDurationBars INTEGER NOT NULL DEFAULT 1,
	patternZoomLevel INTEGER NOT NULL DEFAULT 32,
	progressionZoomLevel INTEGER NOT NULL DEFAULT 82,
	createdAt TEXT NOT NULL,
	updatedAt TEXT NOT NULL
);

CREATE INDEX projects_by_user ON projects (userId, updatedAt DESC);
CREATE INDEX projects_public ON projects (isPublic, updatedAt DESC);

CREATE TABLE project_favorites (
	userId TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
	projectId TEXT NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
	createdAt TEXT NOT NULL,
	PRIMARY KEY (userId, projectId)
);

-- Sign-in by email link. Only hashes are stored.
CREATE TABLE login_tokens (
	token_hash TEXT PRIMARY KEY,
	email TEXT NOT NULL,
	created_at TEXT NOT NULL,
	expires_at TEXT NOT NULL
);

CREATE INDEX login_tokens_by_email ON login_tokens (email, created_at);

CREATE TABLE sessions (
	session_hash TEXT PRIMARY KEY,
	user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
	expires_at TEXT NOT NULL
);

CREATE INDEX sessions_by_user ON sessions (user_id);
