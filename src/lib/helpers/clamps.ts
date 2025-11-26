import { numbers } from './numbers'

// 16 bars × 4 beats per bar = 64 beats total
const maxBeats = 64
export const startClamp = numbers.createClamp({ min: 0, max: maxBeats - 0.0625 }) // Allow down to 1/16 beat before end
export const endClamp = numbers.createClamp({ min: 0.0625, max: maxBeats }) // Min duration 1/16 beat
export const durationClamp = numbers.createClamp({ min: 0.0625, max: maxBeats }) // Min duration 1/16 beat
