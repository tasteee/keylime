import { Note } from 'tonal'
import { getNoteFromSignalRow } from './signalRows'
import { chordToNotes } from './chordToNotes'
import { chordNotesToSignalRowNotes } from './chordNotesToSignalRowNotes'

type GeneratePerformanceArgsT = {
  chords: ProgressionItemT[]
  signals: SignalT[]
  signalRows: SignalRowsT
  patternLengthBeats: number
  progressionLengthBeats: number
  octave: string
  minVelocity?: number
  maxVelocity?: number
}

const getRandomBetween = (args: { min: number; max: number }) => {
  return Math.floor(Math.random() * (args.max - args.min + 1)) + args.min
}

const getSignalRowById = (args: { signalRows: SignalRowsT; signalId: string }): SignalRowT | null => {
  const rowEntries = Object.entries(args.signalRows)
  const foundEntry = rowEntries.find(([, row]) => row.signalIds.includes(args.signalId))
  if (!foundEntry) return null
  return foundEntry[1]
}

const mapSignalToNote = (args: {
  signal: SignalT
  chord: ChordT
  signalRow: SignalRowT
  chordNotes: string[]
}): string | null => {
  // Use the signal row ID to derive the note, just like getNoteFromSignalRow does
  const note = getNoteFromSignalRow({
    signalRowId: args.signalRow.id,
    chord: null,
    chordNotes: args.chordNotes
  })

  if (!note) return null

  const hasSignalOctaveOffset = args.signal.octaveOffset !== 0
  if (!hasSignalOctaveOffset) return note

  const octaveOffset = args.signal.octaveOffset
  const interval = octaveOffset > 0
    ? `${octaveOffset * 7 + 1}P`
    : `-${Math.abs(octaveOffset) * 7 + 1}P`

  const transposedNote = Note.transpose(note, interval)
  return transposedNote
}

type FindChordAtTimeArgsT = {
  chords: ProgressionItemT[]
  absoluteTime: number
}

const findChordAtTime = (args: FindChordAtTimeArgsT): ProgressionChordT | null => {
  const foundItem = args.chords.find((item) => {
    const itemStart = item.startTime ?? 0
    const itemEnd = itemStart + item.durationBeats
    const isTimeWithinItem = args.absoluteTime >= itemStart && args.absoluteTime < itemEnd
    return isTimeWithinItem
  })

  // Return null if it's a rest or if nothing was found
  // if (!foundItem || foundItem.type === 'rest') return null

  return foundItem as ProgressionChordT
}

export const generatePerformance = (args: GeneratePerformanceArgsT): PerformanceNoteT[] => {
  const performanceNotes: PerformanceNoteT[] = []

  const hasNoChords = args.chords.length === 0
  if (hasNoChords) return performanceNotes

  const hasNoSignals = args.signals.length === 0
  if (hasNoSignals) return performanceNotes

  const hasNoPatternLength = args.patternLengthBeats <= 0
  if (hasNoPatternLength) return performanceNotes

  const hasNoProgressionLength = args.progressionLengthBeats <= 0
  if (hasNoProgressionLength) return performanceNotes

  // Calculate how many times the pattern tiles across the progression
  const numberOfPatternRepeats = Math.ceil(args.progressionLengthBeats / args.patternLengthBeats)

  for (let repeatIndex = 0; repeatIndex < numberOfPatternRepeats; repeatIndex++) {
    const patternStartOffset = repeatIndex * args.patternLengthBeats

    args.signals.forEach((signal) => {
      const signalRow = getSignalRowById({ signalRows: args.signalRows, signalId: signal.id })
      if (!signalRow) return

      const absoluteStartTime = patternStartOffset + signal.startTime

      const isSignalBeyondProgression = absoluteStartTime >= args.progressionLengthBeats
      if (isSignalBeyondProgression) return

      const activeChord = findChordAtTime({ chords: args.chords, absoluteTime: absoluteStartTime })

      if (!activeChord) return

      // Derive notes from chord at performance generation time
      const chordNotes = chordToNotes({ chord: activeChord, rootOctave: args.octave })

      // Calculate the end of this chord
      const chordStart = activeChord.startTime ?? 0
      const chordEnd = chordStart + activeChord.durationBeats

      // Clip signal duration to chord boundary and progression end
      const absoluteEndTime = absoluteStartTime + signal.duration
      const clippedEndTime = Math.min(absoluteEndTime, chordEnd, args.progressionLengthBeats)
      const effectiveDuration = clippedEndTime - absoluteStartTime

      const isNoDuration = effectiveDuration <= 0
      if (isNoDuration) return

      // Map signal to the note in the active chord
      const note = mapSignalToNote({ signal, chord: activeChord, signalRow, chordNotes })
      if (!note) return

      const minVelocity = args.minVelocity ?? 70
      const maxVelocity = args.maxVelocity ?? 80
      const velocity = getRandomBetween({ min: minVelocity, max: maxVelocity })

      const performanceNote: PerformanceNoteT = {
        id: `${activeChord.id}-${signal.id}-${repeatIndex}`,
        note,
        startTime: absoluteStartTime,
        duration: effectiveDuration,
        velocity,
        chordId: activeChord.id,
        signalId: signal.id
      }

      performanceNotes.push(performanceNote)
    })
  }

  const sortedNotes = performanceNotes.sort((noteA, noteB) => noteA.startTime - noteB.startTime)
  return sortedNotes
}
