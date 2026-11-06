import { describe, expect, it } from 'vitest'
import { getGridStepBeats, snapBeatToGrid } from './progressionGrid'

describe('getGridStepBeats', () => {
	it('uses a half beat at the lowest zoom', () => {
		expect(getGridStepBeats({ pixelsPerBeat: 40 })).toBe(0.5)
	})

	it('gets finer as the view zooms in', () => {
		expect(getGridStepBeats({ pixelsPerBeat: 88 })).toBe(0.25)
		expect(getGridStepBeats({ pixelsPerBeat: 160 })).toBe(0.125)
	})

	it('falls back to a whole beat when zoomed far out', () => {
		expect(getGridStepBeats({ pixelsPerBeat: 10 })).toBe(1)
	})
})

describe('snapBeatToGrid', () => {
	it('snaps to the nearest step', () => {
		expect(snapBeatToGrid({ beat: 2.4, stepBeats: 0.5 })).toBe(2.5)
		expect(snapBeatToGrid({ beat: 2.1, stepBeats: 0.25 })).toBe(2)
	})
})
