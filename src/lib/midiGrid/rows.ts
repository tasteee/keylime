import { SIGNAL_IDS } from '$lib/constants/signalRows'
import { ROW_COUNT } from './constants'

// SIGNAL_IDS runs from the top row down: N8+2 ... N1-2.
// A pitch is the row counted from the bottom, so pitch rises as notes go up.
export const getRowIdForPitch = (pitch: number): string => {
	const topDownIndex = ROW_COUNT - 1 - pitch
	return SIGNAL_IDS[topDownIndex]
}

export const getPitchForRowId = (rowId: string): number | null => {
	const topDownIndex = SIGNAL_IDS.indexOf(rowId)
	const isUnknownRow = topDownIndex === -1
	if (isUnknownRow) return null
	return ROW_COUNT - 1 - topDownIndex
}

// Row 0 is the top of the grid.
export const getDisplayRowOfPitch = (pitch: number): number => {
	return ROW_COUNT - 1 - pitch
}

export const clampPitch = (pitch: number): number => {
	const roundedPitch = Math.round(pitch)
	if (roundedPitch < 0) return 0
	if (roundedPitch > ROW_COUNT - 1) return ROW_COUNT - 1
	return roundedPitch
}

export const getPitchAtDisplayRow = (displayRow: number): number => {
	const wholeRow = Math.floor(displayRow)
	return clampPitch(ROW_COUNT - 1 - wholeRow)
}
