import { describe, expect, it } from 'vitest'
import {
	addNotes,
	copyNotes,
	cutNotes,
	deleteNotes,
	duplicateNotes,
	moveNotes,
	nudgeNotesByCell,
	pasteNotes,
	resizeNotesByCell,
	selectAllNotes,
	setVelocity,
	toggleMuted
} from './commands'
import { TICKS_PER_BAR, TICKS_PER_CELL } from './constants'
import { createPatternEditor, type PatternEditorT } from './editor'
import { handlePatternKey } from './keymap'
import type { NoteT } from './types'

type TestEditorT = {
	editor: PatternEditorT
	commits: NoteT[][]
	auditions: number[]
}

const createTestEditor = (): TestEditorT => {
	const commits: NoteT[][] = []
	const auditions: number[] = []
	const editor = createPatternEditor({
		onCommit: (notes) => commits.push(notes),
		onLoopEndChange: () => {},
		onAudition: (args) => auditions.push(args.pitch)
	})
	editor.setLoopEndTick(TICKS_PER_BAR)
	return { editor, commits, auditions }
}

const addOne = (editor: PatternEditorT, start: number, pitch = 20, duration = TICKS_PER_CELL) => {
	return addNotes({ editor, drafts: [{ pitch, start, duration, velocity: 0.8 }] })[0]
}

// Tests run in node, which has no KeyboardEvent. The keymap only reads these fields.
const pressKey = (editor: PatternEditorT, key: string, modifiers: Partial<KeyboardEvent> = {}) => {
	const event = { key, ctrlKey: false, metaKey: false, shiftKey: false, altKey: false, ...modifiers } as KeyboardEvent
	return handlePatternKey({ editor, event })
}

describe('adding notes', () => {
	it('adds and selects a note and reports the commit', () => {
		const { editor, commits } = createTestEditor()
		const note = addOne(editor, 0)
		expect(editor.getNotes()).toHaveLength(1)
		expect(editor.getSelectedIds().has(note.id)).toBe(true)
		expect(commits).toHaveLength(1)
	})

	it('leaves out notes that start after the end of the pattern', () => {
		const { editor } = createTestEditor()
		addNotes({ editor, drafts: [{ pitch: 3, start: TICKS_PER_BAR, duration: TICKS_PER_CELL, velocity: 0.8 }] })
		expect(editor.getNotes()).toHaveLength(0)
	})

	it('cuts a note that would run past the end of the pattern', () => {
		const { editor } = createTestEditor()
		const note = addOne(editor, TICKS_PER_BAR - TICKS_PER_CELL, 3, TICKS_PER_BAR)
		expect(note.duration).toBe(TICKS_PER_CELL)
	})

	it('a new note wins over an older note in the same row', () => {
		const { editor } = createTestEditor()
		const old = addOne(editor, 0, 7, TICKS_PER_CELL * 4)
		addOne(editor, TICKS_PER_CELL * 2, 7, TICKS_PER_CELL)
		expect(editor.getNote(old.id)?.duration).toBe(TICKS_PER_CELL * 2)
	})
})

describe('editing', () => {
	it('moves the selection together and stops at the first tick', () => {
		const { editor } = createTestEditor()
		addNotes({
			editor,
			drafts: [
				{ pitch: 5, start: TICKS_PER_CELL, duration: TICKS_PER_CELL, velocity: 0.8 },
				{ pitch: 6, start: TICKS_PER_CELL * 3, duration: TICKS_PER_CELL, velocity: 0.8 }
			]
		})
		moveNotes({ editor, ticks: -TICKS_PER_BAR })
		const starts = editor.getNotes().map((note) => note.start)
		expect(starts).toEqual([0, TICKS_PER_CELL * 2])
	})

	it('moves up by rows and stops at the top row', () => {
		const { editor } = createTestEditor()
		addOne(editor, 0, 38)
		moveNotes({ editor, rows: 5 })
		expect(editor.getNotes()[0].pitch).toBe(39)
	})

	it('sets velocity in steps, between 0 and 1', () => {
		const { editor } = createTestEditor()
		addOne(editor, 0)
		setVelocity({ editor, mode: 'relative', value: 0.5 })
		expect(editor.getNotes()[0].velocity).toBe(1)
		setVelocity({ editor, mode: 'absolute', value: 0.25 })
		expect(editor.getNotes()[0].velocity).toBe(0.25)
		expect(editor.getView().noteVelocity).toBe(0.25)
	})

	it('turns notes off and on', () => {
		const { editor } = createTestEditor()
		addOne(editor, 0)
		toggleMuted({ editor })
		expect(editor.getNotes()[0].isMuted).toBe(true)
		toggleMuted({ editor })
		expect(editor.getNotes()[0].isMuted).toBe(false)
	})

	it('deletes the selection', () => {
		const { editor } = createTestEditor()
		addOne(editor, 0)
		deleteNotes({ editor })
		expect(editor.getNotes()).toHaveLength(0)
		expect(editor.getSelectedIds().size).toBe(0)
	})
})

describe('copy, cut, paste, duplicate', () => {
	it('copies and pastes at the cursor', () => {
		const { editor } = createTestEditor()
		addOne(editor, TICKS_PER_CELL * 2, 9)
		copyNotes({ editor })
		editor.setView({ cursorTick: TICKS_PER_CELL * 8 })
		pasteNotes({ editor })
		const starts = editor.getNotes().map((note) => note.start)
		expect(starts).toEqual([TICKS_PER_CELL * 2, TICKS_PER_CELL * 8])
		expect(editor.getSelectedNotes()).toHaveLength(1)
		expect(editor.getSelectedNotes()[0].start).toBe(TICKS_PER_CELL * 8)
	})

	it('cut removes the notes and keeps them for paste', () => {
		const { editor } = createTestEditor()
		addOne(editor, 0, 9)
		cutNotes({ editor })
		expect(editor.getNotes()).toHaveLength(0)
		pasteNotes({ editor, atTick: TICKS_PER_CELL })
		expect(editor.getNotes()[0].start).toBe(TICKS_PER_CELL)
	})

	it('duplicate places copies right after the selection', () => {
		const { editor } = createTestEditor()
		addOne(editor, 0, 9, TICKS_PER_CELL * 2)
		duplicateNotes({ editor })
		const starts = editor.getNotes().map((note) => note.start)
		expect(starts).toEqual([0, TICKS_PER_CELL * 2])
	})
})

describe('keyboard', () => {
	it('arrow keys nudge in time and in rows', () => {
		const { editor, auditions } = createTestEditor()
		addOne(editor, TICKS_PER_CELL, 10)
		pressKey(editor, 'ArrowRight')
		expect(editor.getNotes()[0].start).toBe(TICKS_PER_CELL * 2)
		pressKey(editor, 'ArrowLeft')
		expect(editor.getNotes()[0].start).toBe(TICKS_PER_CELL)
		pressKey(editor, 'ArrowUp')
		expect(editor.getNotes()[0].pitch).toBe(11)
		pressKey(editor, 'ArrowDown')
		expect(editor.getNotes()[0].pitch).toBe(10)
		expect(auditions.length).toBeGreaterThan(0)
	})

	it('ctrl with left and right changes duration', () => {
		const { editor } = createTestEditor()
		addOne(editor, 0, 10)
		pressKey(editor, 'ArrowRight', { ctrlKey: true })
		expect(editor.getNotes()[0].duration).toBe(TICKS_PER_CELL * 2)
		pressKey(editor, 'ArrowLeft', { ctrlKey: true })
		expect(editor.getNotes()[0].duration).toBe(TICKS_PER_CELL)
		pressKey(editor, 'ArrowLeft', { ctrlKey: true })
		expect(editor.getNotes()[0].duration).toBe(TICKS_PER_CELL)
	})

	it('delete and backspace remove, zero toggles', () => {
		const { editor } = createTestEditor()
		addOne(editor, 0, 10)
		pressKey(editor, '0')
		expect(editor.getNotes()[0].isMuted).toBe(true)
		pressKey(editor, '0')
		expect(editor.getNotes()[0].isMuted).toBe(false)
		pressKey(editor, 'Backspace')
		expect(editor.getNotes()).toHaveLength(0)
		addOne(editor, 0, 10)
		pressKey(editor, 'Delete')
		expect(editor.getNotes()).toHaveLength(0)
	})

	it('ctrl d, c, x, v and a work', () => {
		const { editor } = createTestEditor()
		addOne(editor, 0, 10)
		pressKey(editor, 'd', { ctrlKey: true })
		expect(editor.getNotes()).toHaveLength(2)

		pressKey(editor, 'a', { ctrlKey: true })
		expect(editor.getSelectedIds().size).toBe(2)

		pressKey(editor, 'x', { ctrlKey: true })
		expect(editor.getNotes()).toHaveLength(0)

		pressKey(editor, 'v', { ctrlKey: true })
		expect(editor.getNotes()).toHaveLength(2)

		pressKey(editor, 'c', { ctrlKey: true })
		expect(editor.getClipboard()).toHaveLength(2)
	})

	it('escape clears the selection', () => {
		const { editor } = createTestEditor()
		addOne(editor, 0)
		pressKey(editor, 'Escape')
		expect(editor.getSelectedIds().size).toBe(0)
	})

	it('select all and nudge resize helpers do nothing with no notes', () => {
		const { editor, commits } = createTestEditor()
		selectAllNotes({ editor })
		nudgeNotesByCell({ editor, direction: 1 })
		resizeNotesByCell({ editor, direction: 1 })
		expect(commits).toHaveLength(0)
	})
})
