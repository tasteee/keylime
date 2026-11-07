-- The voicing every chord uses unless it has one of its own.
-- Existing projects start at closed, the voicing they already play with.
ALTER TABLE projects ADD COLUMN voicing TEXT NOT NULL DEFAULT 'closed';
