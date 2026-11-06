import { BEATS_PER_BAR, MAX_PATTERN_TICKS, TICKS_PER_BEAT, TICKS_PER_CELL } from './constants'

export type SnapModeT = 'round' | 'floor' | 'ceil'

export const convertBeatsToTicks = (beats: number): number => Math.round(beats * TICKS_PER_BEAT)
export const convertTicksToBeats = (ticks: number): number => ticks / TICKS_PER_BEAT
export const convertBarsToTicks = (bars: number): number => Math.round(bars * BEATS_PER_BAR * TICKS_PER_BEAT)
export const convertTicksToBars = (ticks: number): number => ticks / (BEATS_PER_BAR * TICKS_PER_BEAT)

export const clampNumber = (args: { value: number; min: number; max: number }): number => {
	if (args.value < args.min) return args.min
	if (args.value > args.max) return args.max
	return args.value
}

type SnapTickArgsT = {
	tick: number
	mode: SnapModeT
}

export const snapTickToCell = (args: SnapTickArgsT): number => {
	const cells = args.tick / TICKS_PER_CELL
	if (args.mode === 'floor') return Math.max(0, Math.floor(cells) * TICKS_PER_CELL)
	if (args.mode === 'ceil') return Math.max(0, Math.ceil(cells) * TICKS_PER_CELL)
	return Math.max(0, Math.round(cells) * TICKS_PER_CELL)
}

type StepTickArgsT = {
	tick: number
	direction: -1 | 1
}

// The next cell line past a tick, in a direction.
// A tick between lines lands on the nearest line that way.
export const stepTickByCell = (args: StepTickArgsT): number => {
	const isMovingBack = args.direction < 0
	const lineMode: SnapModeT = isMovingBack ? 'ceil' : 'floor'
	const currentLine = snapTickToCell({ tick: args.tick, mode: lineMode })
	const steppedLine = currentLine + args.direction * TICKS_PER_CELL
	return Math.max(0, steppedLine)
}

// A pattern is between one cell and sixteen bars long, in whole cells.
export const clampLoopEndTick = (tick: number): number => {
	const snappedTick = snapTickToCell({ tick, mode: 'round' })
	return clampNumber({ value: snappedTick, min: TICKS_PER_CELL, max: MAX_PATTERN_TICKS })
}
