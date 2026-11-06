export type ChordColorNameT = 'purple' | 'pink' | 'red' | 'orange' | 'yellow' | 'green' | 'blue'

type GetChordColorOptionsT = {
	symbol: string
	key: string
	scale: string
}

// One color per scale degree, from the 1st to the 7th.
const DEGREE_COLORS: ChordColorNameT[] = ['purple', 'pink', 'red', 'orange', 'yellow', 'green', 'blue']

const MAJOR_SCALE_STEPS = [0, 2, 4, 5, 7, 9, 11]
const MINOR_SCALE_STEPS = [0, 2, 3, 5, 7, 8, 10]

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

// Returns null for rests and for roots outside the key's scale.
export const getChordColor = (options: GetChordColorOptionsT): ChordColorNameT | null => {
	const rootName = getRootName(options.symbol)
	if (!rootName) return null

	const rootPitchClass = PITCH_CLASS_BY_NOTE[rootName]
	const keyPitchClass = PITCH_CLASS_BY_NOTE[options.key]
	const hasUnknownNote = rootPitchClass === undefined || keyPitchClass === undefined
	if (hasUnknownNote) return null

	const semitonesAboveKey = (rootPitchClass - keyPitchClass + 12) % 12
	const isMinor = options.scale.toLowerCase() === 'minor'
	const scaleSteps = isMinor ? MINOR_SCALE_STEPS : MAJOR_SCALE_STEPS
	const degreeIndex = scaleSteps.indexOf(semitonesAboveKey)
	if (degreeIndex === -1) return null

	return DEGREE_COLORS[degreeIndex]
}
