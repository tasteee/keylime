import { GRID_END_TICKS, MAX_PATTERN_TICKS, ROW_COUNT, ROWS_IN_BAND, TICKS_PER_BAR, TICKS_PER_BEAT } from './constants'
import { getXAtTick, getNoteRect } from './geometry'
import { withAlpha, type PaletteT } from './palette'
import type { NoteT, ViewT } from './types'

const NOTE_RADIUS = 3
const NOTE_MIN_OPACITY = 0.42
const MUTED_OPACITY = 0.3
const INACTIVE_OPACITY = 0.35

type PaintBaseArgsT = {
	context: CanvasRenderingContext2D
	palette: PaletteT
	view: ViewT
	width: number
}

const clampNumber = (value: number, min: number, max: number): number => {
	if (value < min) return min
	if (value > max) return max
	return value
}

// A line one pixel wide that sits exactly on a pixel.
export const getCrispPosition = (value: number): number => Math.round(value) + 0.5

export const drawRoundedRect = (args: {
	context: CanvasRenderingContext2D
	x: number
	y: number
	width: number
	height: number
	radius: number
}) => {
	const safeRadius = Math.max(0, Math.min(args.radius, args.width / 2, args.height / 2))
	args.context.beginPath()
	args.context.roundRect(args.x, args.y, args.width, args.height, safeRadius)
}

type PaintBackgroundArgsT = PaintBaseArgsT & {
	height: number
}

// Every row looks the same. The only mark is a stronger line between
// bands, so the eight rows of one octave of tones read as a group.
export const drawRows = (args: PaintBackgroundArgsT) => {
	const context = args.context
	const palette = args.palette
	const rowHeight = args.view.rowHeight

	context.fillStyle = palette.background
	context.fillRect(0, 0, args.width, args.height)

	for (let displayRow = 0; displayRow < ROW_COUNT; displayRow++) {
		const rowBottom = Math.round((displayRow + 1 - args.view.scrollRow) * rowHeight) - 1
		const isOffscreen = rowBottom < -1 || rowBottom > args.height + 1
		if (isOffscreen) continue

		const isBandEdge = (displayRow + 1) % ROWS_IN_BAND === 0
		context.fillStyle = isBandEdge ? palette.lineBand : palette.lineRow
		context.fillRect(0, rowBottom, args.width, 1)
	}
}

type PaintTimeGridArgsT = PaintBaseArgsT & {
	top: number
	height: number
	shouldShadeBars: boolean
}

// Bars alternate in tone. Cells, beats and bars get a line each.
export const drawTimeGrid = (args: PaintTimeGridArgsT) => {
	const context = args.context
	const palette = args.palette
	const view = args.view
	const firstTick = view.scrollTick
	const lastTick = view.scrollTick + args.width / view.pxPerTick
	const stepTicks = view.gridStepTicks
	const stepPixels = stepTicks * view.pxPerTick
	const stepAlpha = clampNumber((stepPixels - 5) / 10, 0, 1)

	const firstBar = Math.max(0, Math.floor(firstTick / TICKS_PER_BAR))
	const lastBar = Math.ceil(lastTick / TICKS_PER_BAR)

	if (args.shouldShadeBars) {
		context.fillStyle = palette.barShade
		for (let bar = firstBar; bar < lastBar; bar++) {
			const isShadedBar = bar % 2 === 1
			if (!isShadedBar) continue
			const barX = getXAtTick({ view, tick: bar * TICKS_PER_BAR })
			const barWidth = TICKS_PER_BAR * view.pxPerTick
			context.fillRect(barX, args.top, barWidth, args.height)
		}
	}

	const firstStep = Math.max(0, Math.floor(firstTick / stepTicks))
	const lastStep = Math.ceil(lastTick / stepTicks)
	const stepsPerBeat = TICKS_PER_BEAT / stepTicks
	const stepsPerBar = TICKS_PER_BAR / stepTicks

	context.lineWidth = 1

	const drawLines = (strokeStyle: string, shouldDrawStep: (step: number) => boolean) => {
		context.strokeStyle = strokeStyle
		context.beginPath()
		for (let step = firstStep; step <= lastStep; step++) {
			if (!shouldDrawStep(step)) continue
			const lineX = getCrispPosition(getXAtTick({ view, tick: step * stepTicks }))
			context.moveTo(lineX, args.top)
			context.lineTo(lineX, args.top + args.height)
		}
		context.stroke()
	}

	const isPlainStep = (step: number) => step % stepsPerBeat !== 0
	const isPlainBeat = (step: number) => step % stepsPerBeat === 0 && step % stepsPerBar !== 0
	const isBar = (step: number) => step % stepsPerBar === 0

	const hasVisibleSteps = stepAlpha > 0.01
	if (hasVisibleSteps) drawLines(withAlpha(palette.lineCell, stepAlpha), isPlainStep)
	drawLines(palette.lineBeat, isPlainBeat)
	drawLines(palette.lineBar, isBar)
}

type PaintLoopArgsT = PaintBaseArgsT & {
	top: number
	height: number
	loopEndTick: number
}

// Everything past the end of the pattern is dimmed and ends in an accent line.
export const drawLoopEnd = (args: PaintLoopArgsT) => {
	const context = args.context
	const palette = args.palette
	const loopEndX = getXAtTick({ view: args.view, tick: args.loopEndTick })
	const isOffscreen = loopEndX > args.width
	if (isOffscreen) return

	const shadeStart = Math.max(0, loopEndX)
	context.fillStyle = palette.inactiveShade
	context.fillRect(shadeStart, args.top, args.width - shadeStart, args.height)

	context.fillStyle = palette.accent
	context.fillRect(Math.round(loopEndX) - 0.5, args.top, 1.5, args.height)
}

type PaintOverscrollArgsT = PaintBaseArgsT & {
	top: number
	height: number
}

// The stretch past the last bar fades from half to nothing. It is drawn
// over the grid and the notes, so everything in it fades together.
export const drawOverscrollFade = (args: PaintOverscrollArgsT) => {
	const context = args.context
	const palette = args.palette
	const fadeStartX = getXAtTick({ view: args.view, tick: MAX_PATTERN_TICKS })
	const fadeEndX = getXAtTick({ view: args.view, tick: GRID_END_TICKS })
	const isOffscreen = fadeStartX >= args.width
	if (isOffscreen) return

	const gradient = context.createLinearGradient(fadeStartX, 0, fadeEndX, 0)
	gradient.addColorStop(0, withAlpha(palette.background, 0.45))
	gradient.addColorStop(1, withAlpha(palette.background, 1))

	const left = Math.max(0, fadeStartX)
	const solidStart = Math.min(args.width, fadeEndX)
	context.fillStyle = gradient
	context.fillRect(left, args.top, Math.max(0, solidStart - left), args.height)

	const hasSolidPart = fadeEndX < args.width
	if (!hasSolidPart) return
	context.fillStyle = palette.background
	context.fillRect(Math.max(0, fadeEndX), args.top, args.width - Math.max(0, fadeEndX), args.height)
}

type PaintNotesArgsT = PaintBaseArgsT & {
	height: number
	notes: NoteT[]
	selectedIds: ReadonlySet<string>
	hoverId: string | null
	loopEndTick: number
	playheadTick: number | null
	isDragging: boolean
}

type NoteLookT = {
	isSelected: boolean
	isHovered: boolean
	isPlaying: boolean
	isInactive: boolean
}

const getNoteOpacity = (args: { note: NoteT; look: NoteLookT }): number => {
	const velocityOpacity = NOTE_MIN_OPACITY + (1 - NOTE_MIN_OPACITY) * args.note.velocity
	const baseOpacity = args.look.isSelected ? 1 : velocityOpacity
	const mutedOpacity = args.note.isMuted ? baseOpacity * MUTED_OPACITY : baseOpacity
	const hoveredOpacity = args.look.isHovered && !args.look.isSelected ? Math.min(1, mutedOpacity + 0.2) : mutedOpacity
	return args.look.isInactive ? hoveredOpacity * INACTIVE_OPACITY : hoveredOpacity
}

type PaintNoteArgsT = PaintBaseArgsT & {
	height: number
	note: NoteT
	look: NoteLookT
}

const drawNote = (args: PaintNoteArgsT) => {
	const context = args.context
	const palette = args.palette
	const rect = getNoteRect({ view: args.view, note: args.note })

	const isOffscreenX = rect.x > args.width || rect.x + rect.width < 0
	const isOffscreenY = rect.y > args.height || rect.y + rect.height < 0
	if (isOffscreenX || isOffscreenY) return

	const insetY = rect.y + 1
	const noteHeight = Math.max(2, rect.height - 2)
	const noteWidth = rect.width - 1
	const fillBase = args.look.isPlaying ? palette.accent : palette.text
	const opacity = getNoteOpacity({ note: args.note, look: args.look })

	context.globalAlpha = opacity
	drawRoundedRect({ context, x: rect.x + 0.5, y: insetY, width: noteWidth, height: noteHeight, radius: NOTE_RADIUS })
	context.fillStyle = fillBase
	context.fill()

	if (args.note.isMuted) {
		context.setLineDash([3, 2])
		context.lineWidth = 1
		context.strokeStyle = palette.text
		drawRoundedRect({ context, x: rect.x + 1, y: insetY + 0.5, width: noteWidth - 1, height: noteHeight - 1, radius: NOTE_RADIUS })
		context.stroke()
		context.setLineDash([])
	}

	context.globalAlpha = args.look.isInactive ? INACTIVE_OPACITY : 1

	if (args.look.isSelected) {
		context.lineWidth = 1.5
		context.strokeStyle = palette.accent
		drawRoundedRect({ context, x: rect.x + 1.25, y: insetY + 0.75, width: noteWidth - 1.5, height: noteHeight - 1.5, radius: NOTE_RADIUS })
		context.stroke()
	}

	context.globalAlpha = 1
}

export const checkIsNotePlaying = (args: { note: NoteT; playheadTick: number | null }): boolean => {
	const hasPlayhead = args.playheadTick !== null
	if (!hasPlayhead) return false
	const playhead = args.playheadTick as number
	return playhead >= args.note.start && playhead < args.note.start + args.note.duration
}

// Unselected notes first, so selected notes draw on top.
export const drawNotes = (args: PaintNotesArgsT) => {
	const sorted = [...args.notes].sort((noteA, noteB) => {
		const aWeight = Number(args.selectedIds.has(noteA.id))
		const bWeight = Number(args.selectedIds.has(noteB.id))
		return aWeight - bWeight
	})

	for (const note of sorted) {
		const isCopyPreview = note.id.startsWith('copy:')
		const isSelected = args.selectedIds.has(note.id) || isCopyPreview
		const isHovered = !args.isDragging && args.hoverId === note.id
		const isPlaying = checkIsNotePlaying({ note, playheadTick: args.playheadTick })
		const isInactive = note.start >= args.loopEndTick
		const look: NoteLookT = { isSelected, isHovered, isPlaying, isInactive }

		drawNote({ context: args.context, palette: args.palette, view: args.view, width: args.width, height: args.height, note, look })
	}
}

type PaintPlayheadArgsT = PaintBaseArgsT & {
	height: number
	playheadTick: number | null
}

export const drawPlayhead = (args: PaintPlayheadArgsT) => {
	const hasPlayhead = args.playheadTick !== null
	if (!hasPlayhead) return

	const playheadX = getXAtTick({ view: args.view, tick: args.playheadTick as number })
	args.context.fillStyle = args.palette.text
	args.context.fillRect(Math.round(playheadX) - 0.75, 0, 1.5, args.height)
}

// A faint line where paste will land.
export const drawCursorLine = (args: PaintPlayheadArgsT & { cursorTick: number }) => {
	const hasCursor = args.cursorTick > 0
	if (!hasCursor) return

	const cursorX = getCrispPosition(getXAtTick({ view: args.view, tick: args.cursorTick }))
	args.context.strokeStyle = withAlpha(args.palette.text, 0.35)
	args.context.setLineDash([4, 3])
	args.context.lineWidth = 1
	args.context.beginPath()
	args.context.moveTo(cursorX, 0)
	args.context.lineTo(cursorX, args.height)
	args.context.stroke()
	args.context.setLineDash([])
}
