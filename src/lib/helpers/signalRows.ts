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

export const signalRowHelpers = {
  getIdIndex: getSignalRowIdIndex,
  getIdOctave: getSignalRowIdOctave
}

export const resolveSignalConflicts = (signalRow: SignalRowT, signals: SignalT[]) => {
  const ids = signalRow.signalIds
  const signalsInRow = ids.map((id) => signals.find((signal) => signal.id === id)) as SignalT[]
  const newSignals: SignalT[] = []

  signalsInRow.forEach((signalA) => {
    signalsInRow.forEach((signalB) => {
      if (signalA.id === signalB.id) return

      const aStart = signalA.startTime
      const aEnd = signalA.startTime + signalA.duration
      const bStart = signalB.startTime
      const bEnd = signalB.startTime + signalB.duration

      const hasOverlap = aStart < bEnd && bStart < aEnd
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
