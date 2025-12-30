import { Note } from 'tonal'

// Match any digits that follow "N" in a signalRow id.
// i.e "N1" -> 1, "N5-1" -> 5, "N3+2" -> 3, "N0" -> 0
export const getSignalRowIdIndex = (signalId: string): number => {
	const match = signalId.match(/^[^N]*N(\d+)/) as RegExpExecArray
	return parseInt(match[1], 10)
}

// Match any digits that follow "+" or "-" in a signalRow id.
// If there is no "+" or "-", the octave is 0.
// i.e "N5-1" -> -1, "N3+2" -> +2, "N0" -> 0
export const getSignalRowIdOctave = (signalId: string): number => {
	const match = signalId.match(/[+-]\d+/)
	return match ? parseInt(match[0], 10) : 0
}

type GetNoteFromSignalRowArgsT = {
	signalRowId: string
	chord: ChordT | null
	chordNotes?: string[]
}

export const getNoteFromSignalRow = (args: GetNoteFromSignalRowArgsT): string | null => {
	if (!args.chord && !args.chordNotes) return null

	const noteIndex = getSignalRowIdIndex(args.signalRowId)
	const octaveOffset = getSignalRowIdOctave(args.signalRowId)

	// Use provided chordNotes or fall back to chord.notes (for backward compatibility)
	const notes = args.chordNotes || (args.chord as any)?.notes || []
	const chordNotesCount = notes.length
	if (chordNotesCount === 0) return null

	// Calculate which note in the chord (wrapping around)
	// N1 -> index 0, N2 -> index 1, N3 -> index 2, N4 -> index 0 (next octave), etc.
	const zeroIndexedNoteIndex = noteIndex - 1
	const wrappedNoteIndex = ((zeroIndexedNoteIndex % chordNotesCount) + chordNotesCount) % chordNotesCount

	// Calculate how many full octaves we've wrapped through
	const octavesFromWrapping = Math.floor(zeroIndexedNoteIndex / chordNotesCount)

	// Total octave offset combines the wrapping octaves and the explicit octave offset
	const totalOctaveOffset = octavesFromWrapping + octaveOffset

	const baseNote = notes[wrappedNoteIndex]
	if (!baseNote) return null

	const hasNoOctaveOffset = totalOctaveOffset === 0
	if (hasNoOctaveOffset) return baseNote

	const interval = totalOctaveOffset > 0 ? `${totalOctaveOffset * 7 + 1}P` : `-${Math.abs(totalOctaveOffset) * 7 + 1}P`
	const transposedNote = Note.transpose(baseNote, interval)

	return transposedNote
}

export const signalRowHelpers = {
	getIdIndex: getSignalRowIdIndex,
	getIdOctave: getSignalRowIdOctave,
	getNoteFromSignalRow
}

export const resolveSignalConflicts = (signalRow: SignalRowT, signals: SignalT[]) => {
	const ids = signalRow.signalIds
	const signalsInRow = ids.map((id) => signals.find((signal) => signal.id === id)) as SignalT[]
	const newSignals: SignalT[] = []

	const OVERLAP_TOLERANCE = 0.001 // Small tolerance for floating point precision

	signalsInRow.forEach((signalA) => {
		signalsInRow.forEach((signalB) => {
			if (signalA.id === signalB.id) return

			const aStart = signalA.startTime
			const aEnd = signalA.startTime + signalA.duration
			const bStart = signalB.startTime
			const bEnd = signalB.startTime + signalB.duration

			// Signals are only considered overlapping if they truly overlap beyond tolerance
			// This prevents adjacent signals from being treated as conflicts
			const hasOverlap = aStart + OVERLAP_TOLERANCE < bEnd && bStart + OVERLAP_TOLERANCE < aEnd
			if (!hasOverlap) return

			// Determine which signal has priority based on modifiedTime
			const aModifiedTime = signalA.modifiedTime ?? 0
			const bModifiedTime = signalB.modifiedTime ?? 0
			const aHasPriority = aModifiedTime > bModifiedTime
			const aStartsBeforeB = aStart < bStart
			const aStartsAfterB = aStart >= bStart
			// If signalA has priority, signalB should be modified/removed
			if (aHasPriority) return

			// signalB has priority, so signalA gets chopped up
			if (aStartsBeforeB) {
				const originalEnd = aEnd
				signalA.duration = bStart - aStart

				const hasRemainder = originalEnd > bEnd
				if (hasRemainder) {
					const newSignal: SignalT = {
						...signalA,
						id: `${signalA.id}-${Date.now()}`,
						startTime: bEnd,
						duration: originalEnd - bEnd,
						modifiedTime: signalA.modifiedTime
					}

					newSignals.push(newSignal)
				}
			}

			if (aStartsAfterB) {
				const originalEnd = aEnd
				signalA.startTime = bEnd
				signalA.duration = originalEnd - bEnd
			}
		})
	})

	return newSignals
}
