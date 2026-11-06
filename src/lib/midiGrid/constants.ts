import { ROWS_PER_BAND, SIGNAL_IDS } from '$lib/constants/signalRows'

// The grid counts time in ticks so every edit lands on a whole number.
// KeyLime stores signals in beats. Beats are converted at the edges.
export const TICKS_PER_BEAT = 960
export const BEATS_PER_BAR = 4
export const TICKS_PER_BAR = TICKS_PER_BEAT * BEATS_PER_BAR

// One cell is a 1/16 note: a quarter of a beat.
export const TICKS_PER_CELL = TICKS_PER_BEAT / 4

// The shortest signal the grid can hold (1/16 of a beat).
// Only reachable with snapping turned off.
export const MIN_NOTE_TICKS = TICKS_PER_BEAT / 16

export const MAX_PATTERN_BARS = 16
export const MAX_PATTERN_TICKS = MAX_PATTERN_BARS * TICKS_PER_BAR

// Rows are chord tones, not keys. Pitch 0 is the bottom row.
export const ROW_COUNT = SIGNAL_IDS.length
export const ROWS_IN_BAND = ROWS_PER_BAND

export const DEFAULT_NOTE_VELOCITY = 0.8
export const VELOCITY_STEP = 0.05

// A cell is this many pixels wide at zoom level 1.
// patternZoomLevel (16 - 48) is the width of one cell and the height of one row.
export const CELLS_PER_BEAT = 4

export const RULER_HEIGHT = 32
export const VELOCITY_LANE_HEIGHT = 88
export const ROW_LABELS_WIDTH = 80
export const DRAG_THRESHOLD_PX = 3
