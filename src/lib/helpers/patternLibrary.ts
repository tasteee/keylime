import { scaled, getVoicedChord, applyPerformanceSafely } from '$lib/music'
import { SIGNAL_IDS, SIGNAL_ROWS } from '$lib/constants/signalRows'
import { getSignalRowMidiNotes } from './signalRows'
import type { ScaledT } from '@tasteee/scaled/types'

const BEAT_STEP = 0.0625
const MAX_PATTERN_BEATS = 64

export type PatternLibrarySubcategoryT = {
	name: string
	patterns: ScaledT.PerformanceSummaryT[]
}

export type PatternLibraryCategoryT = {
	name: string
	subcategories: PatternLibrarySubcategoryT[]
}

export type LibraryPatternT = {
	patternSignals: SignalT[]
	patternSignalRows: SignalRowsT
	patternDurationBars: number
}

const sortByName = (nameA: string, nameB: string): number => nameA.localeCompare(nameB, undefined, { numeric: true })

// Every factory performance scaled ships, grouped
// category -> subcategory -> pattern.
export const getPatternLibrary = (): PatternLibraryCategoryT[] => {
	const categoryMap = new Map<string, Map<string, ScaledT.PerformanceSummaryT[]>>()

	for (const summary of scaled.performanceSummaries) {
		const subcategoryMap = categoryMap.get(summary.category) ?? new Map()
		const patterns = subcategoryMap.get(summary.subcategory) ?? []
		patterns.push(summary)
		subcategoryMap.set(summary.subcategory, patterns)
		categoryMap.set(summary.category, subcategoryMap)
	}

	const categories: PatternLibraryCategoryT[] = []

	for (const [categoryName, subcategoryMap] of categoryMap) {
		const subcategories: PatternLibrarySubcategoryT[] = []
		for (const [subcategoryName, patterns] of subcategoryMap) {
			const sortedPatterns = [...patterns].sort((patternA, patternB) => sortByName(patternA.name, patternB.name))
			subcategories.push({ name: subcategoryName, patterns: sortedPatterns })
		}
		subcategories.sort((subcategoryA, subcategoryB) => sortByName(subcategoryA.name, subcategoryB.name))
		categories.push({ name: categoryName, subcategories })
	}

	return categories.sort((categoryA, categoryB) => sortByName(categoryA.name, categoryB.name))
}

const snapToStep = (beats: number): number => Math.round(beats / BEAT_STEP) * BEAT_STEP

type FindNearestRowArgsT = {
	midiNote: number
	rowMidiNotes: Map<string, number>
}

// Signal rows are chord tones, so a note lands on the row
// whose pitch is closest to it for the reference chord.
const findNearestRowId = (args: FindNearestRowArgsT): string | null => {
	let nearestRowId: string | null = null
	let nearestDistance = Infinity

	for (const [rowId, rowMidiNote] of args.rowMidiNotes) {
		const distance = Math.abs(rowMidiNote - args.midiNote)
		const isCloser = distance < nearestDistance
		if (!isCloser) continue
		nearestRowId = rowId
		nearestDistance = distance
	}

	return nearestRowId
}

type BuildLibraryPatternArgsT = {
	templateId: string
	referenceChord: ChordT
	key: string
	scale: string
	octave: number
}

type RowNoteT = {
	rowId: string
	startTime: number
	duration: number
}

// Notes in one row cannot overlap in the editor, so
// each one is cut short where the next one begins.
const trimOverlapsInRow = (notes: RowNoteT[]): RowNoteT[] => {
	const sortedNotes = [...notes].sort((noteA, noteB) => noteA.startTime - noteB.startTime)
	const trimmedNotes: RowNoteT[] = []

	sortedNotes.forEach((note, noteIndex) => {
		const nextNote = sortedNotes[noteIndex + 1]
		const noteEnd = note.startTime + note.duration
		const nextStart = nextNote ? nextNote.startTime : noteEnd
		const trimmedEnd = Math.min(noteEnd, nextStart)
		const duration = trimmedEnd - note.startTime
		const isTooShort = duration < BEAT_STEP
		if (isTooShort) return
		trimmedNotes.push({ ...note, duration })
	})

	return trimmedNotes
}

// A scaled factory pattern, written as pattern-editor signals. The template is
// adapted to the reference chord and each note is placed on the nearest chord-tone row.
export const buildLibraryPattern = (args: BuildLibraryPatternArgsT): LibraryPatternT | null => {
	const template = scaled.performanceTemplates.find((candidate) => candidate.id === args.templateId)
	if (!template) return null

	const voicedChord = getVoicedChord({ chord: args.referenceChord, octave: args.octave })
	const performance = scaled.adaptPerformanceTemplate({
		template,
		midiNotes: voicedChord.midiNotes,
		key: args.key,
		scale: args.scale,
		octave: args.octave
	})

	const patternBeats = Math.min(snapToStep(performance.durationBeats), MAX_PATTERN_BEATS)
	const progression = [{ id: 'library-chord', chord: voicedChord, durationBeats: patternBeats }]
	const notes = applyPerformanceSafely({ progression, performance })
	const rowMidiNotes = getSignalRowMidiNotes(voicedChord, SIGNAL_IDS)

	const rowNotes: RowNoteT[] = []

	for (const note of notes) {
		const rowId = findNearestRowId({ midiNote: note.midiNote, rowMidiNotes })
		if (!rowId) continue

		const startTime = snapToStep(note.startBeat)
		const isOutsidePattern = startTime >= patternBeats
		if (isOutsidePattern) continue

		const clippedEnd = Math.min(snapToStep(note.startBeat + note.durationBeats), patternBeats)
		const duration = clippedEnd - startTime
		const isTooShort = duration < BEAT_STEP
		if (isTooShort) continue

		rowNotes.push({ rowId, startTime, duration })
	}

	const notesByRow = new Map<string, RowNoteT[]>()
	rowNotes.forEach((note) => notesByRow.set(note.rowId, [...(notesByRow.get(note.rowId) ?? []), note]))

	const patternSignals: SignalT[] = []
	const patternSignalRows: SignalRowsT = structuredClone(SIGNAL_ROWS)
	const modifiedTime = Date.now()

	for (const [rowId, notesInRow] of notesByRow) {
		for (const note of trimOverlapsInRow(notesInRow)) {
			const signal: SignalT = {
				id: crypto.randomUUID(),
				startTime: note.startTime,
				duration: note.duration,
				noteIndex: 0,
				octaveOffset: 0,
				modifiedTime
			}
			patternSignals.push(signal)
			patternSignalRows[rowId].signalIds.push(signal.id)
		}
	}

	const patternDurationBars = Math.max(patternBeats / 4, BEAT_STEP / 4)
	return { patternSignals, patternSignalRows, patternDurationBars }
}
