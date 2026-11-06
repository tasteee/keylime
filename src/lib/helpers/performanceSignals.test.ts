import { describe, it, expect } from 'vitest'
import { generatePerformance } from './performance'

const chords: ProgressionItemT[] = [
  {
    id: 'c1',
    type: 'chord',
    symbol: 'C',
    octaveOffset: 0,
    voicing: 'closed',
    inversion: 0,
    startTime: 0,
    durationBeats: 4
  }
]

const signalRows: SignalRowsT = {
  N1: { id: 'N1', label: 'N1', totalIndex: 16, index: 7, octave: 0, signalIds: ['loud', 'quiet', 'off', 'old'] }
}

const baseArgs = { chords, signalRows, patternLengthBeats: 4, progressionLengthBeats: 4, octave: 3, minVelocity: 70, maxVelocity: 80 }

const makeSignal = (id: string, startTime: number, overrides: Partial<SignalT> = {}): SignalT => ({
  id,
  startTime,
  duration: 0.5,
  noteIndex: 0,
  octaveOffset: 0,
  ...overrides
})

describe('signals made in the pattern editor', () => {
  it('plays a signal at its own velocity', () => {
    const signals = [makeSignal('loud', 0, { velocity: 1 }), makeSignal('quiet', 1, { velocity: 0.5 })]
    const notes = generatePerformance({ ...baseArgs, signals })
    expect(notes.map((note) => note.velocity)).toEqual([127, 64])
  })

  it('never plays a velocity of zero', () => {
    const signals = [makeSignal('loud', 0, { velocity: 0 })]
    const notes = generatePerformance({ ...baseArgs, signals })
    expect(notes[0].velocity).toBe(1)
  })

  it('leaves a muted signal out', () => {
    const signals = [makeSignal('loud', 0), makeSignal('off', 1, { isMuted: true })]
    const notes = generatePerformance({ ...baseArgs, signals })
    expect(notes).toHaveLength(1)
    expect(notes[0].startBeat).toBe(0)
  })

  it('gives a signal with no velocity one between the project min and max', () => {
    const signals = [makeSignal('old', 0)]
    const notes = generatePerformance({ ...baseArgs, signals })
    expect(notes[0].velocity).toBeGreaterThanOrEqual(70)
    expect(notes[0].velocity).toBeLessThanOrEqual(80)
  })
})
