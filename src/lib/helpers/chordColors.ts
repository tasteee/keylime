export type ChordColorNameT =
	| 'c'
	| 'c-sharp'
	| 'd'
	| 'd-sharp'
	| 'e'
	| 'f'
	| 'f-sharp'
	| 'g'
	| 'g-sharp'
	| 'a'
	| 'a-sharp'
	| 'b'

type GetChordColorOptionsT = {
	symbol: string
}

// One color per chord root, indexed by pitch class (C = 0).
// The color follows the note itself, not the scale degree.
const COLOR_BY_PITCH_CLASS: ChordColorNameT[] = [
	'c',
	'c-sharp',
	'd',
	'd-sharp',
	'e',
	'f',
	'f-sharp',
	'g',
	'g-sharp',
	'a',
	'a-sharp',
	'b'
]

const PITCH_CLASS_BY_NOTE: Record<string, number> = {
	C: 0,
	'C#': 1,
	Db: 1,
	D: 2,
	'D#': 3,
	Eb: 3,
	E: 4,
	F: 5,
	'F#': 6,
	Gb: 6,
	G: 7,
	'G#': 8,
	Ab: 8,
	A: 9,
	'A#': 10,
	Bb: 10,
	B: 11
}

const getRootName = (symbol: string): string | null => {
	const rootMatch = symbol.match(/^[A-G][#b]?/)
	if (!rootMatch) return null
	return rootMatch[0]
}

// Returns null for rests and for symbols with no valid root.
export const getChordColor = (options: GetChordColorOptionsT): ChordColorNameT | null => {
	const rootName = getRootName(options.symbol)
	if (!rootName) return null

	const rootPitchClass = PITCH_CLASS_BY_NOTE[rootName]
	if (rootPitchClass === undefined) return null

	return COLOR_BY_PITCH_CLASS[rootPitchClass]
}
