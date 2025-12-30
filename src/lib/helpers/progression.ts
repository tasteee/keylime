type ResolveChordConflictsArgsT = {
	chords: ChordT[]
}

export const resolveChordConflicts = (args: ResolveChordConflictsArgsT): ChordT[] => {
	// Create deep copies to avoid mutating originals
	const chords = args.chords.map((chord) => ({ ...chord }))
	const newChords: ChordT[] = []
	const chordsToRemove = new Set<string>()

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

			// If chordA has priority, chordB should be modified/removed
			if (aHasPriority) return

			// chordB has priority, so chordA gets chopped up
			const aStartsBeforeB = aStart < bStart
			const aStartsAfterB = aStart >= bStart

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
				const newStartTime = bEnd
				const newDuration = originalEnd - bEnd

				// If the chord would have zero or negative duration, mark for removal
				if (newDuration <= 0) {
					chordsToRemove.add(chordA.id)
				} else {
					chordA.startTime = newStartTime
					chordA.duration = newDuration
				}
			}
		})
	})

	// Filter out chords with zero or negative duration, then add new remainder chords
	const validChords = chords.filter((chord) => {
		const duration = chord.duration ?? 0
		const isMarkedForRemoval = chordsToRemove.has(chord.id)
		return duration > 0 && !isMarkedForRemoval
	})

	return [...validChords, ...newChords]
}

export const getProgressionTotalDuration = (progressionChords: ProgressionChordT[]): number => {
	if (!progressionChords.length) return 0
	return progressionChords.reduce((total, chord) => total + chord.durationBeats, 0)
}

type CalculateStartTimesArgsT = {
	items: ProgressionItemT[]
}

export const calculateStartTimes = (args: CalculateStartTimesArgsT): ProgressionItemT[] => {
	let accumulatedTime = 0
	return args.items.map((item) => {
		const itemWithStartTime = {
			...item,
			startTime: accumulatedTime
		}
		accumulatedTime += item.durationBeats
		return itemWithStartTime
	})
}
