import { applyPerformanceSafely } from '$lib/music'
import { ROWS_PER_BAND, SIGNAL_IDS } from '$lib/constants/signalRows'

// Match any digits that follow "N" in a signalRow id.
// i.e "N1" -> 1, "N5-1" -> 5, "N3+2" -> 3, "N0" -> 0
export const getSignalRowIdIndex = (signalId: string): number => {
  const match = signalId.match(/^[^N]*N(\d+)/) as RegExpExecArray
  return parseInt(match[1], 10)
}

// Match any digits that follow "+" or "-" in a signalRow id.
// If there is no "+" or "-", the octave is 0.
// i.e "N5-1" -> -1, "N3+2" -> +2, "N0" -> 0
export const getSignalRowIdOctave = (signalId: string): number => {
  const match = signalId.match(/[+-]\d+/)
  return match ? parseInt(match[0], 10) : 0
}

// Which note of the chord a row plays. N1 is index 0, N4 is index 3, and each
// band ("+1", "-1") holds ROWS_PER_BAND rows and continues the ladder where the
// previous band stopped, so pitch always ascends from the bottom row to the top.
// The index may be negative or larger than the chord: scaled wraps it through
// the chord's notes, moving an octave each time around.
export const getChordToneIndex = (signalRowId: string): number => {
  const noteIndex = getSignalRowIdIndex(signalRowId)
  const bandOffset = getSignalRowIdOctave(signalRowId)
  return noteIndex - 1 + bandOffset * ROWS_PER_BAND
}

// The MIDI note every signal row plays against one voiced chord.
// scaled does the resolving: one note per row, all in a one-beat clip.
// Rows that fall outside MIDI range for this chord have no entry.
export const getSignalRowMidiNotes = (
  voicedChord: import('@tasteee/scaled/types').ScaledT.ChordT,
  signalRowIds: readonly string[] = SIGNAL_IDS
): Map<string, number> => {
  const events = signalRowIds.map((signalRowId) => ({
    id: signalRowId,
    startBeat: 0,
    durationBeats: 1,
    pitch: { type: 'chordTone' as const, index: getChordToneIndex(signalRowId) }
  }))
  const performance = { id: 'signalRows', name: 'Signal rows', durationBeats: 1, events }
  const progression = [{ id: 'row-chord', chord: voicedChord, durationBeats: 1 }]
  const notes = applyPerformanceSafely({ progression, performance })
  const midiNotesByRow = new Map<string, number>()
  notes.forEach((note) => midiNotesByRow.set(note.eventId, note.midiNote))
  return midiNotesByRow
}

export const signalRowHelpers = {
  getIdIndex: getSignalRowIdIndex,
  getIdOctave: getSignalRowIdOctave,
  getChordToneIndex
}

export const resolveSignalConflicts = (signalRow: SignalRowT, signals: SignalT[]) => {
  const ids = signalRow.signalIds
  const signalsInRow = ids.map((id) => signals.find((signal) => signal.id === id)) as SignalT[]
  const newSignals: SignalT[] = []

  const OVERLAP_TOLERANCE = 0.001 // Small tolerance for floating point precision

  signalsInRow.forEach((signalA) => {
    signalsInRow.forEach((signalB) => {
      if (signalA.id === signalB.id) return

      const aStart = signalA.startTime
      const aEnd = signalA.startTime + signalA.duration
      const bStart = signalB.startTime
      const bEnd = signalB.startTime + signalB.duration

      // Signals are only considered overlapping if they truly overlap beyond tolerance
      // This prevents adjacent signals from being treated as conflicts
      const hasOverlap = (aStart + OVERLAP_TOLERANCE < bEnd) && (bStart + OVERLAP_TOLERANCE < aEnd)
      if (!hasOverlap) return

      // Determine which signal has priority based on modifiedTime
      const aModifiedTime = signalA.modifiedTime ?? 0
      const bModifiedTime = signalB.modifiedTime ?? 0
      const aHasPriority = aModifiedTime > bModifiedTime
      const aStartsBeforeB = aStart < bStart
      const aStartsAfterB = aStart >= bStart
      // If signalA has priority, signalB should be modified/removed
      if (aHasPriority) return

      // signalB has priority, so signalA gets chopped up
      if (aStartsBeforeB) {
        const originalEnd = aEnd
        signalA.duration = bStart - aStart

        const hasRemainder = originalEnd > bEnd
        if (hasRemainder) {
          const newSignal: SignalT = {
            ...signalA,
            id: `${signalA.id}-${Date.now()}`,
            startTime: bEnd,
            duration: originalEnd - bEnd,
            modifiedTime: signalA.modifiedTime
          }

          newSignals.push(newSignal)
        }
      }

      if (aStartsAfterB) {
        const originalEnd = aEnd
        signalA.startTime = bEnd
        signalA.duration = originalEnd - bEnd
      }
    })
  })

  return newSignals
}
