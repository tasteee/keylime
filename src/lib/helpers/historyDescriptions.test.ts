import { describe, expect, it } from 'vitest'
import { checkIsSameHistorySnapshot, describeHistoryChange, type HistorySnapshotT } from './historyDescriptions'

const buildChord = (id: string, symbol: string, overrides: Partial<ProgressionChordT> = {}): ProgressionChordT => {
	return {
		id,
		type: 'chord',
		symbol,
		octaveOffset: 0,
		voicing: 'closed',
		inversion: 0,
		startTime: 0,
		durationBeats: 4,
		...overrides
	}
}

const buildSignal = (id: string, overrides: Partial<SignalT> = {}): SignalT => {
	return {
		id,
		startTime: 0,
		noteIndex: 0,
		duration: 1,
		octaveOffset: 0,
		...overrides
	}
}

const buildSnapshot = (overrides: Partial<HistorySnapshotT> = {}): HistorySnapshotT => {
	return {
		patternSignals: [],
		patternSignalRows: {},
		patternDurationBars: 1,
		progressionChords: [],
		...overrides
	}
}

describe('describeHistoryChange for the progression', () => {
	it('names an added chord', () => {
		const before = buildSnapshot()
		const after = buildSnapshot({ progressionChords: [buildChord('a', 'E')] })
		expect(describeHistoryChange(before, after)).toBe('Add E')
	})

	it('names a deleted chord', () => {
		const before = buildSnapshot({ progressionChords: [buildChord('a', 'C#min')] })
		const after = buildSnapshot()
		expect(describeHistoryChange(before, after)).toBe('Delete C#min')
	})

	it('names a resized chord', () => {
		const before = buildSnapshot({ progressionChords: [buildChord('a', 'B')] })
		const after = buildSnapshot({ progressionChords: [buildChord('a', 'B', { durationBeats: 8 })] })
		expect(describeHistoryChange(before, after)).toBe('Resize B')
	})

	it('names a reshaped chord', () => {
		const before = buildSnapshot({ progressionChords: [buildChord('a', 'B')] })
		const after = buildSnapshot({ progressionChords: [buildChord('a', 'B', { inversion: 1 })] })
		expect(describeHistoryChange(before, after)).toBe('Reshape B')
	})

	it('names a reorder', () => {
		const first = buildChord('a', 'E')
		const second = buildChord('b', 'A')
		const before = buildSnapshot({ progressionChords: [first, second] })
		const after = buildSnapshot({ progressionChords: [second, first] })
		expect(describeHistoryChange(before, after)).toBe('Reorder chords')
	})
})

describe('describeHistoryChange for the pattern', () => {
	it('counts added notes', () => {
		const before = buildSnapshot()
		const after = buildSnapshot({ patternSignals: [buildSignal('a'), buildSignal('b')] })
		expect(describeHistoryChange(before, after)).toBe('Add 2 notes')
	})

	it('names one deleted note in the singular', () => {
		const before = buildSnapshot({ patternSignals: [buildSignal('a')] })
		const after = buildSnapshot()
		expect(describeHistoryChange(before, after)).toBe('Delete 1 note')
	})

	it('names moved notes', () => {
		const before = buildSnapshot({ patternSignals: [buildSignal('a')] })
		const after = buildSnapshot({ patternSignals: [buildSignal('a', { startTime: 2 })] })
		expect(describeHistoryChange(before, after)).toBe('Move 1 note')
	})

	it('names a new pattern length', () => {
		const before = buildSnapshot()
		const after = buildSnapshot({ patternDurationBars: 2 })
		expect(describeHistoryChange(before, after)).toBe('Change pattern length')
	})
})

describe('checkIsSameHistorySnapshot', () => {
	it('ignores note order and key order', () => {
		const first = buildSignal('a', { startTime: 1 })
		const second = buildSignal('b', { startTime: 2 })
		const reorderedKeys = { startTime: 2, id: 'b', noteIndex: 0, duration: 1, octaveOffset: 0 }
		const before = buildSnapshot({ patternSignals: [first, second] })
		const after = buildSnapshot({ patternSignals: [reorderedKeys, first] })
		expect(checkIsSameHistorySnapshot(before, after)).toBe(true)
	})

	it('keeps chord order meaningful', () => {
		const first = buildChord('a', 'E')
		const second = buildChord('b', 'A')
		const before = buildSnapshot({ progressionChords: [first, second] })
		const after = buildSnapshot({ progressionChords: [second, first] })
		expect(checkIsSameHistorySnapshot(before, after)).toBe(false)
	})
})
