import * as Vitest from 'vitest'
import * as ChordGridKeyboard from './chordGridKeyboard'

const createChord = (id: string): ChordT => {
	return { id, symbol: 'Cmaj', octaveOffset: 0, voicing: null, inversion: 0 }
}

const createKeyboardFixture = () => {
	const firstChord = createChord('first')
	const secondChord = createChord('second')
	const startPreview = Vitest.vi.fn<(chord: ChordT) => void>()
	const stopPreview = Vitest.vi.fn<() => void>()
	const keyboard = ChordGridKeyboard.createChordGridKeyboard({
		getChord: (position) => {
			const isFirstRow = position.rowIndex === 0
			if (!isFirstRow) return undefined
			const isFirstColumn = position.columnIndex === 0
			if (isFirstColumn) return firstChord
			const isSecondColumn = position.columnIndex === 1
			if (isSecondColumn) return secondChord
			return undefined
		},
		startPreview,
		stopPreview
	})
	return { firstChord, secondChord, startPreview, stopPreview, keyboard }
}

Vitest.describe('chord grid keyboard', () => {
	Vitest.it('maps keyboard columns to the first four grid rows', () => {
		const firstColumn = ['Digit1', 'KeyQ', 'KeyA', 'KeyZ']
		const secondColumn = ['Digit2', 'KeyW', 'KeyS', 'KeyX']
		const lastColumn = ['Digit7', 'KeyU', 'KeyJ', 'KeyM']
		const columns = [firstColumn, secondColumn, lastColumn]
		const expectedColumnIndexes = [0, 1, 6]

		for (const columnEntry of columns.entries()) {
			const columnIndex = expectedColumnIndexes[columnEntry[0]]
			for (const keyEntry of columnEntry[1].entries()) {
				const rowIndex = keyEntry[0]
				const position = ChordGridKeyboard.getChordGridPosition(keyEntry[1])
				Vitest.expect(position).toEqual({ columnIndex, rowIndex })
			}
		}
	})

	Vitest.it('ignores unmapped keys and missing grid entries', () => {
		const fixture = createKeyboardFixture()
		const isOutsideGridHandled = fixture.keyboard.pressKey('Digit8')
		const isMissingRowHandled = fixture.keyboard.pressKey('KeyQ')
		const isMissingColumnHandled = fixture.keyboard.pressKey('Digit7')
		Vitest.expect(isOutsideGridHandled).toBe(false)
		Vitest.expect(isMissingRowHandled).toBe(false)
		Vitest.expect(isMissingColumnHandled).toBe(false)
		Vitest.expect(fixture.startPreview).not.toHaveBeenCalled()
	})

	Vitest.it('does not restart a held key on repeat', () => {
		const fixture = createKeyboardFixture()
		fixture.keyboard.pressKey('Digit1')
		fixture.keyboard.pressKey('Digit1')
		Vitest.expect(fixture.startPreview).toHaveBeenCalledExactlyOnceWith(fixture.firstChord)
	})

	Vitest.it('keeps the latest chord playing when an older key is released', () => {
		const fixture = createKeyboardFixture()
		fixture.keyboard.pressKey('Digit1')
		fixture.keyboard.pressKey('Digit2')
		fixture.keyboard.releaseKey('Digit1')
		Vitest.expect(fixture.startPreview).toHaveBeenLastCalledWith(fixture.secondChord)
		Vitest.expect(fixture.stopPreview).not.toHaveBeenCalled()
	})

	Vitest.it('resumes the previous held chord and stops after the final release', () => {
		const fixture = createKeyboardFixture()
		fixture.keyboard.pressKey('Digit1')
		fixture.keyboard.pressKey('Digit2')
		fixture.keyboard.releaseKey('Digit2')
		Vitest.expect(fixture.startPreview).toHaveBeenLastCalledWith(fixture.firstChord)
		fixture.keyboard.releaseKey('Digit1')
		Vitest.expect(fixture.stopPreview).toHaveBeenCalledTimes(2)
	})

	Vitest.it('clears held keys on blur or unmount without stopping unrelated previews', () => {
		const fixture = createKeyboardFixture()
		fixture.keyboard.releaseAllKeys()
		Vitest.expect(fixture.stopPreview).not.toHaveBeenCalled()
		fixture.keyboard.pressKey('Digit1')
		fixture.keyboard.releaseAllKeys()
		const wasReleaseHandled = fixture.keyboard.releaseKey('Digit1')
		Vitest.expect(wasReleaseHandled).toBe(false)
		Vitest.expect(fixture.stopPreview).toHaveBeenCalledTimes(1)
		fixture.keyboard.pressKey('Digit1')
		Vitest.expect(fixture.startPreview).toHaveBeenCalledTimes(2)
	})
})
