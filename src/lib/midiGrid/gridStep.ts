import { GRID_STEPS_TICKS, MIN_GRID_STEP_PIXELS } from './constants'

type GetGridStepTicksOptionsT = {
	pxPerTick: number
}

// Zooming in lets the grid get finer. Returns the finest step
// that is still wide enough to see and aim at.
export const getGridStepTicks = (options: GetGridStepTicksOptionsT): number => {
	let finestStepTicks = GRID_STEPS_TICKS[0]

	for (const stepTicks of GRID_STEPS_TICKS) {
		const stepPixels = stepTicks * options.pxPerTick
		const isWideEnough = stepPixels >= MIN_GRID_STEP_PIXELS
		if (isWideEnough) finestStepTicks = stepTicks
	}

	return finestStepTicks
}
