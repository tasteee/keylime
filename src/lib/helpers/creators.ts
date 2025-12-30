import { startClamp, endClamp, durationClamp } from './clamps'

export const createSignal = (overrides: Partial<SignalT> = {}): SignalT => {
	const id = overrides.id || crypto.randomUUID()
	const startTime = startClamp(overrides.startTime || 0)
	const duration = endClamp(overrides.duration || 0.25) // Default to 1/4 beat

	if (duration < 0.0625) console.error('createSignal: duration must be at least 0.0625 beats (1/16 beat)')
	if (startTime < 0) console.error('createSignal: startTime must be 0 or greater')

	return {
		id,
		startTime,
		duration,
		octaveOffset: overrides.octaveOffset || 0,
		noteIndex: overrides.noteIndex || 0
	}
}
