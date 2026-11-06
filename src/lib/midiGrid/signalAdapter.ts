import { SIGNAL_ROWS } from '$lib/constants/signalRows'
import { getPitchForRowId, getRowIdForPitch } from './rows'
import { convertBeatsToTicks, convertTicksToBeats } from './time'
import type { NoteT } from './types'

export type SignalsToNotesArgsT = {
	signals: SignalT[]
	signalRows: SignalRowsT
	// Older signals have no velocity of their own. They play somewhere
	// between the project's min and max, so that is what they show as.
	defaultVelocity: number
}

// KeyLime keeps a signal list and a list of signal ids per row.
// The grid works with notes that know their own row.
export const convertSignalsToNotes = (args: SignalsToNotesArgsT): NoteT[] => {
	const signalsById = new Map<string, SignalT>()
	for (const signal of args.signals) signalsById.set(signal.id, signal)

	const notes: NoteT[] = []

	for (const row of Object.values(args.signalRows)) {
		const pitch = getPitchForRowId(row.id)
		const isUnknownRow = pitch === null
		if (isUnknownRow) continue

		for (const signalId of row.signalIds) {
			const signal = signalsById.get(signalId)
			if (!signal) continue

			notes.push({
				id: signal.id,
				pitch,
				start: convertBeatsToTicks(signal.startTime),
				duration: Math.max(1, convertBeatsToTicks(signal.duration)),
				velocity: signal.velocity ?? args.defaultVelocity,
				isMuted: signal.isMuted ?? false,
				modifiedTime: signal.modifiedTime ?? 0
			})
		}
	}

	return notes.sort((noteA, noteB) => noteA.start - noteB.start || noteA.pitch - noteB.pitch)
}

export type NotesToPatternArgsT = {
	notes: NoteT[]
	previousSignals: SignalT[]
}

export type PatternDataT = {
	patternSignals: SignalT[]
	patternSignalRows: SignalRowsT
}

const createEmptySignalRows = (): SignalRowsT => {
	return structuredClone(SIGNAL_ROWS)
}

// Signals the grid did not touch keep their exact saved numbers.
const getBeatsThatFit = (args: { savedBeats: number | undefined; ticks: number }): number => {
	const hasSavedBeats = args.savedBeats !== undefined
	if (!hasSavedBeats) return convertTicksToBeats(args.ticks)

	const savedTicks = convertBeatsToTicks(args.savedBeats as number)
	const isSame = savedTicks === args.ticks
	if (isSame) return args.savedBeats as number
	return convertTicksToBeats(args.ticks)
}

export const convertNotesToPattern = (args: NotesToPatternArgsT): PatternDataT => {
	const previousById = new Map<string, SignalT>()
	for (const signal of args.previousSignals) previousById.set(signal.id, signal)

	const patternSignalRows = createEmptySignalRows()
	const patternSignals: SignalT[] = []

	for (const note of args.notes) {
		const previous = previousById.get(note.id)
		const rowId = getRowIdForPitch(note.pitch)

		const signal: SignalT = {
			id: note.id,
			startTime: getBeatsThatFit({ savedBeats: previous?.startTime, ticks: note.start }),
			duration: getBeatsThatFit({ savedBeats: previous?.duration, ticks: note.duration }),
			noteIndex: previous?.noteIndex ?? 0,
			octaveOffset: previous?.octaveOffset ?? 0,
			velocity: note.velocity,
			isMuted: note.isMuted,
			modifiedTime: note.modifiedTime
		}

		patternSignals.push(signal)
		patternSignalRows[rowId].signalIds.push(signal.id)
	}

	return { patternSignals, patternSignalRows }
}

// A short fingerprint of a pattern. Used to tell "the project changed
// from outside the grid" (undo, a library pattern) from "the grid just
// wrote this".
export const createNotesSignature = (notes: NoteT[]): string => {
	const parts = notes.map((note) => {
		const velocityPart = Math.round(note.velocity * 1000)
		const mutedPart = note.isMuted ? 1 : 0
		return `${note.id}:${note.pitch}:${note.start}:${note.duration}:${velocityPart}:${mutedPart}`
	})
	return parts.sort().join('|')
}
