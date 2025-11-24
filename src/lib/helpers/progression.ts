type ResolveChordConflictsArgsT = {
  chords: ChordT[]
}

export const resolveChordConflicts = (args: ResolveChordConflictsArgsT) => {
  const chords = args.chords
  const newChords: ChordT[] = []

  chords.forEach((chordA) => {
    chords.forEach((chordB) => {
      if (chordA.id === chordB.id) return

      const aStart = chordA.startTime ?? 0
      const aEnd = aStart + (chordA.duration ?? 0)
      const bStart = chordB.startTime ?? 0
      const bEnd = bStart + (chordB.duration ?? 0)

      const hasOverlap = aStart < bEnd && bStart < aEnd
      if (!hasOverlap) return

      // Determine which chord has priority based on modifiedTime
      const aModifiedTime = chordA.modifiedTime ?? 0
      const bModifiedTime = chordB.modifiedTime ?? 0
      const aHasPriority = aModifiedTime > bModifiedTime
      const aStartsBeforeB = aStart < bStart
      const aStartsAfterB = aStart >= bStart

      // If chordA has priority, chordB should be modified/removed
      if (aHasPriority) return

      // chordB has priority, so chordA gets chopped up
      if (aStartsBeforeB) {
        const originalEnd = aEnd
        chordA.duration = bStart - aStart

        const hasRemainder = originalEnd > bEnd
        if (hasRemainder) {
          const newChord: ChordT = {
            ...chordA,
            id: `${chordA.id}-${Date.now()}`,
            startTime: bEnd,
            duration: originalEnd - bEnd,
            modifiedTime: chordA.modifiedTime
          }

          newChords.push(newChord)
        }
      }

      if (aStartsAfterB) {
        const originalEnd = aEnd
        chordA.startTime = bEnd
        chordA.duration = originalEnd - bEnd
      }
    })
  })

  return newChords
}
