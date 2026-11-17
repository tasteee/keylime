const SHORTCUT_ROWS = [
	['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7'],
	['KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyT', 'KeyY', 'KeyU'],
	['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH', 'KeyJ'],
	['KeyZ', 'KeyX', 'KeyC', 'KeyV', 'KeyB', 'KeyN', 'KeyM']
]

export type ChordGridPositionT = {
	columnIndex: number
	rowIndex: number
}

export const getChordGridPosition = (code: string): ChordGridPositionT | null => {
	for (const rowEntry of SHORTCUT_ROWS.entries()) {
		const rowIndex = rowEntry[0]
		const columnIndex = rowEntry[1].indexOf(code)
		const isMappedKey = columnIndex !== -1
		if (isMappedKey) return { columnIndex, rowIndex }
	}
	return null
}

type ChordGridKeyboardOptionsT = {
	getChord: (position: ChordGridPositionT) => ChordT | undefined
	startPreview: (chord: ChordT) => void
	stopPreview: () => void
}

export const createChordGridKeyboard = (options: ChordGridKeyboardOptionsT) => {
	const heldChords = new Map<string, ChordT>()
	let activeCode: string | null = null

	const pressKey = (code: string): boolean => {
		const position = getChordGridPosition(code)
		if (!position) return false
		const chord = options.getChord(position)
		if (!chord) return false
		const isAlreadyHeld = heldChords.has(code)
		if (isAlreadyHeld) return true

		heldChords.set(code, chord)
		activeCode = code
		options.startPreview(chord)
		return true
	}

	const releaseKey = (code: string): boolean => {
		const wasHeld = heldChords.delete(code)
		if (!wasHeld) return false
		const isActiveKey = activeCode === code
		if (!isActiveKey) return true

		options.stopPreview()
		const remainingKeys = Array.from(heldChords.keys())
		activeCode = remainingKeys.at(-1) ?? null
		if (!activeCode) return true
		const remainingChord = heldChords.get(activeCode)
		if (remainingChord) options.startPreview(remainingChord)
		return true
	}

	const releaseAllKeys = () => {
		const hasActiveKey = activeCode !== null
		heldChords.clear()
		activeCode = null
		if (hasActiveKey) options.stopPreview()
	}

	return { pressKey, releaseKey, releaseAllKeys }
}
