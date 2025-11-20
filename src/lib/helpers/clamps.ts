import { numbers } from './numbers'

// 16 bars × 4 beats × 4 cells per beat = 256 cells total
// 256 cells × 4 ticks per cell = 1024 ticks
const maxTicks = 1024
export const startClamp = numbers.createClamp({ min: 0, max: maxTicks - 1 })
export const endClamp = numbers.createClamp({ min: 1, max: maxTicks })
export const durationClamp = numbers.createClamp({ min: 1, max: maxTicks })
