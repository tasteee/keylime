import { startClamp, endClamp, durationClamp } from './clamps'

export const createSignal = (overrides: Partial<SignalT> = {}): SignalT => {
  const id = overrides.id || crypto.randomUUID()
  const startTime = startClamp(overrides.startTime || 0)
  const duration = endClamp(overrides.duration || 0)

  if (duration < 1) console.error('createSignal: duration must be at least 1')
  if (startTime < 0) console.error('createSignal: startTime must be 0 or greater')

  return {
    id,
    startTime,
    duration,
    octaveOffset: overrides.octaveOffset || 0,
    velocity: overrides.velocity,
    minVelocity: overrides.minVelocity || 65,
    maxVelocity: overrides.maxVelocity || 85,
    noteIndex: overrides.noteIndex || 0
  }
}
