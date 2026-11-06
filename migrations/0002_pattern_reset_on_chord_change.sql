-- Lets a project restart its pattern at every chord.
-- patternDurationBars is declared INTEGER, but SQLite keeps fractional
-- values such as 0.0625 as-is, so pattern lengths below one bar need no change.
ALTER TABLE projects ADD COLUMN doesPatternResetOnChordChange INTEGER NOT NULL DEFAULT 0;
