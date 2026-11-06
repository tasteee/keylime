// Grid steps in beats, from coarsest to finest.
const GRID_STEPS_BEATS = [1, 0.5, 0.25, 0.125]

// A grid cell never gets narrower than this many pixels.
const MIN_GRID_CELL_PIXELS = 20

type GetGridStepBeatsOptionsT = {
	pixelsPerBeat: number
}

// Zooming in lets the grid get finer. Returns the finest step
// whose cell is still wide enough to see and aim at.
export const getGridStepBeats = (options: GetGridStepBeatsOptionsT): number => {
	let finestStepBeats = GRID_STEPS_BEATS[0]

	for (const stepBeats of GRID_STEPS_BEATS) {
		const cellPixels = stepBeats * options.pixelsPerBeat
		const isWideEnough = cellPixels >= MIN_GRID_CELL_PIXELS
		if (isWideEnough) finestStepBeats = stepBeats
	}

	return finestStepBeats
}

type SnapBeatToGridOptionsT = {
	beat: number
	stepBeats: number
}

export const snapBeatToGrid = (options: SnapBeatToGridOptionsT): number => {
	const stepCount = Math.round(options.beat / options.stepBeats)
	return stepCount * options.stepBeats
}
