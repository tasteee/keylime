import { Note, Chord } from 'tonal'
import { applyVoicingAndInversion, addOctavesToNotes } from './chords'

type ChordToNotesArgsT = {
  chord: ChordT
  rootOctave: string
}

/**
 * Converts a ChordT with all its modifiers (voicing, inversion, octaveOffset, bassNote)
 * into an array of final note strings with octaves applied.
 * 
 * Example:
 * - Input: C major chord with rootOctave=3, octaveOffset=-1
 * - Output: ["C2", "E2", "G2"]
 */
export const chordToNotes = (args: ChordToNotesArgsT): string[] => {
  const chord = args.chord
  const rootOctave = Number(args.rootOctave)

  // Step 1: Get note letters from Tonal
  const tonalChord = Chord.get(chord.symbol)
  const noteLetters = tonalChord.notes

  // Step 2: Add octaves to note letters
  const notesWithOctaves = addOctavesToNotes(noteLetters, rootOctave)

  // Step 3: Create a temporary chord with notes for voicing/inversion processing
  const chordWithNotes = {
    ...chord,
    notes: notesWithOctaves,
    bassNote: notesWithOctaves[0] || chord.rootNote + rootOctave
  }

  // Step 4: Apply voicing and inversion to get the transformed notes
  const transformedChord = applyVoicingAndInversion({
    chord: chordWithNotes as any,
    voicing: chord.voicing as VoicingT,
    inversion: chord.inversion
  })

  let finalNotes = [...(transformedChord as any).notes] as string[]

  // Step 5: Apply octave offset if present
  const hasOctaveOffset = chord.octaveOffset !== 0
  if (hasOctaveOffset) {
    const octaveInterval = chord.octaveOffset > 0
      ? `${chord.octaveOffset * 7 + 1}P`
      : `-${Math.abs(chord.octaveOffset) * 7 + 1}P`

    finalNotes = finalNotes.map((note) => {
      const transposed = Note.transpose(note, octaveInterval)
      return transposed
    })
  }

  // Step 6: Handle custom bass note if specified and different from the first note
  const hasBassNote = chord.bassNote && chord.bassNote.length > 0
  const bassNoteWithoutOctave = chord.bassNote?.replace(/\d+$/, '')
  const firstNoteWithoutOctave = finalNotes[0]?.replace(/\d+$/, '')
  const isCustomBassNote = hasBassNote && bassNoteWithoutOctave !== firstNoteWithoutOctave

  if (isCustomBassNote) {
    // Extract the octave from the first note to apply to bass note
    const firstNoteOctave = finalNotes[0]?.match(/\d+$/)?.[0]
    const bassNoteWithOctave = bassNoteWithoutOctave + firstNoteOctave

    // Replace the first note with the custom bass note
    finalNotes = [bassNoteWithOctave, ...finalNotes.slice(1)]
  }

  return finalNotes
}

// Manual test function - call this in browser console if needed
export const testChordToNotes = () => {
  console.log('=== Testing chordToNotes ===')

  // Test 1: C major with octaveOffset -1 and rootOctave 3
  const test1: ChordT = { id: '1', name: 'C', symbol: 'C', rootNote: 'C', octaveOffset: -1, voicing: 'closed', inversion: 0, bassNote: 'C3' }
  const result1 = chordToNotes({ chord: test1, rootOctave: '3' })
  console.log('Test 1 - C major, octaveOffset -1, rootOctave 3:', result1)
  console.log('Expected: ["C2", "E2", "G2"]')

  // Test 2: C major with no octaveOffset
  const test2: ChordT = { id: '2', name: 'C', symbol: 'C', rootNote: 'C', octaveOffset: 0, voicing: 'closed', inversion: 0, bassNote: 'C3' }
  const result2 = chordToNotes({ chord: test2, rootOctave: '3' })
  console.log('\nTest 2 - C major, octaveOffset 0, rootOctave 3:', result2)
  console.log('Expected: ["C3", "E3", "G3"]')

  // Test 3: C major with octaveOffset +1
  const test3: ChordT = { id: '3', name: 'C', symbol: 'C', rootNote: 'C', octaveOffset: 1, voicing: 'closed', inversion: 0, bassNote: 'C3' }
  const result3 = chordToNotes({ chord: test3, rootOctave: '3' })
  console.log('\nTest 3 - C major, octaveOffset +1, rootOctave 3:', result3)
  console.log('Expected: ["C4", "E4", "G4"]')

  console.log('\n=== Tests Complete ===')
}
