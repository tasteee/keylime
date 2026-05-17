/**
 * Generator script: produces an expanded chordsByScale.json
 * Checks each candidate chord type against each scale — only includes
 * chords whose notes all fall within the scale (enharmonic-aware).
 *
 * Run with: node scripts/generateChordsByScale.mjs
 */

import { Scale, Chord, Note } from 'tonal'
import { writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// All key/scale combinations used in the app
const SCALES = [
	'C Major',
	'C Minor',
	'C# Major',
	'C# Minor',
	'D Major',
	'D Minor',
	'D# Minor',
	'E Major',
	'E Minor',
	'F Major',
	'F Minor',
	'F# Major',
	'F# Minor',
	'G Major',
	'G Minor',
	'G# Minor',
	'A Major',
	'A Minor',
	'A# Minor',
	'B Major',
	'B Minor'
]

// Chord types to try on each root note, ordered by how common/useful they are.
// The key is the suffix appended to the root note letter.
const CHORD_TYPES_TO_TRY = [
	// Triads
	'', // major
	'm', // minor
	'dim', // diminished
	'aug', // augmented (rare in diatonic, but let's try)
	'5', // power chord

	// Suspended
	'sus2',
	'sus4',

	// Sixth
	'6',
	'm6',
	'6/9', // major 6/9

	// Added tone
	'add9',
	'madd9',
	'add11', // major triad + 11th (no 7th)

	// Seventh
	'maj7',
	'm7',
	'7', // dominant 7
	'dim7',
	'm7b5', // half-diminished

	// Ninth
	'maj9',
	'm9',
	'9', // dominant 9
	'9sus4',

	// Eleventh
	'maj11',
	'm11',
	'11', // dominant 11

	// Thirteenth
	'maj13',
	'm13',
	'13', // dominant 13

	// 7 + sus
	'7sus2',
	'7sus4',

	// Major 7 + sus
	'maj7sus4'
]

// Tonal uses slightly different names for some chord types.
// Map our display suffix -> what Tonal.Chord.get() understands.
const TONAL_SUFFIX_MAP = {
	'': '', // major triad
	m: 'm',
	dim: 'dim',
	aug: 'aug',
	5: '5',
	sus2: 'sus2',
	sus4: 'sus4',
	6: 'M6',
	m6: 'm6',
	'6/9': 'M69',
	add9: 'add9',
	madd9: 'madd9',
	add11: 'add11', // handled manually if Tonal fails
	maj7: 'maj7',
	m7: 'm7',
	7: '7',
	dim7: 'dim7',
	m7b5: 'm7b5',
	maj9: 'maj9',
	m9: 'm9',
	9: '9',
	'9sus4': '9sus4',
	maj11: 'maj9#11', // closest Tonal equivalent
	m11: 'm11',
	11: '11',
	maj13: 'maj13',
	m13: 'm13',
	13: '13',
	'7sus2': '7sus2',
	'7sus4': '7sus4',
	maj7sus4: 'M7sus4'
}

// Manual interval definitions for chord types Tonal can't parse
const MANUAL_INTERVALS = {
	add11: ['1P', '3M', '5P', '11P'],
	madd9: ['1P', '3m', '5P', '9M']
}

// Get the MIDI pitch class (0-11) for a note letter, with enharmonic equivalence
const getMidiPc = (noteName) => {
	const midi = Note.midi(noteName + '4')
	if (midi === null) return null
	return midi % 12
}

// Get all pitch classes in a scale (set of 0-11 integers)
const getScalePitchClasses = (scaleName) => {
	const scaleObj = Scale.get(scaleName)
	if (!scaleObj || scaleObj.empty) return new Set()
	return new Set(scaleObj.notes.map((n) => getMidiPc(n)).filter((pc) => pc !== null))
}

// Get chord notes for a root + display suffix combination
const getChordNotes = (root, displaySuffix) => {
	const tonalSuffix = TONAL_SUFFIX_MAP[displaySuffix]
	if (tonalSuffix === undefined) return []

	const chordName = root + tonalSuffix
	const chordObj = Chord.get(chordName)

	if (!chordObj.empty && chordObj.notes.length > 0) {
		return chordObj.notes
	}

	// Fallback: manual intervals
	const intervals = MANUAL_INTERVALS[displaySuffix]
	if (!intervals) return []

	return intervals.map((interval) => Note.transpose(root, interval)).filter(Boolean)
}

// Check if all chord notes are within the scale pitch classes
const isChordInScale = (chordNotes, scalePcs) => {
	if (chordNotes.length === 0) return false
	return chordNotes.every((note) => {
		const pc = getMidiPc(note)
		return pc !== null && scalePcs.has(pc)
	})
}

// Build the ordered chord list for a single scale
// Returns chord names sorted by scale degree order, then by chord type priority
const buildChordsForScale = (scaleName) => {
	const scaleObj = Scale.get(scaleName)
	if (!scaleObj || scaleObj.empty) return []

	const scalePcs = getScalePitchClasses(scaleName)
	const scaleNotes = scaleObj.notes // ordered root notes

	const result = []

	for (const rootNote of scaleNotes) {
		for (const displaySuffix of CHORD_TYPES_TO_TRY) {
			const chordNotes = getChordNotes(rootNote, displaySuffix)
			if (!isChordInScale(chordNotes, scalePcs)) continue

			const displayName = rootNote + displaySuffix
			result.push(displayName)
		}
	}

	return result
}

// Generate the full map
const generateChordsByScale = () => {
	const output = {}

	for (const scaleName of SCALES) {
		const chords = buildChordsForScale(scaleName)
		output[scaleName] = chords
		console.log(`${scaleName}: ${chords.length} chords`)
	}

	return output
}

const result = generateChordsByScale()
const outputPath = resolve(__dirname, '../src/lib/constants/chordsByScale.json')
writeFileSync(outputPath, JSON.stringify(result, null, 2))
console.log(`\nWritten to: ${outputPath}`)
