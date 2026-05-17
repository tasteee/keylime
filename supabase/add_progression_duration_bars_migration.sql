-- ============================================
-- ADD PROGRESSION DURATION BARS TO ALL_PROJECTS TABLE
-- ============================================

-- Add progressionDurationBars column with default value of 0
ALTER TABLE all_projects
ADD COLUMN "progressionDurationBars" numeric NOT NULL DEFAULT 0;
