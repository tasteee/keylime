import { describe, it, expect } from 'vitest'
import { CURRENT_DATA_VERSION, migrateProject } from './migrateProject'

const oldChord = (overrides: Record<string, unknown>) => ({
  id: 'c1',
  type: 'chord',
  name: 'Dm',
  symbol: 'Dm',
  rootNote: 'D',
  octaveOffset: 0,
  voicing: 'closed',
  inversion: 0,
  bassNote: 'D3',
  startTime: 0,
  durationBeats: 4,
  ...overrides
})

const oldProject = (progressionChords: unknown[]) =>
  ({ id: 'p1', octave: '3', dataVersion: 1, progressionChords, chordSymbols: [] }) as unknown as ProjectT

describe('migrateProject', () => {
  it('turns old chords into the scaled shape', () => {
    const project = migrateProject(oldProject([oldChord({})]))
    expect(project.dataVersion).toBe(CURRENT_DATA_VERSION)
    expect(project.octave).toBe(3)
    expect(project.progressionChords[0]).toEqual({
      id: 'c1',
      type: 'chord',
      symbol: 'Dmin',
      octaveOffset: 0,
      // closed was the old default, so the chord now follows the project
      voicing: null,
      inversion: 0,
      startTime: 0,
      durationBeats: 4
    })
    expect(project.voicing).toBe('closed')
    expect(project.chordSymbols).toEqual(['Dmin'])
  })

  it('maps the tonal dictionary voicings to dynamic', () => {
    const project = migrateProject(oldProject([oldChord({ voicing: 'tonal-lefthand' })]))
    expect((project.progressionChords[0] as ProgressionChordT).voicing).toBe('dynamic')
  })

  it('falls back to the project voicing when the chord has too few notes for the voicing', () => {
    const project = migrateProject(oldProject([oldChord({ symbol: 'C', name: 'C', voicing: 'drop2' })]))
    expect((project.progressionChords[0] as ProgressionChordT).voicing).toBe(null)
  })

  it('keeps drop voicings on chords that have enough notes', () => {
    const project = migrateProject(oldProject([oldChord({ symbol: 'Cmaj7', name: 'Cmaj7', voicing: 'drop2' })]))
    expect((project.progressionChords[0] as ProgressionChordT).voicing).toBe('drop2')
  })

  it('turns a chord scaled does not know into a rest of the same length', () => {
    const project = migrateProject(oldProject([oldChord({ symbol: 'Xyz', name: 'Xyz', durationBeats: 2, startTime: 4 })]))
    expect(project.progressionChords[0]).toEqual({ id: 'c1', type: 'rest', symbol: 'REST', startTime: 4, durationBeats: 2 })
  })

  it('strips rest leftovers and leaves current projects alone', () => {
    const migrated = migrateProject(oldProject([{ id: 'r1', type: 'rest', symbol: 'REST', rootNote: 'REST', startTime: 0, durationBeats: 1 }]))
    expect(migrated.progressionChords[0]).toEqual({ id: 'r1', type: 'rest', symbol: 'REST', startTime: 0, durationBeats: 1 })
    expect(migrateProject(migrated)).toBe(migrated)
  })
})

const scaledProject = (progressionChords: unknown[]) =>
  ({ id: 'p2', octave: 3, dataVersion: 2, progressionChords, chordSymbols: ['Dmin'] }) as unknown as ProjectT

const scaledChord = (voicing: string) => ({
  id: 'c1',
  type: 'chord',
  symbol: 'Dmin',
  octaveOffset: 0,
  voicing,
  inversion: 0,
  startTime: 0,
  durationBeats: 4
})

describe('migrateProject from version 2', () => {
  it('lets chords on the old default follow the project voicing', () => {
    const project = migrateProject(scaledProject([scaledChord('closed')]))
    expect(project.dataVersion).toBe(CURRENT_DATA_VERSION)
    expect((project.progressionChords[0] as ProgressionChordT).voicing).toBe(null)
    expect(project.voicing).toBe('closed')
  })

  it('keeps a voicing someone chose', () => {
    const project = migrateProject(scaledProject([scaledChord('open')]))
    expect((project.progressionChords[0] as ProgressionChordT).voicing).toBe('open')
  })
})
