import {
	copyNotes,
	cutNotes,
	deleteNotes,
	duplicateNotes,
	nudgeNotesByCell,
	nudgeNotesByRows,
	pasteNotes,
	resizeNotesByCell,
	selectAllNotes,
	setVelocity,
	toggleMuted
} from './commands'
import { ROWS_IN_BAND, VELOCITY_STEP } from './constants'
import type { PatternEditorT } from './editor'

type KeyArgsT = {
	editor: PatternEditorT
	event: KeyboardEvent
}

const checkHasSelection = (editor: PatternEditorT): boolean => {
	return editor.getSelectedIds().size > 0
}

const handleModifiedLetter = (args: KeyArgsT): boolean => {
	const editor = args.editor
	const key = args.event.key.toLowerCase()
	const hasSelection = checkHasSelection(editor)

	if (key === 'a') {
		selectAllNotes({ editor })
		return true
	}
	if (key === 'c') {
		copyNotes({ editor })
		return true
	}
	if (key === 'x') {
		if (hasSelection) cutNotes({ editor })
		return true
	}
	if (key === 'v') {
		pasteNotes({ editor })
		return true
	}
	if (key === 'd') {
		if (hasSelection) duplicateNotes({ editor })
		return true
	}
	return false
}

// Ctrl or Cmd with left and right lengthens or shortens the selection.
// Shift does the same.
const handleHorizontalArrow = (args: KeyArgsT & { direction: -1 | 1 }): boolean => {
	const editor = args.editor
	const hasSelection = checkHasSelection(editor)
	if (!hasSelection) return true

	const isModified = args.event.ctrlKey || args.event.metaKey || args.event.shiftKey
	if (isModified) {
		resizeNotesByCell({ editor, direction: args.direction })
		return true
	}

	nudgeNotesByCell({ editor, direction: args.direction })
	return true
}

// Up and down move the selection one row. Shift moves a whole band of eight.
const handleVerticalArrow = (args: KeyArgsT & { direction: -1 | 1 }): boolean => {
	const editor = args.editor
	const hasSelection = checkHasSelection(editor)
	if (!hasSelection) return true

	if (args.event.altKey) {
		setVelocity({ editor, mode: 'relative', value: args.direction * VELOCITY_STEP })
		return true
	}

	const rowStep = args.event.shiftKey ? ROWS_IN_BAND : 1
	nudgeNotesByRows({ editor, rows: args.direction * rowStep })
	return true
}

// Returns true when the key was used, so the caller can stop it
// from also doing something else (scrolling, bookmarking, ...).
export const handlePatternKey = (args: KeyArgsT): boolean => {
	const editor = args.editor
	const event = args.event
	const hasModifier = event.ctrlKey || event.metaKey
	const hasSelection = checkHasSelection(editor)

	if (hasModifier && !event.shiftKey && !event.altKey) {
		const didHandleLetter = handleModifiedLetter(args)
		if (didHandleLetter) return true
	}

	if (event.key === 'Backspace' || event.key === 'Delete') {
		if (hasSelection) deleteNotes({ editor })
		return true
	}

	if (event.key === '0' && !hasModifier) {
		if (hasSelection) toggleMuted({ editor })
		return true
	}

	if (event.key === 'Escape') {
		editor.clearSelection()
		return true
	}

	if (event.key === 'ArrowLeft') return handleHorizontalArrow({ ...args, direction: -1 })
	if (event.key === 'ArrowRight') return handleHorizontalArrow({ ...args, direction: 1 })
	if (event.key === 'ArrowUp') return handleVerticalArrow({ ...args, direction: 1 })
	if (event.key === 'ArrowDown') return handleVerticalArrow({ ...args, direction: -1 })

	return false
}
