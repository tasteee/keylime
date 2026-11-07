// Names one undo step in a few words, e.g. "Delete C#min" or
// "Move 3 notes", by comparing the project before and after.
// Pure, so the toast text never depends on who made the edit.

export type HistorySnapshotT = {
	patternSignals: SignalT[]
	patternSignalRows: SignalRowsT
	patternDurationBars: number
	progressionChords: ProgressionItemT[]
}

type ItemChangeT = 'resize' | 'reshape' | 'change' | null

type JsonValueT = string | number | boolean | null | undefined | JsonValueT[] | { [key: string]: JsonValueT }

// Same data in a different key order must compare equal.
const sortKeysDeep = (value: JsonValueT): JsonValueT => {
	const isArray = Array.isArray(value)
	if (isArray) return value.map((entry) => sortKeysDeep(entry))
	const isObject = value !== null && typeof value === 'object'
	if (!isObject) return value

	const sortedObject: { [key: string]: JsonValueT } = {}
	const sortedKeys = Object.keys(value).sort()
	for (const key of sortedKeys) {
		sortedObject[key] = sortKeysDeep(value[key])
	}
	return sortedObject
}

const sortById = <ItemT extends { id: string }>(items: ItemT[]): ItemT[] => {
	return [...items].sort((first, second) => first.id.localeCompare(second.id))
}

// Note order means nothing; chord order does. Signal row
// lists are sorted too, since only membership matters.
const createSnapshotKey = (snapshot: HistorySnapshotT): string => {
	const sortedRows: SignalRowsT = {}
	for (const [rowId, row] of Object.entries(snapshot.patternSignalRows ?? {})) {
		const sortedSignalIds = [...row.signalIds].sort()
		sortedRows[rowId] = { ...row, signalIds: sortedSignalIds }
	}

	const canonicalSnapshot = {
		patternSignals: sortById(snapshot.patternSignals),
		patternSignalRows: sortedRows,
		patternDurationBars: snapshot.patternDurationBars,
		progressionChords: snapshot.progressionChords
	}

	return JSON.stringify(sortKeysDeep(canonicalSnapshot as unknown as JsonValueT))
}

export const checkIsSameHistorySnapshot = (first: HistorySnapshotT, second: HistorySnapshotT): boolean => {
	return createSnapshotKey(first) === createSnapshotKey(second)
}

const getItemLabel = (item: ProgressionItemT): string => {
	const isRest = item.type === 'rest'
	if (isRest) return 'rest'
	return item.symbol
}

const countLabel = (count: number, singular: string, plural: string): string => {
	const isSingle = count === 1
	const noun = isSingle ? singular : plural
	return `${count} ${noun}`
}

const getMissingItems = <ItemT extends { id: string }>(source: ItemT[], other: ItemT[]): ItemT[] => {
	const otherIds = new Set(other.map((item) => item.id))
	return source.filter((item) => !otherIds.has(item.id))
}

const getItemChange = (before: ProgressionItemT, after: ProgressionItemT): ItemChangeT => {
	const hasNewSymbol = before.symbol !== after.symbol
	if (hasNewSymbol) return 'change'
	const hasNewDuration = before.durationBeats !== after.durationBeats
	if (hasNewDuration) return 'resize'
	const isBothChords = before.type === 'chord' && after.type === 'chord'
	if (!isBothChords) return null
	const hasNewOctave = before.octaveOffset !== after.octaveOffset
	const hasNewInversion = before.inversion !== after.inversion
	const hasNewVoicing = before.voicing !== after.voicing
	const hasNewShape = hasNewOctave || hasNewInversion || hasNewVoicing
	if (hasNewShape) return 'reshape'
	return null
}

const ITEM_CHANGE_VERBS: Record<'resize' | 'reshape' | 'change', string> = {
	resize: 'Resize',
	reshape: 'Reshape',
	change: 'Change'
}

const describeAddedItems = (items: ProgressionItemT[]): string => {
	const isSingle = items.length === 1
	if (isSingle) return `Add ${getItemLabel(items[0])}`
	return `Add ${countLabel(items.length, 'chord', 'chords')}`
}

const describeRemovedItems = (items: ProgressionItemT[]): string => {
	const isSingle = items.length === 1
	if (isSingle) return `Delete ${getItemLabel(items[0])}`
	return `Delete ${countLabel(items.length, 'chord', 'chords')}`
}

const checkIsReordered = (before: ProgressionItemT[], after: ProgressionItemT[]): boolean => {
	const beforeOrder = before.map((item) => item.id).join(',')
	const afterOrder = after.map((item) => item.id).join(',')
	return beforeOrder !== afterOrder
}

const describeChangedItem = (before: ProgressionItemT[], after: ProgressionItemT[]): string | null => {
	for (const afterItem of after) {
		const beforeItem = before.find((item) => item.id === afterItem.id)
		if (!beforeItem) continue
		const itemChange = getItemChange(beforeItem, afterItem)
		if (!itemChange) continue
		return `${ITEM_CHANGE_VERBS[itemChange]} ${getItemLabel(afterItem)}`
	}
	return null
}

export const describeProgressionChange = (before: ProgressionItemT[], after: ProgressionItemT[]): string | null => {
	const addedItems = getMissingItems(after, before)
	const removedItems = getMissingItems(before, after)
	const hasAdded = addedItems.length > 0
	const hasRemoved = removedItems.length > 0

	if (hasAdded && !hasRemoved) return describeAddedItems(addedItems)
	if (hasRemoved && !hasAdded) return describeRemovedItems(removedItems)
	if (hasAdded && hasRemoved) return 'Edit progression'

	const changedItemDescription = describeChangedItem(before, after)
	if (changedItemDescription) return changedItemDescription

	const isReordered = checkIsReordered(before, after)
	if (isReordered) return 'Reorder chords'
	return null
}

const checkIsSignalMoved = (before: SignalT, after: SignalT): boolean => {
	const hasNewStart = before.startTime !== after.startTime
	const hasNewRow = before.noteIndex !== after.noteIndex
	const hasNewOctave = before.octaveOffset !== after.octaveOffset
	return hasNewStart || hasNewRow || hasNewOctave
}

type SignalChangeCountsT = {
	moved: number
	resized: number
	velocity: number
	muted: number
}

const countSignalChanges = (before: SignalT[], after: SignalT[]): SignalChangeCountsT => {
	const counts: SignalChangeCountsT = { moved: 0, resized: 0, velocity: 0, muted: 0 }

	for (const afterSignal of after) {
		const beforeSignal = before.find((signal) => signal.id === afterSignal.id)
		if (!beforeSignal) continue
		if (checkIsSignalMoved(beforeSignal, afterSignal)) counts.moved += 1
		if (beforeSignal.duration !== afterSignal.duration) counts.resized += 1
		if (beforeSignal.velocity !== afterSignal.velocity) counts.velocity += 1
		if (Boolean(beforeSignal.isMuted) !== Boolean(afterSignal.isMuted)) counts.muted += 1
	}

	return counts
}

const describeSignalChanges = (counts: SignalChangeCountsT): string | null => {
	const hasMoved = counts.moved > 0
	if (hasMoved) return `Move ${countLabel(counts.moved, 'note', 'notes')}`
	const hasResized = counts.resized > 0
	if (hasResized) return `Resize ${countLabel(counts.resized, 'note', 'notes')}`
	const hasVelocity = counts.velocity > 0
	if (hasVelocity) return `Change velocity of ${countLabel(counts.velocity, 'note', 'notes')}`
	const hasMuted = counts.muted > 0
	if (hasMuted) return `Mute or unmute ${countLabel(counts.muted, 'note', 'notes')}`
	return null
}

export const describePatternChange = (before: HistorySnapshotT, after: HistorySnapshotT): string | null => {
	const addedSignals = getMissingItems(after.patternSignals, before.patternSignals)
	const removedSignals = getMissingItems(before.patternSignals, after.patternSignals)
	const hasAdded = addedSignals.length > 0
	const hasRemoved = removedSignals.length > 0

	if (hasAdded && !hasRemoved) return `Add ${countLabel(addedSignals.length, 'note', 'notes')}`
	if (hasRemoved && !hasAdded) return `Delete ${countLabel(removedSignals.length, 'note', 'notes')}`
	if (hasAdded && hasRemoved) return 'Replace pattern'

	const signalCounts = countSignalChanges(before.patternSignals, after.patternSignals)
	const signalDescription = describeSignalChanges(signalCounts)
	if (signalDescription) return signalDescription

	const hasNewLength = before.patternDurationBars !== after.patternDurationBars
	if (hasNewLength) return 'Change pattern length'

	const beforeRowsKey = createSnapshotKey({ ...before, patternSignals: [], progressionChords: [] })
	const afterRowsKey = createSnapshotKey({ ...after, patternSignals: [], progressionChords: [] })
	const hasNewRows = beforeRowsKey !== afterRowsKey
	if (hasNewRows) return 'Change pattern rows'
	return null
}

// The progression wins when one step touched both.
export const describeHistoryChange = (before: HistorySnapshotT, after: HistorySnapshotT): string => {
	const progressionDescription = describeProgressionChange(before.progressionChords, after.progressionChords)
	if (progressionDescription) return progressionDescription
	const patternDescription = describePatternChange(before, after)
	if (patternDescription) return patternDescription
	return 'Edit pattern'
}
