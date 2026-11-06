import { SIGNAL_IDS } from '$lib/constants/signalRows'
import { getNoteFromSignalRow } from './signalRows'

type ChordNotesToSignalRowNotesArgsT = {
  chordNotes: string[]
}

/**
 * Converts an array of chord notes (e.g., ["C2", "E2", "G2"]) into the full set
 * of notes represented by all signal rows in the pattern grid.
 * 
 * Each signal row ID (like "N1-2", "N2", "N3+1") maps to a specific note:
 * - N1, N2, N3... refer to the 1st, 2nd, 3rd... note of the chord
 * - When note index exceeds chord length, it wraps around with octave offset
 * - +/-N modifiers move up/down whole bands of 8 rows,
 *   so pitch always ascends from bottom row to top row
 * 
 * Example:
 * - Input: ["C2", "E2", "G2"]
 * - N1-2 -> C0 (note 1, octave -2)
 * - N2-2 -> E0 (note 2, octave -2)
 * - N4-2 -> C1 (note 4 wraps to note 1, +1 octave from wrapping)
 * - etc.
 * 
 * Returns an array with one note per signal row, in the same order as SIGNAL_IDS.
 */
export const chordNotesToSignalRowNotes = (args: ChordNotesToSignalRowNotesArgsT): string[] => {
  const hasNoNotes = args.chordNotes.length === 0
  if (hasNoNotes) return []

  const signalRowNotes = SIGNAL_IDS.map((signalRowId) => {
    const note = getNoteFromSignalRow({
      signalRowId,
      chord: null,
      chordNotes: args.chordNotes
    })

    return note as string
  })

  return signalRowNotes
}

// Manual test function - call this in browser console if needed
export const testChordNotesToSignalRowNotes = () => {
  console.log('\n=== Testing chordNotesToSignalRowNotes ===')

  // Test with C major chord
  const cMajorNotes = ['C2', 'E2', 'G2']
  const result = chordNotesToSignalRowNotes({ chordNotes: cMajorNotes })

  console.log('\nInput chord notes:', cMajorNotes)
  console.log('Signal row count:', SIGNAL_IDS.length)
  console.log('Output notes count:', result.length)

  console.log('\nFirst 10 signal rows:')
  SIGNAL_IDS.slice(0, 10).forEach((signalId, index) => {
    console.log(`  ${signalId} -> ${result[index]}`)
  })

  console.log('\n=== Tests Complete ===\n')
}
