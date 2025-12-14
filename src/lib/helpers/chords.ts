import { ChordType, Chord, Note, Interval } from 'tonal'
import * as Voicing from '@tonaljs/voicing'
import * as VoicingDictionary from '@tonaljs/voicing-dictionary'
import chords from '$lib/constants/chords.json'
import chordTypes from '$lib/constants/chordTypes.json'

const registerChord = (chordType: any) => {
  ChordType.add(chordType.intervals, chordType.symbols, chordType.name)
}

const prepareChords = () => {
  chordTypes.forEach((chord) => {
    registerChord(chord)
  })
}

export const getScaleChords = (scale: string): string[] => {
  const scaleChords = chords.filter((chord: any) => chord.scales?.includes(scale.toLowerCase()))
  return scaleChords.map(chord => chord.symbol)
}

// Normalize chord names that Tonal doesn't recognize into Tonal-compatible format
const normalizeChordName = (name: string): string => {
  // Extract root note (e.g., "C", "F#", "Bb")
  const rootMatch = name.match(/^[A-G][#b]?/)
  if (!rootMatch) return name

  const root = rootMatch[0]
  let chordType = name.slice(root.length)

  // Handle parenthesized extensions like C7(13), Fmaj7(11), etc.
  // Format: baseChord(extension)
  const parenMatch = chordType.match(/^(.+)\((\d+|[#b]?\d+)\)$/)
  if (parenMatch) {
    const baseChord = parenMatch[1]
    const extension = parenMatch[2]

    // Convert to standard notation by removing parentheses
    // C7(13) -> C13, Fmaj7(13) -> Fmaj13, etc.
    // Special case: maj7(11) should become maj7#11
    const isMajor7With11 = baseChord.match(/maj7$/i) && extension === '11'
    if (isMajor7With11) {
      chordType = baseChord + '#11'
    } else {
      // For other cases, replace the base 7th chord with the extension
      // C7(13) -> C13, C7(9) -> C9, Gm7(9) -> Gm9, etc.
      const hasSeventhChord = baseChord.match(/7$/)
      if (hasSeventhChord) {
        const baseWithoutSeven = baseChord.slice(0, -1)
        chordType = baseWithoutSeven + extension
      } else {
        chordType = baseChord + extension
      }
    }
  }

  // Map common but unsupported chord types to Tonal equivalents
  const replacements: Record<string, string> = {
    // maj11 -> maj7#11 (major 7th with sharp 11)
    'maj11': 'maj7#11',
    'Maj11': 'Maj7#11',
    'M11': 'M7#11',

    // add11 -> add9 with manually added 11th (we'll handle this specially)
    'add11': 'add9',

    // maj7sus4 -> M7sus4
    'maj7sus4': 'M7sus4',
    'Maj7sus4': 'M7sus4',

    // maj7sus2 -> M9sus4 (sus2 with maj7 is essentially 9sus4)
    'maj7sus2': 'M9sus4',
    'Maj7sus2': 'M9sus4',
  }

  const normalizedType = replacements[chordType] || chordType
  return root + normalizedType
}

// Build chord manually from intervals when Tonal doesn't recognize it
type BuildChordFromIntervalsArgsT = {
  root: string
  intervals: string[]
  originalName: string
}

const buildChordFromIntervals = (args: BuildChordFromIntervalsArgsT): string[] => {
  const notes: string[] = []

  for (const interval of args.intervals) {
    const note = Note.transpose(args.root, interval)
    notes.push(note)
  }

  return notes
}

// Get intervals for common chord types that Tonal might not support
const getIntervalsForChordType = (chordType: string): string[] | null => {
  const intervalMap: Record<string, string[]> = {
    'add11': ['1P', '3M', '5P', '11P'],           // Major triad + 11th
    'madd11': ['1P', '3m', '5P', '11P'],          // Minor triad + 11th
    'maj11': ['1P', '3M', '5P', '7M', '9M', '11P'], // Full major 11th chord
    'Maj11': ['1P', '3M', '5P', '7M', '9M', '11P'],
    'M11': ['1P', '3M', '5P', '7M', '9M', '11P'],
  }

  return intervalMap[chordType] || null
}

// Use Tonal to convert a chord from its string representation to a ChordT object.
type GenerateArgsT = {
  name: string
  baseOctave?: string
}

export const generateChord = (args: GenerateArgsT | string): ChordT => {
  const name = typeof args === 'string' ? args : args.name
  const baseOctave = typeof args === 'string' ? 3 : (args.baseOctave ?? 3)

  // First, try to normalize the chord name
  const normalizedName = normalizeChordName(name)

  // Try to get the chord from Tonal
  let tonalChord = Chord.get(normalizedName)

  // If Tonal doesn't recognize it, try to build it manually
  const isEmptyChord = tonalChord.empty || tonalChord.notes.length === 0
  if (isEmptyChord) {
    const rootMatch = name.match(/^[A-G][#b]?/)
    const root = rootMatch ? rootMatch[0] : 'C'
    const chordType = name.slice(root.length)

    const intervals = getIntervalsForChordType(chordType)
    if (intervals) {
      const manualNotes = buildChordFromIntervals({
        root: root,
        intervals: intervals,
        originalName: name
      })

      // Create a synthetic chord object
      tonalChord = {
        ...tonalChord,
        empty: false,
        tonic: root,
        notes: manualNotes,
        symbol: name,
        intervals: intervals
      }
    }
  }

  const rootNote = tonalChord.tonic || 'C'
  const noteLetters = tonalChord.notes
  const symbol = tonalChord.symbol || name

  // Add octaves to notes, starting from the specified base octave
  const notesWithOctaves = addOctavesToNotes(noteLetters, Number(baseOctave))

  const bassNote = notesWithOctaves[0] || rootNote + baseOctave
  const chordId = crypto.randomUUID()

  const chord: ChordT = {
    id: chordId,
    name: name,
    symbol: symbol,
    rootNote: rootNote,
    octaveOffset: 0,
    voicing: 'closed',
    inversion: 0,
    bassNote: bassNote
  }

  return chord
}

// Add octave numbers to note letters, wrapping up an octave when going down in pitch
export const addOctavesToNotes = (noteLetters: string[], startOctave: number): string[] => {
  const hasNoNotes = noteLetters.length === 0
  if (hasNoNotes) return []

  const result: string[] = []
  let currentOctave = startOctave
  let previousMidi: number | null = null

  for (let i = 0; i < noteLetters.length; i++) {
    const noteLetter = noteLetters[i]
    const noteWithOctave = noteLetter + currentOctave
    const currentMidi = Note.midi(noteWithOctave)

    if (currentMidi === null) {
      result.push(noteWithOctave)
      continue
    }

    // If this note's MIDI value is lower than the previous, bump up an octave
    const isFirstNote = previousMidi === null
    if (!isFirstNote && previousMidi !== null) {
      const isLowerThanPrevious = currentMidi < previousMidi
      if (isLowerThanPrevious) {
        currentOctave++
      }
    }

    const finalNote = noteLetter + currentOctave
    result.push(finalNote)
    previousMidi = Note.midi(finalNote) || currentMidi
  }

  return result
}

type ApplyVoicingAndInversionArgsT = {
  chord: ChordT
  voicing?: VoicingT
  inversion?: number
}

// Apply both voicing and inversion transformations to a chord's notes
export const applyVoicingAndInversion = (args: ApplyVoicingAndInversionArgsT): any => {
  const targetVoicing = args.voicing ?? args.chord.voicing
  const targetInversion = args.inversion ?? args.chord.inversion

  const baseNotes = [...(args.chord as any).notes]
  const hasNoNotes = baseNotes.length === 0
  if (hasNoNotes) return args.chord

  // Step 1: Apply inversion first (rotate the notes)
  const invertedNotes = applyInversionToNotes(baseNotes, targetInversion)

  // Step 2: Apply voicing transformation
  const voicedNotes = applyVoicingToNotes(invertedNotes, targetVoicing)

  const newBassNote = voicedNotes[0] || args.chord.bassNote

  const newChord = {
    ...args.chord,
    voicing: targetVoicing,
    inversion: targetInversion,
    notes: voicedNotes,
    bassNote: newBassNote
  }

  return newChord
}

// Rotate notes based on inversion count using Tonal's built-in capabilities
const applyInversionToNotes = (notes: string[], inversion: number): string[] => {
  const noteCount = notes.length
  if (noteCount === 0) return notes
  if (inversion === 0) return [...notes]

  // Normalize inversion to be within valid range
  const normalizedInversion = ((inversion % noteCount) + noteCount) % noteCount
  if (normalizedInversion === 0) return [...notes]

  // Simple rotation with octave transposition for moved notes
  const result: string[] = []
  for (let i = 0; i < noteCount; i++) {
    const sourceIndex = (i + normalizedInversion) % noteCount
    const note = notes[sourceIndex]

    // Notes rotated from the beginning go up an octave
    const shouldTransposeUp = sourceIndex < normalizedInversion
    const finalNote = shouldTransposeUp ? Note.transpose(note, '8P') : note
    result.push(finalNote)
  }

  return result
}

// Transform notes based on voicing type
const applyVoicingToNotes = (notes: string[], voicing: string): string[] => {
  const noteCount = notes.length
  if (noteCount === 0) return notes

  const isClosedVoicing = voicing === 'closed'
  if (isClosedVoicing) return [...notes]

  // Tonal voicing dictionary support
  const isTonalLefthand = voicing === 'tonal-lefthand'
  if (isTonalLefthand) {
    const firstNote = notes[0]
    const hasOctave = /\d/.test(firstNote)
    if (hasOctave) {
      // Extract root and try to find voicing from Tonal
      const rootWithOctave = firstNote
      const range: [string, string] = [rootWithOctave, Note.transpose(rootWithOctave, '15P')]
      try {
        const voicings = Voicing.search('', range, VoicingDictionary.lefthand)
        if (voicings && voicings.length > 0) {
          return voicings[0]
        }
      } catch (error) {
        // Fall back to closed if Tonal voicing fails
      }
    }
    return [...notes]
  }

  const isTonalTriads = voicing === 'tonal-triads'
  if (isTonalTriads) {
    const firstNote = notes[0]
    const hasOctave = /\d/.test(firstNote)
    if (hasOctave) {
      const rootWithOctave = firstNote
      const range: [string, string] = [rootWithOctave, Note.transpose(rootWithOctave, '15P')]
      try {
        const voicings = Voicing.search('', range, VoicingDictionary.triads)
        if (voicings && voicings.length > 0) {
          return voicings[0]
        }
      } catch (error) {
        // Fall back to closed if Tonal voicing fails
      }
    }
    return [...notes]
  }

  const isOpenVoicing = voicing === 'open'
  if (isOpenVoicing) {
    // Spread notes across wider intervals (every other note up an octave)
    const result = notes.map((note, index) => {
      const isFirstNote = index === 0
      if (isFirstNote) return note
      const octavesToAdd = Math.floor(index / 2)
      if (octavesToAdd === 0) return note
      const interval = octavesToAdd === 1 ? '8P' : `${octavesToAdd * 7 + 1}P`
      return Note.transpose(note, interval)
    })
    return result
  }

  const isDrop2Voicing = voicing === 'drop2'
  if (isDrop2Voicing) {
    if (noteCount < 3) return [...notes]
    const result = [...notes]
    const secondHighestIndex = noteCount - 2
    result[secondHighestIndex] = Note.transpose(notes[secondHighestIndex], '-8P')
    return result
  }

  const isDrop3Voicing = voicing === 'drop3'
  if (isDrop3Voicing) {
    if (noteCount < 4) return [...notes]
    const result = [...notes]
    const thirdHighestIndex = noteCount - 3
    result[thirdHighestIndex] = Note.transpose(notes[thirdHighestIndex], '-8P')
    return result
  }

  const isDrop2And4Voicing = voicing === 'drop2and4'
  if (isDrop2And4Voicing) {
    if (noteCount < 4) return [...notes]
    const result = [...notes]
    const secondHighestIndex = noteCount - 2
    const fourthHighestIndex = noteCount - 4
    result[secondHighestIndex] = Note.transpose(notes[secondHighestIndex], '-8P')
    if (fourthHighestIndex >= 0) {
      result[fourthHighestIndex] = Note.transpose(notes[fourthHighestIndex], '-8P')
    }
    return result
  }

  const isShellVoicing = voicing === 'shell'
  if (isShellVoicing) {
    // Keep only root, 3rd, and 7th (if available) - essential chord tones
    if (noteCount < 2) return [...notes]
    const root = notes[0]
    const third = notes[1]
    const seventh = noteCount >= 4 ? notes[3] : null
    if (seventh) {
      return [root, third, seventh]
    }
    return [root, third]
  }

  const isSpreadVoicing = voicing === 'spread'
  if (isSpreadVoicing) {
    // Spread notes widely - each note up by its index in octaves
    const result = notes.map((note, index) => {
      if (index === 0) return note
      const octavesToAdd = index
      // Use Tonal's interval format: 8P = octave, 15P = two octaves, etc.
      const interval = octavesToAdd === 1 ? '8P' : `${octavesToAdd * 7 + 1}P`
      return Note.transpose(note, interval)
    })
    return result
  }

  // Default to closed voicing for unknown types
  return [...notes]
}

// Convenience function to apply only voicing
export const applyVoicing = (chord: ChordT, voicing: VoicingT): ChordT => {
  return applyVoicingAndInversion({ chord, voicing })
}

// Convenience function to apply only inversion
export const applyInversion = (chord: ChordT, inversion: number): ChordT => {
  return applyVoicingAndInversion({ chord, inversion })
}

prepareChords()