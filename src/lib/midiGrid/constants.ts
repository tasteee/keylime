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

// The grid scrolls this far past the last bar. That stretch is disabled
// and fades out: nothing can be placed there, only spilled into by a
// group move.
export const OVERSCROLL_TICKS = TICKS_PER_BAR * 1.5
export const GRID_END_TICKS = MAX_PATTERN_TICKS + OVERSCROLL_TICKS

// Rows are chord tones, not keys. Pitch 0 is the bottom row.
export const ROW_COUNT = SIGNAL_IDS.length
export const ROWS_IN_BAND = ROWS_PER_BAND

export const DEFAULT_NOTE_VELOCITY = 0.8
export const VELOCITY_STEP = 0.05

// A cell is this many pixels wide at zoom level 1.
// patternZoomLevel (8 - 96) is the width of one cell. Row height is separate.
export const CELLS_PER_BEAT = 4

export const RULER_HEIGHT = 32
export const VELOCITY_LANE_HEIGHT = 88
export const ROW_LABELS_WIDTH = 80
export const DRAG_THRESHOLD_PX = 3

// Horizontal zoom is the width of one cell, in pixels. It is dragged
// on the ruler. Vertical zoom is the height of one row, dragged on the labels.
export const MIN_CELL_PIXELS = 8
export const MAX_CELL_PIXELS = 96
export const DEFAULT_CELL_PIXELS = 32
export const MIN_ROW_HEIGHT = 16
export const MAX_ROW_HEIGHT = 64

// Grid steps in ticks, from coarsest to finest: 1/4, 1/8, 1/16, 1/32, 1/64.
export const GRID_STEPS_TICKS = [
	TICKS_PER_BEAT,
	TICKS_PER_BEAT / 2,
	TICKS_PER_BEAT / 4,
	TICKS_PER_BEAT / 8,
	TICKS_PER_BEAT / 16
]

// A grid step never gets narrower than this many pixels.
export const MIN_GRID_STEP_PIXELS = 20
