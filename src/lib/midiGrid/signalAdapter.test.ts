import { describe, expect, it } from 'vitest'
import { SIGNAL_IDS, SIGNAL_ROWS } from '$lib/constants/signalRows'
import { getPitchForRowId, getRowIdForPitch } from './rows'
import { convertNotesToPattern, convertSignalsToNotes, createNotesSignature } from './signalAdapter'

const createRows = (): SignalRowsT => structuredClone(SIGNAL_ROWS)

describe('rows', () => {
	it('puts the highest tone on top and the lowest tone at pitch 0', () => {
		expect(SIGNAL_IDS[0]).toBe('N8+2')
		expect(getPitchForRowId('N1-2')).toBe(0)
		expect(getPitchForRowId('N8+2')).toBe(39)
	})

	it('maps pitch to row id and back for every row', () => {
		for (const rowId of SIGNAL_IDS) {
			const pitch = getPitchForRowId(rowId) as number
			expect(getRowIdForPitch(pitch)).toBe(rowId)
		}
	})

	it('climbs one chord tone at a time inside a band', () => {
		const n1 = getPitchForRowId('N1') as number
		const n2 = getPitchForRowId('N2') as number
		const n1Up = getPitchForRowId('N1+1') as number
		expect(n2 - n1).toBe(1)
		expect(n1Up - n1).toBe(8)
	})
})

describe('signal adapter', () => {
	it('reads signals into notes by row', () => {
		const signalRows = createRows()
		signalRows.N3.signalIds.push('a')
		const signals: SignalT[] = [{ id: 'a', startTime: 1, duration: 0.5, noteIndex: 0, octaveOffset: 0 }]

		const notes = convertSignalsToNotes({ signals, signalRows, defaultVelocity: 0.6 })

		expect(notes).toHaveLength(1)
		expect(notes[0].pitch).toBe(getPitchForRowId('N3'))
		expect(notes[0].start).toBe(960)
		expect(notes[0].duration).toBe(480)
		expect(notes[0].velocity).toBe(0.6)
		expect(notes[0].isMuted).toBe(false)
	})

	it('keeps the velocity a signal already has', () => {
		const signalRows = createRows()
		signalRows.N1.signalIds.push('a')
		const signals: SignalT[] = [{ id: 'a', startTime: 0, duration: 1, noteIndex: 0, octaveOffset: 0, velocity: 0.25 }]
		const notes = convertSignalsToNotes({ signals, signalRows, defaultVelocity: 0.6 })
		expect(notes[0].velocity).toBe(0.25)
	})

	it('writes notes back into signals and rows, keeping saved numbers that did not change', () => {
		const signalRows = createRows()
		signalRows.N5.signalIds.push('a')
		const previous: SignalT[] = [{ id: 'a', startTime: 0.3, duration: 0.7, noteIndex: 2, octaveOffset: 1 }]
		const notes = convertSignalsToNotes({ signals: previous, signalRows, defaultVelocity: 0.5 })

		const pattern = convertNotesToPattern({ notes, previousSignals: previous })

		expect(pattern.patternSignals[0].startTime).toBe(0.3)
		expect(pattern.patternSignals[0].duration).toBe(0.7)
		expect(pattern.patternSignals[0].noteIndex).toBe(2)
		expect(pattern.patternSignals[0].octaveOffset).toBe(1)
		expect(pattern.patternSignalRows.N5.signalIds).toEqual(['a'])
	})

	it('moves a note to its new row', () => {
		const signalRows = createRows()
		signalRows.N5.signalIds.push('a')
		const previous: SignalT[] = [{ id: 'a', startTime: 0, duration: 1, noteIndex: 0, octaveOffset: 0 }]
		const notes = convertSignalsToNotes({ signals: previous, signalRows, defaultVelocity: 0.5 })
		const moved = notes.map((note) => ({ ...note, pitch: getPitchForRowId('N2') as number }))

		const pattern = convertNotesToPattern({ notes: moved, previousSignals: previous })

		expect(pattern.patternSignalRows.N5.signalIds).toEqual([])
		expect(pattern.patternSignalRows.N2.signalIds).toEqual(['a'])
	})

	it('gives the same signature after a round trip', () => {
		const signalRows = createRows()
		signalRows.N1.signalIds.push('a', 'b')
		const previous: SignalT[] = [
			{ id: 'a', startTime: 0, duration: 0.25, noteIndex: 0, octaveOffset: 0 },
			{ id: 'b', startTime: 0.25, duration: 0.0625, noteIndex: 0, octaveOffset: 0 }
		]
		const notes = convertSignalsToNotes({ signals: previous, signalRows, defaultVelocity: 0.7 })
		const pattern = convertNotesToPattern({ notes, previousSignals: previous })
		const notesAgain = convertSignalsToNotes({
			signals: pattern.patternSignals,
			signalRows: pattern.patternSignalRows,
			defaultVelocity: 0.7
		})

		expect(createNotesSignature(notesAgain)).toBe(createNotesSignature(notes))
	})
})
