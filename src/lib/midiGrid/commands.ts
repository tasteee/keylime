import { DEFAULT_NOTE_VELOCITY, MIN_NOTE_TICKS, ROW_COUNT, TICKS_PER_CELL } from './constants'
import type { PatternEditorT } from './editor'
import { stepTickByCell, clampNumber } from './time'
import type { NoteDraftT, NoteT } from './types'

type EditorArgsT = {
	editor: PatternEditorT
}

// Ids default to the current selection.
type IdsArgsT = EditorArgsT & {
	ids?: Iterable<string>
}

const getTargetNotes = (args: IdsArgsT): NoteT[] => {
	const hasIds = args.ids !== undefined
	if (!hasIds) return args.editor.getSelectedNotes()

	const found: NoteT[] = []
	for (const id of args.ids as Iterable<string>) {
		const note = args.editor.getNote(id)
		if (note) found.push(note)
	}
	return found
}

export const checkIsActive = (args: { note: NoteT; loopEndTick: number }): boolean => {
	return args.note.start < args.loopEndTick
}

// A note that starts inside the pattern may not run past the end of it.
export const fitNoteIntoLoop = (args: { note: NoteT; loopEndTick: number }): NoteT => {
	const isInactive = !checkIsActive(args)
	if (isInactive) return args.note

	const longestDuration = args.loopEndTick - args.note.start
	const duration = Math.max(MIN_NOTE_TICKS, Math.min(args.note.duration, longestDuration))
	return { ...args.note, duration }
}

const createNoteFromDraft = (args: EditorArgsT & { draft: NoteDraftT }): NoteT => {
	const draft = args.draft
	return {
		id: draft.id ?? args.editor.createId(),
		pitch: draft.pitch,
		start: draft.start,
		duration: draft.duration,
		velocity: draft.velocity,
		isMuted: draft.isMuted ?? false,
		modifiedTime: 0
	}
}

type AddNotesArgsT = EditorArgsT & {
	drafts: NoteDraftT[]
	shouldSelect?: boolean
}

// Notes that would start after the end of the pattern are left out.
export const addNotes = (args: AddNotesArgsT): NoteT[] => {
	const editor = args.editor
	const loopEndTick = editor.getLoopEndTick()
	const shouldSelect = args.shouldSelect ?? true

	const created = args.drafts.map((draft) => createNoteFromDraft({ editor, draft }))
	const active = created.filter((note) => checkIsActive({ note, loopEndTick }))
	const fitted = active.map((note) => fitNoteIntoLoop({ note, loopEndTick }))

	editor.applyChanges({ added: fitted, updated: [], removedIds: [] })
	if (shouldSelect) editor.select({ ids: fitted.map((note) => note.id) })
	return fitted
}

export const deleteNotes = (args: IdsArgsT) => {
	const notes = getTargetNotes(args)
	const hasNothing = notes.length === 0
	if (hasNothing) return
	args.editor.applyChanges({ added: [], updated: [], removedIds: notes.map((note) => note.id) })
}

type UpdateNotesArgsT = EditorArgsT & {
	updated: NoteT[]
}

export const updateNotes = (args: UpdateNotesArgsT) => {
	args.editor.applyChanges({ added: [], updated: args.updated, removedIds: [] })
}

type BuildMovedNotesArgsT = {
	notes: NoteT[]
	loopEndTick: number
	ticks: number
	// Rows move pitch: positive is up.
	rows: number
}

// Where a group of notes ends up. The group stops at the edges of the
// grid instead of squashing together, and stays inside the pattern.
export const buildMovedNotes = (args: BuildMovedNotesArgsT): NoteT[] => {
	const notes = args.notes
	const hasNothing = notes.length === 0
	if (hasNothing) return []

	const earliestStart = Math.min(...notes.map((note) => note.start))
	const activeNotes = notes.filter((note) => checkIsActive({ note, loopEndTick: args.loopEndTick }))
	const hasActiveNotes = activeNotes.length > 0
	const latestActiveStart = Math.max(...activeNotes.map((note) => note.start))
	const mostTicksForward = args.loopEndTick - MIN_NOTE_TICKS - latestActiveStart
	const furthestForward = hasActiveNotes ? Math.max(mostTicksForward, -earliestStart) : Infinity
	const ticks = clampNumber({ value: args.ticks, min: -earliestStart, max: furthestForward })

	const lowestPitch = Math.min(...notes.map((note) => note.pitch))
	const highestPitch = Math.max(...notes.map((note) => note.pitch))
	const rows = clampNumber({ value: args.rows, min: -lowestPitch, max: ROW_COUNT - 1 - highestPitch })

	return notes.map((note) => {
		const moved = { ...note, start: note.start + ticks, pitch: note.pitch + rows }
		return fitNoteIntoLoop({ note: moved, loopEndTick: args.loopEndTick })
	})
}

type MoveNotesArgsT = IdsArgsT & {
	ticks?: number
	rows?: number
}

export const moveNotes = (args: MoveNotesArgsT) => {
	const notes = getTargetNotes(args)
	const loopEndTick = args.editor.getLoopEndTick()
	const ticks = args.ticks ?? 0
	const rows = args.rows ?? 0
	const updated = buildMovedNotes({ notes, loopEndTick, ticks, rows })
	args.editor.applyChanges({ added: [], updated, removedIds: [] })
}

type SetVelocityArgsT = IdsArgsT & {
	mode: 'absolute' | 'relative'
	value: number
}

export const setVelocity = (args: SetVelocityArgsT) => {
	const notes = getTargetNotes(args)

	const updated = notes.map((note) => {
		const nextVelocity = args.mode === 'absolute' ? args.value : note.velocity + args.value
		const velocity = clampNumber({ value: nextVelocity, min: 0, max: 1 })
		return { ...note, velocity }
	})

	args.editor.applyChanges({ added: [], updated, removedIds: [] })
	const firstUpdated = updated[0]
	if (firstUpdated) args.editor.setView({ noteVelocity: firstUpdated.velocity })
}

// Turns notes off or on. If any are on, they all go off. Otherwise they all come on.
export const toggleMuted = (args: IdsArgsT) => {
	const notes = getTargetNotes(args)
	const hasNothing = notes.length === 0
	if (hasNothing) return

	const isAnyNoteOn = notes.some((note) => !note.isMuted)
	const updated = notes.map((note) => ({ ...note, isMuted: isAnyNoteOn }))
	args.editor.applyChanges({ added: [], updated, removedIds: [] })
}

export const selectAllNotes = (args: EditorArgsT) => {
	const ids = args.editor.getNotes().map((note) => note.id)
	args.editor.select({ ids })
}

type CopyNotesArgsT = IdsArgsT

// The clipboard keeps notes relative to the first one.
export const copyNotes = (args: CopyNotesArgsT) => {
	const notes = getTargetNotes(args)
	const hasNothing = notes.length === 0
	if (hasNothing) return

	const earliestStart = Math.min(...notes.map((note) => note.start))
	const relative = notes.map((note) => ({ ...note, start: note.start - earliestStart }))
	args.editor.setClipboard(relative)
}

export const cutNotes = (args: IdsArgsT) => {
	copyNotes(args)
	deleteNotes(args)
}

// Pastes at the grid cursor.
export const pasteNotes = (args: EditorArgsT & { atTick?: number }): NoteT[] => {
	const clipboard = args.editor.getClipboard()
	const hasNothing = clipboard.length === 0
	if (hasNothing) return []

	const atTick = args.atTick ?? args.editor.getView().cursorTick
	const drafts = clipboard.map((note) => ({
		pitch: note.pitch,
		start: note.start + atTick,
		duration: note.duration,
		velocity: note.velocity,
		isMuted: note.isMuted
	}))

	return addNotes({ editor: args.editor, drafts })
}

// Copies land right after the selection, on the next cell line.
export const duplicateNotes = (args: IdsArgsT): NoteT[] => {
	const notes = getTargetNotes(args)
	const hasNothing = notes.length === 0
	if (hasNothing) return []

	const earliestStart = Math.min(...notes.map((note) => note.start))
	const latestEnd = Math.max(...notes.map((note) => note.start + note.duration))
	const cellCount = Math.ceil((latestEnd - earliestStart) / TICKS_PER_CELL)
	const span = Math.max(TICKS_PER_CELL, cellCount * TICKS_PER_CELL)

	const drafts = notes.map((note) => ({
		pitch: note.pitch,
		start: note.start + span,
		duration: note.duration,
		velocity: note.velocity,
		isMuted: note.isMuted
	}))

	return addNotes({ editor: args.editor, drafts })
}

// Moves the selection so its first note lands on the previous or next cell line.
export const nudgeNotesByCell = (args: EditorArgsT & { direction: -1 | 1 }) => {
	const notes = args.editor.getSelectedNotes()
	const hasNothing = notes.length === 0
	if (hasNothing) return

	const earliestStart = Math.min(...notes.map((note) => note.start))
	const targetTick = stepTickByCell({ tick: earliestStart, direction: args.direction })
	moveNotes({ editor: args.editor, ticks: targetTick - earliestStart })
}

// Moves each selected note one row up or down and plays them.
export const nudgeNotesByRows = (args: EditorArgsT & { rows: number }) => {
	const before = args.editor.getSelectedNotes()
	const hasNothing = before.length === 0
	if (hasNothing) return

	moveNotes({ editor: args.editor, rows: args.rows })

	const after = args.editor.getSelectedNotes()
	const didMove = after.some((note, index) => note.pitch !== before[index]?.pitch)
	if (!didMove) return

	const pitches = new Set(after.map((note) => note.pitch))
	for (const pitch of pitches) args.editor.audition({ pitch, velocity: DEFAULT_NOTE_VELOCITY })
}

// Moves each selected note's end to the previous or next cell line.
export const resizeNotesByCell = (args: EditorArgsT & { direction: -1 | 1 }) => {
	const notes = args.editor.getSelectedNotes()
	const loopEndTick = args.editor.getLoopEndTick()

	const updated: NoteT[] = []
	for (const note of notes) {
		const endTick = note.start + note.duration
		const nextEnd = stepTickByCell({ tick: endTick, direction: args.direction })
		const isLongEnough = nextEnd - note.start >= MIN_NOTE_TICKS
		const isChange = nextEnd !== endTick
		const canResize = isLongEnough && isChange
		if (!canResize) continue

		const resized = { ...note, duration: nextEnd - note.start }
		updated.push(fitNoteIntoLoop({ note: resized, loopEndTick }))
	}

	args.editor.applyChanges({ added: [], updated, removedIds: [] })
}
