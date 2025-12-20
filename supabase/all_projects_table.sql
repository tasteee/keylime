-- ============================================
-- ALL USERS TABLE
-- ============================================

CREATE TABLE all_users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  "userName" text NOT NULL UNIQUE,
  "avatarUrl" text,
  bio text NOT NULL DEFAULT '',
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_all_users_user_name ON all_users("userName");
CREATE INDEX idx_all_users_created_at ON all_users("createdAt");

-- updatedAt trigger
CREATE OR REPLACE FUNCTION update_all_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_all_users_updated_at
BEFORE UPDATE ON all_users
FOR EACH ROW
EXECUTE FUNCTION update_all_users_updated_at();

-- RLS
ALTER TABLE all_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
ON all_users
FOR SELECT
USING (true);

CREATE POLICY "Users can insert own profile"
ON all_users
FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON all_users
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete own profile"
ON all_users
FOR DELETE
USING (auth.uid() = id);



-- ============================================
-- ALL PROJECTS TABLE
-- ============================================

CREATE TABLE all_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  "userId" uuid NOT NULL REFERENCES all_users(id) ON DELETE CASCADE,
  "isPublic" boolean NOT NULL DEFAULT false,
  key text NOT NULL,
  scale text NOT NULL,
  octave integer NOT NULL DEFAULT 4,
  bpm integer NOT NULL DEFAULT 120,
  "minVelocity" integer NOT NULL DEFAULT 60,
  "maxVelocity" integer NOT NULL DEFAULT 100,
  "progressionChords" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "chordSymbols" text[] NOT NULL DEFAULT ARRAY[]::text[],
  "patternSignals" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "patternSignalRows" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "patternDurationBars" integer NOT NULL DEFAULT 4,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_all_projects_user_id ON all_projects("userId");
CREATE INDEX idx_all_projects_is_public ON all_projects("isPublic");
CREATE INDEX idx_all_projects_key ON all_projects(key);
CREATE INDEX idx_all_projects_scale ON all_projects(scale);
CREATE INDEX idx_all_projects_bpm ON all_projects(bpm);
CREATE INDEX idx_all_projects_created_at ON all_projects("createdAt");
CREATE INDEX idx_all_projects_updated_at ON all_projects("updatedAt");
CREATE INDEX idx_all_projects_public_created
  ON all_projects("isPublic", "createdAt" DESC);
CREATE INDEX idx_all_projects_public_key_scale
  ON all_projects("isPublic", key, scale);

-- updatedAt trigger
CREATE OR REPLACE FUNCTION update_all_projects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_all_projects_updated_at
BEFORE UPDATE ON all_projects
FOR EACH ROW
EXECUTE FUNCTION update_all_projects_updated_at();

-- RLS
ALTER TABLE all_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own projects"
ON all_projects
FOR SELECT
USING (auth.uid() = "userId");

CREATE POLICY "Users can view public projects"
ON all_projects
FOR SELECT
USING ("isPublic" = true);

CREATE POLICY "Users can insert own projects"
ON all_projects
FOR INSERT
WITH CHECK (auth.uid() = "userId");

CREATE POLICY "Users can update own projects"
ON all_projects
FOR UPDATE
USING (auth.uid() = "userId")
WITH CHECK (auth.uid() = "userId");

CREATE POLICY "Users can delete own projects"
ON all_projects
FOR DELETE
USING (auth.uid() = "userId");



-- ============================================
-- PROJECT FAVORITES TABLE
-- ============================================

CREATE TABLE project_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" uuid NOT NULL REFERENCES all_users(id) ON DELETE CASCADE,
  "projectId" uuid NOT NULL REFERENCES all_projects(id) ON DELETE CASCADE,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  UNIQUE ("userId", "projectId")
);

-- Indexes
CREATE INDEX idx_project_favorites_user_id
  ON project_favorites("userId");
CREATE INDEX idx_project_favorites_project_id
  ON project_favorites("projectId");
CREATE INDEX idx_project_favorites_created_at
  ON project_favorites("createdAt");

-- RLS
ALTER TABLE project_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all favorites"
ON project_favorites
FOR SELECT
USING (true);

CREATE POLICY "Users can create own favorites"
ON project_favorites
FOR INSERT
WITH CHECK (auth.uid() = "userId");

CREATE POLICY "Users can delete own favorites"
ON project_favorites
FOR DELETE
USING (auth.uid() = "userId");
