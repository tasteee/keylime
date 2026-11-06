-- Marks which shape a project's chord data is stored in.
-- 1 = the original shape (tonal-era voicings, rootNote/bassNote on every chord).
-- 2 = the shape @tasteee/scaled understands.
-- Version 1 projects are converted when they are opened, then saved back.
-- Existing rows start at 1; new saves write 2.
ALTER TABLE projects ADD COLUMN dataVersion INTEGER NOT NULL DEFAULT 1;
