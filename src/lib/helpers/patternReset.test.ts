import { describe, it, expect } from 'vitest'
import { generatePerformance, getPatternBeat } from './performance'

const makeChord = (id: string, symbol: string, startTime: number, durationBeats: number): ProgressionItemT => ({
  id,
  type: 'chord',
  name: symbol,
  symbol,
  rootNote: symbol,
  octaveOffset: 0,
  voicing: 'closed',
  inversion: 0,
  bassNote: symbol,
  startTime,
  durationBeats
})

// Two chords of 3 beats each. A 2 beat pattern does not divide 3 evenly,
// so without a reset the second chord starts mid-pattern.
const chords: ProgressionItemT[] = [makeChord('c1', 'C', 0, 3), makeChord('c2', 'G', 3, 3)]

// One note at the very start of the pattern.
const signals: SignalT[] = [{ id: 's1', startTime: 0, duration: 1, noteIndex: 1, octaveOffset: 0 }]
const signalRows: SignalRowsT = {
  N1: { id: 'N1', label: 'N1', totalIndex: 0, index: 0, octave: 0, signalIds: ['s1'] }
}

const baseArgs = { chords, signals, signalRows, patternLengthBeats: 2, progressionLengthBeats: 6, octave: '3' }

describe('pattern reset on chord change', () => {
  it('keeps one running pattern across chords by default', () => {
    const performance = generatePerformance(baseArgs)
    const startTimes = performance.map((note) => note.startTime)
    expect(startTimes).toEqual([0, 2, 4])
  })

  it('starts the pattern over at the start of each chord', () => {
    const performance = generatePerformance({ ...baseArgs, doesPatternResetOnChordChange: true })
    const startTimes = performance.map((note) => note.startTime)
    expect(startTimes).toEqual([0, 2, 3, 5])
  })

  it('plays the note of the chord that is sounding', () => {
    const performance = generatePerformance({ ...baseArgs, doesPatternResetOnChordChange: true })
    const chordIds = performance.map((note) => note.chordId)
    expect(chordIds).toEqual(['c1', 'c1', 'c2', 'c2'])
  })

  it('cuts notes off at the end of the chord', () => {
    const longSignals: SignalT[] = [{ id: 's1', startTime: 0, duration: 2, noteIndex: 1, octaveOffset: 0 }]
    const performance = generatePerformance({ ...baseArgs, signals: longSignals, doesPatternResetOnChordChange: true })
    const secondRepeat = performance.find((note) => note.startTime === 2)
    expect(secondRepeat?.duration).toBe(1)
  })

  it('leaves rests silent and still resets after them', () => {
    const withRest: ProgressionItemT[] = [
      makeChord('c1', 'C', 0, 2),
      { id: 'r1', type: 'rest', symbol: 'REST', rootNote: 'REST', startTime: 2, durationBeats: 1 },
      makeChord('c2', 'G', 3, 2)
    ]
    const performance = generatePerformance({
      ...baseArgs,
      chords: withRest,
      progressionLengthBeats: 5,
      doesPatternResetOnChordChange: true
    })
    const startTimes = performance.map((note) => note.startTime)
    expect(startTimes).toEqual([0, 3])
  })
})

describe('getPatternBeat', () => {
  const args = { patternLengthBeats: 2, chords, doesPatternResetOnChordChange: false }

  it('wraps around the pattern length when not resetting', () => {
    expect(getPatternBeat({ ...args, beat: 4.5 })).toBe(0.5)
  })

  it('counts from the start of the current chord when resetting', () => {
    expect(getPatternBeat({ ...args, doesPatternResetOnChordChange: true, beat: 3.5 })).toBe(0.5)
    expect(getPatternBeat({ ...args, doesPatternResetOnChordChange: true, beat: 2.5 })).toBe(0.5)
  })
})
