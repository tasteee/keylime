import {
	DEFAULT_NOTE_VELOCITY,
	MAX_PATTERN_TICKS,
	MIN_NOTE_TICKS,
	ROW_COUNT,
	TICKS_PER_BAR,
	TICKS_PER_BEAT
} from './constants'
import { getGridStepTicks } from './gridStep'
import { resolveOverlaps } from './overlaps'
import { clampPitch } from './rows'
import { clampLoopEndTick, clampNumber } from './time'
import type { NoteChangesT, NoteT, PreviewT, SelectModeT, ViewportT, ViewT } from './types'

export type AuditionArgsT = {
	pitch: number
	velocity: number
}

export type PatternEditorHooksT = {
	// The notes changed. Write them back to the project.
	onCommit: (notes: NoteT[]) => void
	// The user dragged the end of the loop.
	onLoopEndChange: (loopEndTick: number) => void
	// Make a sound for a row.
	onAudition: (args: AuditionArgsT) => void
}

export type SelectArgsT = {
	ids: Iterable<string>
	mode?: SelectModeT
}

export type PatternEditorT = {
	getNotes: () => NoteT[]
	getDisplayNotes: () => NoteT[]
	getNote: (id: string) => NoteT | undefined
	getSelectedIds: () => ReadonlySet<string>
	getSelectedNotes: () => NoteT[]
	select: (args: SelectArgsT) => void
	clearSelection: () => void
	getView: () => ViewT
	setView: (changes: Partial<ViewT>) => void
	getViewport: () => ViewportT
	setViewport: (viewport: ViewportT) => void
	getMaxScrollTick: () => number
	getMaxScrollRow: (rowHeight?: number) => number
	getLoopEndTick: () => number
	setLoopEndTick: (loopEndTick: number) => void
	requestLoopEndTick: (loopEndTick: number) => void
	getPlayheadTick: () => number | null
	setPlayheadTick: (playheadTick: number | null) => void
	getHoverId: () => string | null
	setHoverId: (hoverId: string | null) => void
	getPreview: () => PreviewT | null
	setPreview: (preview: PreviewT | null) => void
	getClipboard: () => NoteT[]
	setClipboard: (notes: NoteT[]) => void
	replaceNotes: (notes: NoteT[]) => void
	applyChanges: (changes: NoteChangesT) => void
	audition: (args: AuditionArgsT) => void
	createId: () => string
	subscribe: (listener: () => void) => () => void
}

export const DEFAULT_VIEW: ViewT = {
	pxPerTick: 32 / 240,
	rowHeight: 32,
	gridStepTicks: TICKS_PER_BEAT / 4,
	scrollTick: 0,
	scrollRow: 0,
	cursorTick: 0,
	noteVelocity: DEFAULT_NOTE_VELOCITY,
	noteLength: null
}

let idCounter = 0

// Shared, so a copy survives switching to the chords view and back.
let sharedClipboard: NoteT[] = []

export const createNoteId = (): string => {
	idCounter += 1
	const timePart = Date.now().toString(36)
	const countPart = idCounter.toString(36)
	const randomPart = Math.random().toString(36).slice(2, 6)
	return `s${timePart}${countPart}${randomPart}`
}

const normalizeNote = (note: NoteT): NoteT => {
	return {
		...note,
		pitch: clampPitch(note.pitch),
		start: Math.max(0, Math.round(note.start)),
		duration: Math.max(MIN_NOTE_TICKS, Math.round(note.duration)),
		velocity: clampNumber({ value: note.velocity, min: 0, max: 1 })
	}
}

const checkAreNotesEqual = (noteA: NoteT, noteB: NoteT): boolean => {
	const isSamePlace = noteA.pitch === noteB.pitch && noteA.start === noteB.start
	const isSameShape = noteA.duration === noteB.duration && noteA.velocity === noteB.velocity
	return isSamePlace && isSameShape && noteA.isMuted === noteB.isMuted
}

const sortNotes = (notes: NoteT[]): NoteT[] => {
	return [...notes].sort((noteA, noteB) => noteA.start - noteB.start || noteB.pitch - noteA.pitch)
}

// The editor holds everything the grid needs while the user works:
// the notes, the selection, the view and the drag preview. The project
// stays the source of truth: every change is handed back through onCommit.
export const createPatternEditor = (hooks: PatternEditorHooksT): PatternEditorT => {
	const notesById = new Map<string, NoteT>()
	const listeners = new Set<() => void>()
	let selectedIds = new Set<string>()
	let view: ViewT = { ...DEFAULT_VIEW }
	let viewport: ViewportT = { width: 0, height: 0 }
	let loopEndTick = TICKS_PER_BAR
	let playheadTick: number | null = null
	let hoverId: string | null = null
	let preview: PreviewT | null = null
	let sortedNotesCache: NoteT[] | null = null
	let displayNotesCache: NoteT[] | null = null

	const emit = () => {
		listeners.forEach((listener) => listener())
	}

	const clearNoteCaches = () => {
		sortedNotesCache = null
		displayNotesCache = null
	}

	const getNotes = (): NoteT[] => {
		if (sortedNotesCache) return sortedNotesCache
		sortedNotesCache = sortNotes([...notesById.values()])
		return sortedNotesCache
	}

	const getDisplayNotes = (): NoteT[] => {
		if (!preview) return getNotes()
		if (displayNotesCache) return displayNotesCache

		const overrides = preview.overrides
		const replaced = getNotes().map((note) => overrides.get(note.id) ?? note)
		displayNotesCache = [...replaced, ...preview.added]
		return displayNotesCache
	}

	const getNote = (id: string) => notesById.get(id)

	const getSelectedNotes = (): NoteT[] => {
		const found: NoteT[] = []
		for (const id of selectedIds) {
			const note = notesById.get(id)
			if (note) found.push(note)
		}
		return found
	}

	const checkIsSameSelection = (nextIds: Set<string>): boolean => {
		const isSameSize = nextIds.size === selectedIds.size
		if (!isSameSize) return false
		for (const id of nextIds) if (!selectedIds.has(id)) return false
		return true
	}

	const select = (args: SelectArgsT) => {
		const mode: SelectModeT = args.mode ?? 'replace'
		const nextIds = mode === 'replace' ? new Set<string>() : new Set(selectedIds)

		for (const id of args.ids) {
			const doesNoteExist = notesById.has(id)
			if (!doesNoteExist) continue

			const isRemoving = mode === 'remove' || (mode === 'toggle' && nextIds.has(id))
			if (isRemoving) nextIds.delete(id)
			if (!isRemoving) nextIds.add(id)
		}

		if (checkIsSameSelection(nextIds)) return
		selectedIds = nextIds
		emit()
	}

	const clearSelection = () => select({ ids: [] })

	const pruneSelection = () => {
		const keptIds = [...selectedIds].filter((id) => notesById.has(id))
		const didLoseNotes = keptIds.length !== selectedIds.size
		if (didLoseNotes) selectedIds = new Set(keptIds)
	}

	const getMaxScrollTick = (): number => {
		const viewportTicks = viewport.width / view.pxPerTick
		return Math.max(0, MAX_PATTERN_TICKS - viewportTicks)
	}

	const getMaxScrollRow = (rowHeight: number = view.rowHeight): number => {
		const viewportRows = viewport.height / rowHeight
		return Math.max(0, ROW_COUNT - viewportRows)
	}

	const clampScroll = (nextView: ViewT): ViewT => {
		const maxScrollTick = getMaxScrollTick()
		const maxScrollRow = getMaxScrollRow(nextView.rowHeight)
		const scrollTick = clampNumber({ value: nextView.scrollTick, min: 0, max: maxScrollTick })
		const scrollRow = clampNumber({ value: nextView.scrollRow, min: 0, max: maxScrollRow })
		return { ...nextView, scrollTick, scrollRow }
	}

	const checkIsSameView = (viewA: ViewT, viewB: ViewT): boolean => {
		const keys = Object.keys(viewA) as Array<keyof ViewT>
		return keys.every((key) => viewA[key] === viewB[key])
	}

	const setView = (changes: Partial<ViewT>) => {
		const mergedView = { ...view, ...changes }
		const gridStepTicks = getGridStepTicks({ pxPerTick: mergedView.pxPerTick })
		const nextView = clampScroll({ ...mergedView, gridStepTicks })
		if (checkIsSameView(nextView, view)) return
		view = nextView
		clearNoteCaches()
		emit()
	}

	const setViewport = (nextViewport: ViewportT) => {
		const isSame = nextViewport.width === viewport.width && nextViewport.height === viewport.height
		if (isSame) return
		viewport = nextViewport
		setView({})
		emit()
	}

	// Syncs the loop from the project. Does not call the hook.
	const setLoopEndTick = (nextLoopEndTick: number) => {
		if (nextLoopEndTick === loopEndTick) return
		loopEndTick = nextLoopEndTick
		emit()
	}

	// A change the user made on the grid. Shows right away, then the
	// project is told. A pattern is always at least one cell long.
	const requestLoopEndTick = (requestedTick: number) => {
		const nextLoopEndTick = clampLoopEndTick(requestedTick)
		if (nextLoopEndTick === loopEndTick) return
		loopEndTick = nextLoopEndTick
		emit()
		hooks.onLoopEndChange(nextLoopEndTick)
	}

	const setPlayheadTick = (nextPlayheadTick: number | null) => {
		if (nextPlayheadTick === playheadTick) return
		playheadTick = nextPlayheadTick
		emit()
	}

	const setHoverId = (nextHoverId: string | null) => {
		if (nextHoverId === hoverId) return
		hoverId = nextHoverId
		emit()
	}

	const setPreview = (nextPreview: PreviewT | null) => {
		preview = nextPreview
		displayNotesCache = null
		emit()
	}

	// The project changed from outside the grid (undo, a library pattern).
	const replaceNotes = (nextNotes: NoteT[]) => {
		notesById.clear()
		for (const note of nextNotes) notesById.set(note.id, note)
		clearNoteCaches()
		pruneSelection()
		preview = null
		emit()
	}

	// Every edit goes through here. It applies the change, lets the newest
	// notes win any overlap in their row, and hands the result to the project.
	const applyChanges = (changes: NoteChangesT) => {
		const hasNothing = changes.added.length === 0 && changes.updated.length === 0 && changes.removedIds.length === 0
		if (hasNothing) return

		const changedUpdates = changes.updated.filter((note) => {
			const current = notesById.get(note.id)
			if (!current) return false
			return !checkAreNotesEqual(current, normalizeNote(note))
		})
		const hasNoRealChange =
			changes.added.length === 0 && changedUpdates.length === 0 && changes.removedIds.length === 0
		if (hasNoRealChange) return

		const now = Date.now()
		const stamp = (note: NoteT): NoteT => normalizeNote({ ...note, modifiedTime: now })
		const winnerIds = new Set<string>()
		const working = new Map(notesById)

		for (const id of changes.removedIds) working.delete(id)

		for (const note of changedUpdates) {
			const stamped = stamp(note)
			working.set(stamped.id, stamped)
			winnerIds.add(stamped.id)
		}

		for (const note of changes.added) {
			const stamped = stamp(note)
			working.set(stamped.id, stamped)
			winnerIds.add(stamped.id)
		}

		const resolved = resolveOverlaps({ notes: [...working.values()], winnerIds, createId: createNoteId })

		notesById.clear()
		for (const note of resolved) notesById.set(note.id, note)

		clearNoteCaches()
		pruneSelection()
		preview = null
		emit()
		hooks.onCommit(getNotes())
	}

	const subscribe = (listener: () => void) => {
		listeners.add(listener)
		return () => {
			listeners.delete(listener)
		}
	}

	return {
		getNotes,
		getDisplayNotes,
		getNote,
		getSelectedIds: () => selectedIds,
		getSelectedNotes,
		select,
		clearSelection,
		getView: () => view,
		setView,
		getViewport: () => viewport,
		setViewport,
		getMaxScrollTick,
		getMaxScrollRow,
		getLoopEndTick: () => loopEndTick,
		setLoopEndTick,
		requestLoopEndTick,
		getPlayheadTick: () => playheadTick,
		setPlayheadTick,
		getHoverId: () => hoverId,
		setHoverId,
		getPreview: () => preview,
		setPreview,
		getClipboard: () => sharedClipboard,
		setClipboard: (notes: NoteT[]) => {
			sharedClipboard = notes
		},
		replaceNotes,
		applyChanges,
		audition: hooks.onAudition,
		createId: createNoteId,
		subscribe
	}
}
