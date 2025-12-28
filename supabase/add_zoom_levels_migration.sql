-- ============================================
-- ADD ZOOM LEVELS TO ALL_PROJECTS TABLE
-- ============================================

-- Add patternZoomLevel column with default value of 32
ALTER TABLE all_projects
ADD COLUMN "patternZoomLevel" integer NOT NULL DEFAULT 32;

-- Add progressionZoomLevel column with default value of 82
ALTER TABLE all_projects
ADD COLUMN "progressionZoomLevel" integer NOT NULL DEFAULT 82;

-- Create indexes for potential queries on zoom levels
CREATE INDEX idx_all_projects_pattern_zoom ON all_projects("patternZoomLevel");
CREATE INDEX idx_all_projects_progression_zoom ON all_projects("progressionZoomLevel");
