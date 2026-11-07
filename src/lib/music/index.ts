// The one place Keylime talks to @tasteee/scaled for music theory.
// Chords, voicings, inversions, scales and MIDI notes are all scaled's own
// shapes. Keylime stores them as-is and never converts them back and forth.
import { scaled } from '@tasteee/scaled'
import type { ScaledT } from '@tasteee/scaled/types'

export { scaled }

// Chord families shown in the chord grid and the chord filter.
export const GRID_CHORD_FAMILIES = ['triad', 'seventh'] as const

type VoicingOptionT = { value: VoicingT; label: string }

export const VOICING_OPTIONS: VoicingOptionT[] = [
	{ value: 'dynamic', label: 'Dynamic' },
	{ value: 'dynamicBass', label: 'Dynamic + Bass' },
	{ value: 'closed', label: 'Closed' },
	{ value: 'open', label: 'Open' },
	{ value: 'guitar', label: 'Guitar' },
	{ value: 'drop2', label: 'Drop 2' },
	{ value: 'drop3', label: 'Drop 3' },
	{ value: 'drop4', label: 'Drop 4' },
	{ value: 'drop2and3', label: 'Drop 2 & 3' },
	{ value: 'drop2and4', label: 'Drop 2 & 4' },
	{ value: 'spread', label: 'Spread' },
	{ value: 'shell', label: 'Shell' }
]

export const DEFAULT_VOICING: VoicingT = 'closed'

const SHARP_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

// Scientific pitch notation, C4 = 60 (the same convention scaled uses).
export const midiToNoteName = (midiNote: number): string => {
	const name = SHARP_NAMES[((midiNote % 12) + 12) % 12]
	const octave = Math.floor(midiNote / 12) - 1
	return `${name}${octave}`
}

const NATURAL_PITCHES: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }

// "C#4" -> 61. Returns null when the text is not a note name.
export const noteNameToMidi = (noteName: string): number | null => {
	const match = noteName.trim().match(/^([A-Ga-g])([#b]*)(-?\d+)$/)
	if (!match) return null
	const [, letter, accidentals, octaveText] = match
	const sharps = accidentals.split('#').length - 1
	const flats = accidentals.split('b').length - 1
	const pitch = NATURAL_PITCHES[letter.toUpperCase()] + sharps - flats
	return (Number(octaveText) + 1) * 12 + pitch
}

export const toMidiNote = (note: number | string): number | null => {
	if (typeof note === 'number') return note
	return noteNameToMidi(note)
}

const getChordNoteCount = (symbol: string): number => {
	return scaled.getChord({ chord: symbol }).midiNotes.length
}

// Voicings a chord can use. Drop and shell voicings need a minimum number of notes.
export const getVoicingOptions = (symbol: string): VoicingOptionT[] => {
	const noteCount = getChordNoteCount(symbol)
	return VOICING_OPTIONS.filter((option) => noteCount >= (scaled.voicingMinimumNotes[option.value] ?? 0))
}

export const isVoicingAvailable = (symbol: string, voicing: VoicingT): boolean => {
	const minimumNotes = scaled.voicingMinimumNotes[voicing] ?? 0
	return getChordNoteCount(symbol) >= minimumNotes
}

// Chords the grid offers for a key and scale, in scale order.
export const getScaleChordSymbols = (key: string, scale: string): string[] => {
	const chords = scaled.getScaleChords({ key, scale, chordTypes: GRID_CHORD_FAMILIES })
	return chords.map((chord) => chord.symbol)
}

const MAJOR_AND_MINOR = ['Major', 'Minor']
const ALL_KEYS = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#']
let allChordSymbolsCache: string[] | null = null

// Every chord the grid can show in any key, for filtering projects.
export const getAllChordSymbols = (): string[] => {
	if (allChordSymbolsCache) return allChordSymbolsCache
	const symbols = new Set<string>()
	for (const key of ALL_KEYS) {
		for (const scale of MAJOR_AND_MINOR) {
			getScaleChordSymbols(key, scale).forEach((symbol) => symbols.add(symbol))
		}
	}
	allChordSymbolsCache = [...symbols].sort()
	return allChordSymbolsCache
}

type VoiceChordArgsT = {
	chord: ChordT
	octave: number
	// The project's voicing, for a chord that has none of its own.
	projectVoicing: VoicingT
	previousMidiNotes?: readonly number[]
}

// The voicing a chord plays with: its own, else the project's.
export const resolveChordVoicing = (chord: ChordT, projectVoicing: VoicingT): VoicingT => {
	return chord.voicing ?? projectVoicing
}

const getVoicingInput = (args: VoiceChordArgsT): ScaledT.GetChordWithVoicingInputT => {
	const chord = args.chord
	const chosenVoicing = resolveChordVoicing(chord, args.projectVoicing)
	// A voicing the chord has too few notes for plays as closed rather than failing.
	const isChosenVoicingAvailable = isVoicingAvailable(chord.symbol, chosenVoicing)
	const voicing = isChosenVoicingAvailable ? chosenVoicing : DEFAULT_VOICING
	const input = {
		chord: chord.symbol,
		octave: args.octave + chord.octaveOffset,
		voicing,
		inversion: chord.inversion
	}
	return args.previousMidiNotes ? { ...input, previousMidiNotes: args.previousMidiNotes } : input
}

// One chord on its own, as it sounds when previewed.
export const getVoicedChord = (args: VoiceChordArgsT): ScaledT.VoicedChordT => {
	return scaled.getChordWithVoicing(getVoicingInput(args))
}

export const getChordMidiNotes = (chord: ChordT, octave: number, projectVoicing: VoicingT): readonly number[] => {
	return getVoicedChord({ chord, octave, projectVoicing }).midiNotes
}

// Every chord in a progression, voiced in order so Dynamic voicings
// follow the chord before them. Rests are skipped. Keyed by chord id.
export const voiceProgression = (
	items: ProgressionItemT[],
	octave: number,
	projectVoicing: VoicingT
): Map<string, ScaledT.VoicedChordT> => {
	const chords = items.filter((item): item is ProgressionChordT => item.type === 'chord')
	const inputs = chords.map((chord) => getVoicingInput({ chord, octave, projectVoicing }))
	const voicedChords = scaled.getProgressionWithVoicing(inputs)
	const voicedById = new Map<string, ScaledT.VoicedChordT>()
	chords.forEach((chord, index) => voicedById.set(chord.id, voicedChords[index]))
	return voicedById
}

export const createChord = (symbol: string, overrides: Partial<ChordT> = {}): ChordT => {
	return {
		id: crypto.randomUUID(),
		symbol,
		octaveOffset: 0,
		// New chords follow the project's voicing.
		voicing: null,
		inversion: 0,
		...overrides
	}
}

type ApplyPerformanceSafelyArgsT = {
	progression: readonly ScaledT.ProgressionChordT[]
	performance: ScaledT.PerformancePatternT
}

// scaled refuses to render a note outside MIDI range (0-127), and one note
// failing fails the whole clip. In the pattern editor that happens easily: the
// lowest rows against a low chord. So when a render fails, render each pattern
// event on its own and leave out only the ones that cannot sound.
export const applyPerformanceSafely = (args: ApplyPerformanceSafelyArgsT): readonly ScaledT.PerformanceNoteT[] => {
	try {
		return scaled.applyPerformance(args).notes
	} catch (error) {
		const isRangeError = error instanceof RangeError
		if (!isRangeError) throw error
	}

	const notes: ScaledT.PerformanceNoteT[] = []
	args.performance.events.forEach((event, eventPosition) => {
		const performance = { ...args.performance, events: [event] }
		try {
			const eventNotes = scaled.applyPerformance({ progression: args.progression, performance }).notes
			notes.push(...eventNotes.map((note) => ({ ...note, id: `${eventPosition}-${note.id}` })))
		} catch (error) {
			const isRangeError = error instanceof RangeError
			if (!isRangeError) throw error
		}
	})
	return notes
}
