// Timing is stored in beats throughout the application
// Beats are converted to MIDI ticks only during export (128 ticks per beat)

export const DEFAULT_BPM = 93
export const MS_PER_MINUTE = 60000
export const MS_PER_BEAT = MS_PER_MINUTE / DEFAULT_BPM
export const MS_PER_BEAT_DIVISION = MS_PER_BEAT / 4
export const DEFAULT_MS_PER_BEAT = MS_PER_MINUTE / DEFAULT_BPM
export const DEFAULT_MS_PER_DIVISION = DEFAULT_MS_PER_BEAT / 4
export const DIVISIONS_PER_BEAT = 4 // 4 cells per beat (quarter-beat granularity)
export const BEATS_PER_BAR = 4
export const MAX_BEATS_PER_PATTERN = 128

export const PATTERN_GRID = {
  DIVISIONS_PER_BEAT: 4, // cells per beat
  BEAT_WIDTH: 40,
  DIVISION_WIDTH: 10,
  ROW_HEIGHT: 32
}
