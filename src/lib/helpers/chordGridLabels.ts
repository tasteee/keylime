import { scaled, getChordMidiNotes, VOICING_OPTIONS, DEFAULT_VOICING } from '$lib/music'

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const UPPER_NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']
const TRIAD_TYPES = ['maj', 'min', 'dim', 'aug']
const LOWERCASE_TYPES = ['min', 'dim']
const INVERSION_LABELS = ['Root position', '1st inversion', '2nd inversion', '3rd inversion']

export const getChordRootPitch = (symbol: string): number => {
	return scaled.getChord({ chord: symbol }).rootPitch
}

export const getChordType = (symbol: string): string => {
	return scaled.getChord({ chord: symbol }).chordType
}

export const checkIsTriad = (symbol: string): boolean => {
	const chordType = getChordType(symbol)
	return TRIAD_TYPES.includes(chordType)
}

// A note name without its octave, e.g. 61 -> "C#".
const getPitchName = (midiNote: number): string => {
	const pitchClass = ((midiNote % 12) + 12) % 12
	return NOTE_NAMES[pitchClass]
}

// The notes as they will sound, lowest first, without
// octave numbers. Inversions and voicings change the
// order, so this list doubles as feedback for shaping.
export const getChordNoteNames = (chord: ChordT, octave: number): string[] => {
	const midiNotes = getChordMidiNotes(chord, octave)
	const sortedMidiNotes = [...midiNotes].sort((first, second) => first - second)
	const noteNames: string[] = []

	for (const midiNote of sortedMidiNotes) {
		const noteName = getPitchName(midiNote)
		const isAlreadyListed = noteNames.includes(noteName)
		if (isAlreadyListed) continue
		noteNames.push(noteName)
	}

	return noteNames
}

type GetRomanNumeralArgsT = {
	degreeIndex: number
	symbol: string
}

// Uppercase for major, lowercase for minor, ° for
// diminished, + for augmented. Chords with no third
// fall back to uppercase.
export const getRomanNumeral = (args: GetRomanNumeralArgsT): string => {
	const baseNumeral = UPPER_NUMERALS[args.degreeIndex] ?? String(args.degreeIndex + 1)
	const chordType = getChordType(args.symbol)
	const isLowercase = LOWERCASE_TYPES.includes(chordType)
	const caseNumeral = isLowercase ? baseNumeral.toLowerCase() : baseNumeral
	const isDiminished = chordType === 'dim'
	if (isDiminished) return `${caseNumeral}°`
	const isAugmented = chordType === 'aug'
	if (isAugmented) return `${caseNumeral}+`
	return caseNumeral
}

export const getScaleDegreeIndex = (args: { key: string; scale: string; rootPitch: number }): number => {
	const scaleData = scaled.getScale({ key: args.key, scale: args.scale })
	return scaleData.pitches.indexOf(args.rootPitch)
}

export const checkIsChordShaped = (chord: ChordT): boolean => {
	const hasOctaveShift = chord.octaveOffset !== 0
	const hasInversion = chord.inversion !== 0
	const hasCustomVoicing = chord.voicing !== DEFAULT_VOICING
	return hasOctaveShift || hasInversion || hasCustomVoicing
}

const getVoicingLabel = (voicing: VoicingT): string => {
	const voicingOption = VOICING_OPTIONS.find((option) => option.value === voicing)
	return voicingOption?.label ?? voicing
}

const getOctaveLabel = (octaveOffset: number): string => {
	const sign = octaveOffset > 0 ? '+' : '−'
	const distance = Math.abs(octaveOffset)
	const unit = distance === 1 ? 'octave' : 'octaves'
	return `${sign}${distance} ${unit}`
}

// A short sentence of what changed, e.g.
// "1st inversion · Open · +1 octave".
export const getChordShapeSummary = (chord: ChordT): string => {
	const parts: string[] = []

	const hasInversion = chord.inversion !== 0
	if (hasInversion) parts.push(INVERSION_LABELS[chord.inversion] ?? `Inversion ${chord.inversion}`)

	const hasCustomVoicing = chord.voicing !== DEFAULT_VOICING
	if (hasCustomVoicing) parts.push(getVoicingLabel(chord.voicing))

	const hasOctaveShift = chord.octaveOffset !== 0
	if (hasOctaveShift) parts.push(getOctaveLabel(chord.octaveOffset))

	const hasNoChanges = parts.length === 0
	if (hasNoChanges) return 'Default shape'
	return parts.join(' · ')
}
