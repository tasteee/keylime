import { addNotes, buildMovedNotes, fitNoteIntoLoop, updateNotes } from './commands'
import { DRAG_THRESHOLD_PX, MIN_NOTE_TICKS } from './constants'
import type { PatternEditorT } from './editor'
import { getNoteRect, getPitchAtY, getTickAtX, snapTick } from './geometry'
import { clampNumber } from './time'
import type { GestureT, NoteHitT, NoteT, PointT, RectT } from './types'

export type GestureContextT = {
	editor: PatternEditorT
	getLocalPoint: (event: { clientX: number; clientY: number }) => PointT
	setCursorStyle: (cursor: string) => void
	setMarquee: (rect: RectT | null) => void
}

type DownArgsT = {
	context: GestureContextT
	downEvent: PointerEvent
}

const createEmptyGesture = (): GestureT => {
	return { move: () => {}, up: () => {}, cancel: () => {} }
}

const getDistance = (pointA: PointT, pointB: PointT): number => {
	return Math.hypot(pointA.x - pointB.x, pointA.y - pointB.y)
}

type MoveGestureArgsT = DownArgsT & {
	anchor: NoteT
}

// Drag a note, or the whole selection if the note is selected.
// Hold Ctrl or Cmd while dragging to drop copies instead.
// Hold Shift to lock to one direction. Hold Alt to ignore the grid.
export const createMoveGesture = (args: MoveGestureArgsT): GestureT => {
	const editor = args.context.editor
	const downEvent = args.downEvent
	const anchor = args.anchor
	const wasSelected = editor.getSelectedIds().has(anchor.id)

	if (downEvent.shiftKey) editor.select({ ids: [anchor.id], mode: 'toggle' })
	if (!downEvent.shiftKey && !wasSelected) editor.select({ ids: [anchor.id] })

	const isAnchorSelected = editor.getSelectedIds().has(anchor.id)
	if (!isAnchorSelected) return createEmptyGesture()

	const origin = args.context.getLocalPoint(downEvent)
	const originView = editor.getView()
	const originTick = getTickAtX({ view: originView, x: origin.x })
	const originPitch = getPitchAtY({ view: originView, y: origin.y })
	const notes = editor.getSelectedNotes()
	let isDragging = false
	let isCopying = false
	let moved: NoteT[] = []
	let lastAnchorPitch = anchor.pitch

	editor.audition({ pitch: anchor.pitch, velocity: anchor.velocity })

	const move = (event: PointerEvent) => {
		const point = args.context.getLocalPoint(event)
		const hasMovedEnough = getDistance(point, origin) >= DRAG_THRESHOLD_PX
		if (!isDragging && !hasMovedEnough) return
		isDragging = true

		const view = editor.getView()
		const isAxisLocked = event.shiftKey
		const isMovingMostlySideways = Math.abs(point.x - origin.x) > Math.abs(point.y - origin.y)
		const pointerTick = getTickAtX({ view, x: point.x })
		const pointerPitch = getPitchAtY({ view, y: point.y })

		const rawTickShift = pointerTick - originTick
		const tickShift = isAxisLocked && !isMovingMostlySideways ? 0 : rawTickShift
		const targetPitch = isAxisLocked && isMovingMostlySideways ? originPitch : pointerPitch
		const hasTickShift = tickShift !== 0
		const snappedStart = snapTick({ tick: anchor.start + tickShift, isSnapOff: event.altKey, stepTicks: view.gridStepTicks })
		const ticks = hasTickShift ? snappedStart - anchor.start : 0
		const rows = targetPitch - originPitch

		moved = buildMovedNotes({ notes, loopEndTick: editor.getLoopEndTick(), ticks, rows })
		isCopying = event.metaKey || event.ctrlKey

		if (isCopying) {
			const copies = moved.map((note) => ({ ...note, id: `copy:${note.id}` }))
			editor.setPreview({ overrides: new Map(), added: copies })
		}
		if (!isCopying) {
			const overrides = new Map(moved.map((note) => [note.id, note]))
			editor.setPreview({ overrides, added: [] })
		}

		const movedAnchor = moved.find((note) => note.id === anchor.id)
		const didAnchorChangeRow = movedAnchor !== undefined && movedAnchor.pitch !== lastAnchorPitch
		if (didAnchorChangeRow) {
			lastAnchorPitch = (movedAnchor as NoteT).pitch
			editor.audition({ pitch: lastAnchorPitch, velocity: anchor.velocity })
		}

		args.context.setCursorStyle(isCopying ? 'copy' : 'grabbing')
	}

	const up = () => {
		if (!isDragging) {
			// A plain click on a note in a group picks just that note.
			const isGroupClick = !downEvent.shiftKey && wasSelected && editor.getSelectedIds().size > 1
			if (isGroupClick) editor.select({ ids: [anchor.id] })
			return
		}

		if (isCopying) {
			const drafts = moved.map((note) => ({
				pitch: note.pitch,
				start: note.start,
				duration: note.duration,
				velocity: note.velocity,
				isMuted: note.isMuted
			}))
			editor.setPreview(null)
			addNotes({ editor, drafts })
			return
		}

		editor.setPreview(null)
		updateNotes({ editor, updated: moved })
	}

	return { move, up, cancel: () => editor.setPreview(null) }
}

type ResizeGestureArgsT = DownArgsT & {
	hit: NoteHitT
}

// Drag the left or right edge of a note. The whole selection follows.
export const createResizeGesture = (args: ResizeGestureArgsT): GestureT => {
	const editor = args.context.editor
	const downEvent = args.downEvent
	const anchor = args.hit.note
	const edge = args.hit.zone

	const isAnchorSelected = editor.getSelectedIds().has(anchor.id)
	if (!isAnchorSelected) editor.select({ ids: [anchor.id], mode: downEvent.shiftKey ? 'add' : 'replace' })

	const notes = editor.getSelectedNotes()
	const originTick = getTickAtX({ view: editor.getView(), x: args.context.getLocalPoint(downEvent).x })
	let resized: NoteT[] = []

	const getShortestDuration = (note: NoteT, isSnapOff: boolean, stepTicks: number): number => {
		if (isSnapOff) return MIN_NOTE_TICKS
		return Math.min(stepTicks, note.duration)
	}

	const move = (event: PointerEvent) => {
		const view = editor.getView()
		const loopEndTick = editor.getLoopEndTick()
		const pointerTick = getTickAtX({ view, x: args.context.getLocalPoint(event).x })
		const tickShift = pointerTick - originTick
		const isSnapOff = event.altKey

		if (edge === 'end') {
			const anchorEnd = anchor.start + anchor.duration
			const snappedEnd = snapTick({ tick: anchorEnd + tickShift, isSnapOff, stepTicks: view.gridStepTicks })
			const delta = snappedEnd - anchorEnd

			resized = notes.map((note) => {
				const shortest = getShortestDuration(note, isSnapOff, view.gridStepTicks)
				const duration = Math.max(shortest, note.duration + delta)
				return fitNoteIntoLoop({ note: { ...note, duration }, loopEndTick })
			})
		}

		if (edge === 'start') {
			const snappedStart = snapTick({ tick: anchor.start + tickShift, isSnapOff, stepTicks: view.gridStepTicks })
			const delta = snappedStart - anchor.start

			resized = notes.map((note) => {
				const endTick = note.start + note.duration
				const shortest = getShortestDuration(note, isSnapOff, view.gridStepTicks)
				const start = clampNumber({ value: note.start + delta, min: 0, max: endTick - shortest })
				return { ...note, start, duration: endTick - start }
			})
		}

		const overrides = new Map(resized.map((note) => [note.id, note]))
		editor.setPreview({ overrides, added: [] })
	}

	const up = () => {
		editor.setPreview(null)
		const hasResized = resized.length > 0
		if (!hasResized) return

		updateNotes({ editor, updated: resized })
		const resizedAnchor = resized.find((note) => note.id === anchor.id)
		if (resizedAnchor) editor.setView({ noteLength: resizedAnchor.duration })
	}

	return { move, up, cancel: () => editor.setPreview(null) }
}

const getMarqueeRect = (args: { origin: PointT; point: PointT }): RectT => {
	const left = Math.min(args.origin.x, args.point.x)
	const top = Math.min(args.origin.y, args.point.y)
	const right = Math.max(args.origin.x, args.point.x)
	const bottom = Math.max(args.origin.y, args.point.y)
	return { x: left, y: top, width: right - left, height: bottom - top }
}

const checkDoRectsOverlap = (rectA: RectT, rectB: RectT): boolean => {
	const isLeftOf = rectA.x + rectA.width <= rectB.x
	const isRightOf = rectA.x >= rectB.x + rectB.width
	const isAbove = rectA.y + rectA.height <= rectB.y
	const isBelow = rectA.y >= rectB.y + rectB.height
	return !(isLeftOf || isRightOf || isAbove || isBelow)
}

// Drag on empty grid to draw a box. Notes inside it are selected.
// Each note sounds as the box reaches it, so a quick sweep plays a chord.
// A plain click clears the selection and moves the paste cursor.
export const createMarqueeGesture = (args: DownArgsT): GestureT => {
	const editor = args.context.editor
	const downEvent = args.downEvent
	const origin = args.context.getLocalPoint(downEvent)
	const isAddingToSelection = downEvent.shiftKey || downEvent.metaKey || downEvent.ctrlKey
	const initialIds = isAddingToSelection ? [...editor.getSelectedIds()] : []
	let isDragging = false
	let insideIds = new Set<string>()

	const move = (event: PointerEvent) => {
		const point = args.context.getLocalPoint(event)
		const hasMovedEnough = getDistance(point, origin) >= DRAG_THRESHOLD_PX
		if (!isDragging && !hasMovedEnough) return
		isDragging = true

		const marqueeRect = getMarqueeRect({ origin, point })
		args.context.setMarquee(marqueeRect)

		const view = editor.getView()
		const hits = editor.getNotes().filter((note) => {
			const noteRect = getNoteRect({ view, note })
			return checkDoRectsOverlap(noteRect, marqueeRect)
		})

		const soundedPitches = new Set<number>()
		for (const note of hits) {
			const wasInside = insideIds.has(note.id)
			const isSilent = note.isMuted || soundedPitches.has(note.pitch)
			if (wasInside || isSilent) continue
			soundedPitches.add(note.pitch)
			editor.audition({ pitch: note.pitch, velocity: note.velocity })
		}

		insideIds = new Set(hits.map((note) => note.id))
		editor.select({ ids: [...initialIds, ...insideIds] })
	}

	const up = (event: PointerEvent) => {
		if (isDragging) return
		if (!isAddingToSelection) editor.clearSelection()

		const view = editor.getView()
		const clickedTick = getTickAtX({ view, x: origin.x })
		const cursorTick = snapTick({ tick: clickedTick, mode: 'floor', isSnapOff: event.altKey, stepTicks: view.gridStepTicks })
		editor.setView({ cursorTick })
	}

	return { move, up, cancel: () => editor.select({ ids: initialIds }) }
}

type VelocityGestureArgsT = DownArgsT & {
	hitNote: NoteT
}

const VELOCITY_DRAG_PIXELS = 160

// Right-click a note and drag up or down to change its velocity.
// If the note is selected, the whole selection changes together.
export const createVelocityGesture = (args: VelocityGestureArgsT): GestureT => {
	const editor = args.context.editor
	const hitNote = args.hitNote
	const isHitSelected = editor.getSelectedIds().has(hitNote.id)
	if (!isHitSelected) editor.select({ ids: [hitNote.id] })

	const notes = editor.getSelectedNotes()
	const originY = args.context.getLocalPoint(args.downEvent).y
	let changed: NoteT[] = []

	const move = (event: PointerEvent) => {
		const pointerY = args.context.getLocalPoint(event).y
		const velocityShift = (originY - pointerY) / VELOCITY_DRAG_PIXELS

		changed = notes.map((note) => {
			const velocity = clampNumber({ value: note.velocity + velocityShift, min: 0, max: 1 })
			return { ...note, velocity }
		})

		const overrides = new Map(changed.map((note) => [note.id, note]))
		editor.setPreview({ overrides, added: [] })
		args.context.setCursorStyle('ns-resize')
	}

	const up = () => {
		editor.setPreview(null)
		const hasChanged = changed.length > 0
		if (!hasChanged) return

		updateNotes({ editor, updated: changed })
		const changedHit = changed.find((note) => note.id === hitNote.id)
		if (changedHit) editor.setView({ noteVelocity: changedHit.velocity })
	}

	return { move, up, cancel: () => editor.setPreview(null) }
}

// Middle-drag pans the grid.
export const createPanGesture = (args: DownArgsT): GestureT => {
	const editor = args.context.editor
	const startView = editor.getView()
	const startX = args.downEvent.clientX
	const startY = args.downEvent.clientY
	args.context.setCursorStyle('grabbing')

	const move = (event: PointerEvent) => {
		const view = editor.getView()
		const scrollTick = startView.scrollTick - (event.clientX - startX) / view.pxPerTick
		const scrollRow = startView.scrollRow - (event.clientY - startY) / view.rowHeight
		editor.setView({ scrollTick, scrollRow })
	}

	return { move, up: () => {}, cancel: () => {} }
}
