import { applyPerformanceSafely, voiceProgression } from '$lib/music'
import type { ScaledT } from '@tasteee/scaled/types'
import { getChordToneIndex } from './signalRows'

type GeneratePerformanceArgsT = {
  chords: ProgressionItemT[]
  signals: SignalT[]
  signalRows: SignalRowsT
  patternLengthBeats: number
  progressionLengthBeats: number
  // Restart the pattern at the start of every chord instead of letting
  // it run on through chord changes.
  doesPatternResetOnChordChange?: boolean
  octave: number
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

type ChordSegmentT = {
  item: ProgressionItemT
  start: number
  end: number
}

// Chords and rests laid end to end. Start times come from the
// durations, so this does not depend on startTime being filled in.
const getChordSegments = (chords: ProgressionItemT[]): ChordSegmentT[] => {
  const segments: ChordSegmentT[] = []
  let segmentStart = 0

  for (const item of chords) {
    const segmentEnd = segmentStart + item.durationBeats
    segments.push({ item, start: segmentStart, end: segmentEnd })
    segmentStart = segmentEnd
  }

  return segments
}

// The editor's signals, written as a scaled pattern: each signal plays one
// chord tone (its row) for as long as the signal lasts. Rows the signal is no
// longer in, and signals that start outside the pattern, are left out.
const getPattern = (args: GeneratePerformanceArgsT): ScaledT.PerformancePatternT => {
  const events: ScaledT.PatternEventT[] = []

  for (const signal of args.signals) {
    const signalRow = getSignalRowById({ signalRows: args.signalRows, signalId: signal.id })
    if (!signalRow) continue

    const isSignalOutsidePattern = signal.startTime >= args.patternLengthBeats
    if (isSignalOutsidePattern) continue

    const hasNoDuration = signal.duration <= 0
    if (hasNoDuration) continue

    if (signal.isMuted) continue

    events.push({
      id: signal.id,
      startBeat: signal.startTime,
      durationBeats: signal.duration,
      pitch: { type: 'chordTone', index: getChordToneIndex(signalRow.id), octaveOffset: signal.octaveOffset }
    })
  }

  return { id: 'keylime-pattern', name: 'Keylime pattern', durationBeats: args.patternLengthBeats, events }
}

// 0 - 1 on a signal becomes 1 - 127. Never 0, because a note-on with
// velocity 0 means note-off.
const getMidiVelocityFromSignal = (velocity: number): number => {
  const midiVelocity = Math.round(velocity * 127)
  return Math.max(1, Math.min(127, midiVelocity))
}

// scaled plays every note at a fixed velocity. A signal with its own
// velocity (set in the pattern editor) plays at that velocity. Older
// signals have none: they land somewhere between the project's min and max.
const withSignalVelocity = (args: {
  notes: readonly ScaledT.PerformanceNoteT[]
  signals: SignalT[]
  minVelocity: number
  maxVelocity: number
}): PerformanceNoteT[] => {
  const signalsById = new Map<string, SignalT>()
  for (const signal of args.signals) signalsById.set(signal.id, signal)

  return args.notes.map((note) => {
    const signal = signalsById.get(note.eventId)
    const hasOwnVelocity = signal?.velocity !== undefined
    if (hasOwnVelocity) return { ...note, velocity: getMidiVelocityFromSignal(signal?.velocity as number) }

    const velocity = getRandomBetween({ min: args.minVelocity, max: args.maxVelocity })
    return { ...note, velocity }
  })
}

export const generatePerformance = (args: GeneratePerformanceArgsT): PerformanceNoteT[] => {
  const hasNoChords = args.chords.length === 0
  if (hasNoChords) return []

  const hasNoSignals = args.signals.length === 0
  if (hasNoSignals) return []

  const hasNoPatternLength = args.patternLengthBeats <= 0
  if (hasNoPatternLength) return []

  const hasNoProgressionLength = args.progressionLengthBeats <= 0
  if (hasNoProgressionLength) return []

  const pattern = getPattern(args)
  const hasNoEvents = pattern.events.length === 0
  if (hasNoEvents) return []

  const voicedChords = voiceProgression(args.chords, args.octave)
  const segments = getChordSegments(args.chords)
  const chordSegments = segments.filter((segment) => segment.item.type === 'chord')
  const minVelocity = args.minVelocity ?? 70
  const maxVelocity = args.maxVelocity ?? 80

  const notes: ScaledT.PerformanceNoteT[] = []

  if (args.doesPatternResetOnChordChange) {
    // The pattern starts over at every chord, and runs for as long as the chord lasts.
    chordSegments.forEach((segment, segmentIndex) => {
      const chord = voicedChords.get(segment.item.id)
      if (!chord) return
      const progression = [{ id: segment.item.id, chord, durationBeats: segment.end - segment.start }]
      const clipNotes = applyPerformanceSafely({ progression, performance: pattern })
      for (const note of clipNotes) {
        notes.push({ ...note, id: `${segmentIndex}-${note.id}`, startBeat: note.startBeat + segment.start })
      }
    })
  } else {
    // The pattern runs on through chord changes. Rests are gaps between chords.
    const progression = chordSegments.flatMap((segment) => {
      const chord = voicedChords.get(segment.item.id)
      if (!chord) return []
      return [{ id: segment.item.id, chord, startBeat: segment.start, durationBeats: segment.end - segment.start }]
    })
    notes.push(...applyPerformanceSafely({ progression, performance: pattern }))
  }

  const velocityNotes = withSignalVelocity({ notes, signals: args.signals, minVelocity, maxVelocity })
  return velocityNotes.sort((noteA, noteB) => noteA.startBeat - noteB.startBeat)
}

type GetPatternBeatArgsT = {
  beat: number
  patternLengthBeats: number
  chords: ProgressionItemT[]
  doesPatternResetOnChordChange: boolean
}

// Where in the pattern the playhead is, in beats, for a point in
// the progression. Used to draw the playback cursor.
export const getPatternBeat = (args: GetPatternBeatArgsT): number => {
  if (args.patternLengthBeats <= 0) return 0

  if (!args.doesPatternResetOnChordChange) return args.beat % args.patternLengthBeats

  const segments = getChordSegments(args.chords)
  const currentSegment = segments.find((segment) => args.beat >= segment.start && args.beat < segment.end)
  if (!currentSegment) return args.beat % args.patternLengthBeats

  const beatsIntoChord = args.beat - currentSegment.start
  return beatsIntoChord % args.patternLengthBeats
}
