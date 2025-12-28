import { describe, it, expect, beforeEach } from 'vitest'
import { generatePerformance } from './performance'
import { chordToNotes } from './chordToNotes'
import { getNoteFromSignalRow } from './signalRows'

describe('Chord-Relative MIDI Pattern Engine', () => {
  /**
   * SPEC REQUIREMENT: Harmonic Timeline (Progression)
   * A progression is a piecewise-constant harmonic function over musical time (beats).
   * At any given beat, exactly one chord is authoritative.
   */
  describe('Harmonic Timeline (Progression)', () => {
    it('should map signals to the correct chord at their start time', () => {
      const progression: ProgressionItemT[] = [
        {
          id: 'chord-1',
          type: 'chord',
          name: 'C',
          symbol: 'C',
          rootNote: 'C',
          octaveOffset: 0,
          voicing: 'closed',
          inversion: 0,
          bassNote: 'C',
          startTime: 0,
          durationBeats: 4
        },
        {
          id: 'chord-2',
          type: 'chord',
          name: 'G',
          symbol: 'G',
          rootNote: 'G',
          octaveOffset: 0,
          voicing: 'closed',
          inversion: 0,
          bassNote: 'G',
          startTime: 4,
          durationBeats: 4
        }
      ]

      const signals: SignalT[] = [
        { id: 'sig-1', startTime: 0, duration: 1, noteIndex: 1, octaveOffset: 0 }, // C chord
        { id: 'sig-2', startTime: 4, duration: 1, noteIndex: 1, octaveOffset: 0 } // G chord
      ]

      const signalRows: SignalRowsT = {
        N1: { id: 'N1', label: 'N1', totalIndex: 0, index: 0, octave: 0, signalIds: ['sig-1', 'sig-2'] }
      }

      const performance = generatePerformance({
        chords: progression,
        signals,
        signalRows,
        patternLengthBeats: 8,
        progressionLengthBeats: 8,
        octave: '3'
      })

      expect(performance).toHaveLength(2)
      expect(performance[0].chordId).toBe('chord-1')
      expect(performance[1].chordId).toBe('chord-2')
    })

    it('should handle chord boundaries without truncating signals', () => {
      const progression: ProgressionItemT[] = [
        {
          id: 'chord-1',
          type: 'chord',
          name: 'C',
          symbol: 'C',
          rootNote: 'C',
          octaveOffset: 0,
          voicing: 'closed',
          inversion: 0,
          bassNote: 'C',
          startTime: 0,
          durationBeats: 2
        },
        {
          id: 'chord-2',
          type: 'chord',
          name: 'G',
          symbol: 'G',
          rootNote: 'G',
          octaveOffset: 0,
          voicing: 'closed',
          inversion: 0,
          bassNote: 'G',
          startTime: 2,
          durationBeats: 2
        }
      ]

      // Signal that starts in chord-1 but extends past its boundary
      const signals: SignalT[] = [{ id: 'sig-1', startTime: 1.5, duration: 1.0, noteIndex: 1, octaveOffset: 0 }]

      const signalRows: SignalRowsT = {
        N1: { id: 'N1', label: 'N1', totalIndex: 0, index: 0, octave: 0, signalIds: ['sig-1'] }
      }

      const performance = generatePerformance({
        chords: progression,
        signals,
        signalRows,
        patternLengthBeats: 4,
        progressionLengthBeats: 4,
        octave: '3'
      })

      // Signal should be clipped to chord boundary (1.5 + 1.0 = 2.5, but chord ends at 2.0)
      expect(performance).toHaveLength(1)
      expect(performance[0].startTime).toBe(1.5)
      expect(performance[0].duration).toBe(0.5) // Clipped to chord boundary
      expect(performance[0].chordId).toBe('chord-1')
    })
  })

  /**
   * SPEC REQUIREMENT: Voicing Realization
   * Each chord is expanded into an ordered pitch list where order reflects
   * the actual voice layout (post-voicing, post-inversion).
   */
  describe('Voicing Realization', () => {
    it('should produce ordered pitch lists from chords', () => {
      const chord: ChordT = {
        id: 'c-maj',
        name: 'C',
        symbol: 'C',
        rootNote: 'C',
        octaveOffset: 0,
        voicing: 'closed',
        inversion: 0,
        bassNote: 'C'
      }

      const notes = chordToNotes({ chord, rootOctave: '3' })

      expect(notes).toEqual(['C3', 'E3', 'G3'])
      expect(notes.length).toBe(3)
    })

    it('should apply octave offsets to all voices', () => {
      const chord: ChordT = {
        id: 'c-maj',
        name: 'C',
        symbol: 'C',
        rootNote: 'C',
        octaveOffset: 1,
        voicing: 'closed',
        inversion: 0,
        bassNote: 'C'
      }

      const notes = chordToNotes({ chord, rootOctave: '3' })

      expect(notes).toEqual(['C4', 'E4', 'G4'])
    })

    it('should apply inversions correctly', () => {
      const chord: ChordT = {
        id: 'c-maj',
        name: 'C',
        symbol: 'C',
        rootNote: 'C',
        octaveOffset: 0,
        voicing: 'closed',
        inversion: 1,
        bassNote: '' // Empty to allow inversion to determine bass note
      }

      const notes = chordToNotes({ chord, rootOctave: '3' })

      // First inversion rotates: C3, E3, G3 → E3, G3, C4
      // The bass note should now be E
      expect(notes[0]).toContain('E')
      expect(notes.length).toBe(3)
    })
  })

  /**
   * SPEC REQUIREMENT: Degree Indexing Semantics
   * - Indexing is 1-based (N1 = first voice)
   * - If degreeIndex > |V|, indexing wraps modulo |V|
   * - Each wrap increments octave by +1
   * - Explicit octave offsets are applied after wrapping
   */
  describe('Degree Indexing Semantics', () => {
    const cMajorNotes = ['C3', 'E3', 'G3']

    it('should use 1-based indexing (N1 = first voice)', () => {
      const note = getNoteFromSignalRow({
        signalRowId: 'N1',
        chord: null,
        chordNotes: cMajorNotes
      })

      expect(note).toBe('C3')
    })

    it('should map N2 to second voice, N3 to third voice', () => {
      const note2 = getNoteFromSignalRow({
        signalRowId: 'N2',
        chord: null,
        chordNotes: cMajorNotes
      })

      const note3 = getNoteFromSignalRow({
        signalRowId: 'N3',
        chord: null,
        chordNotes: cMajorNotes
      })

      expect(note2).toBe('E3')
      expect(note3).toBe('G3')
    })

    it('should wrap indexing when degree exceeds chord size', () => {
      // N4 wraps to first voice (C) but in next octave
      const note = getNoteFromSignalRow({
        signalRowId: 'N4',
        chord: null,
        chordNotes: cMajorNotes
      })

      expect(note).toBe('C4')
    })

    it('should increment octave for each full wrap', () => {
      // N5 = second voice in second octave
      const note5 = getNoteFromSignalRow({
        signalRowId: 'N5',
        chord: null,
        chordNotes: cMajorNotes
      })

      // N7 = first voice in third octave
      const note7 = getNoteFromSignalRow({
        signalRowId: 'N7',
        chord: null,
        chordNotes: cMajorNotes
      })

      expect(note5).toBe('E4')
      expect(note7).toBe('C5')
    })

    it('should apply explicit octave offsets after wrapping', () => {
      // N1+1 = first voice plus one octave
      const note = getNoteFromSignalRow({
        signalRowId: 'N1+1',
        chord: null,
        chordNotes: cMajorNotes
      })

      expect(note).toBe('C4')
    })

    it('should combine wrapping and explicit offsets correctly', () => {
      // N4-1 = wrapped to C4, then -1 octave = C3
      const note = getNoteFromSignalRow({
        signalRowId: 'N4-1',
        chord: null,
        chordNotes: cMajorNotes
      })

      expect(note).toBe('C3')
    })

    it('should handle negative octave offsets', () => {
      // N1-1 = first voice minus one octave
      const note = getNoteFromSignalRow({
        signalRowId: 'N1-1',
        chord: null,
        chordNotes: cMajorNotes
      })

      expect(note).toBe('C2')
    })

    it('should create continuous pitch lattice over voicing', () => {
      // Test that degree indexing creates a musically sensible sequence
      const degrees = ['N1', 'N2', 'N3', 'N4', 'N5', 'N6', 'N7', 'N8', 'N9']
      const notes = degrees.map((degree) =>
        getNoteFromSignalRow({
          signalRowId: degree,
          chord: null,
          chordNotes: cMajorNotes
        })
      )

      // Should be: C3, E3, G3, C4, E4, G4, C5, E5, G5
      expect(notes).toEqual(['C3', 'E3', 'G3', 'C4', 'E4', 'G4', 'C5', 'E5', 'G5'])
    })
  })

  /**
   * SPEC REQUIREMENT: Temporal Mapping
   * - Pattern is looped to cover full progression duration
   * - Pattern-relative times translated to absolute beat positions
   * - Each signal resolves against chord active at its absolute onset time
   */
  describe('Temporal Mapping', () => {
    it('should loop pattern to cover full progression', () => {
      const progression: ProgressionItemT[] = [
        {
          id: 'chord-1',
          type: 'chord',
          name: 'C',
          symbol: 'C',
          rootNote: 'C',
          octaveOffset: 0,
          voicing: 'closed',
          inversion: 0,
          bassNote: 'C',
          startTime: 0,
          durationBeats: 8
        }
      ]

      // 2-beat pattern with one signal
      const signals: SignalT[] = [{ id: 'sig-1', startTime: 0, duration: 0.5, noteIndex: 1, octaveOffset: 0 }]

      const signalRows: SignalRowsT = {
        N1: { id: 'N1', label: 'N1', totalIndex: 0, index: 0, octave: 0, signalIds: ['sig-1'] }
      }

      const performance = generatePerformance({
        chords: progression,
        signals,
        signalRows,
        patternLengthBeats: 2,
        progressionLengthBeats: 8,
        octave: '3'
      })

      // Should repeat 4 times (8 beats / 2 beats per pattern)
      expect(performance).toHaveLength(4)
      expect(performance[0].startTime).toBe(0)
      expect(performance[1].startTime).toBe(2)
      expect(performance[2].startTime).toBe(4)
      expect(performance[3].startTime).toBe(6)
    })

    it('should translate pattern-relative times to absolute beats', () => {
      const progression: ProgressionItemT[] = [
        {
          id: 'chord-1',
          type: 'chord',
          name: 'C',
          symbol: 'C',
          rootNote: 'C',
          octaveOffset: 0,
          voicing: 'closed',
          inversion: 0,
          bassNote: 'C',
          startTime: 0,
          durationBeats: 8
        }
      ]

      // Pattern with signal at beat 1.5
      const signals: SignalT[] = [{ id: 'sig-1', startTime: 1.5, duration: 0.5, noteIndex: 1, octaveOffset: 0 }]

      const signalRows: SignalRowsT = {
        N1: { id: 'N1', label: 'N1', totalIndex: 0, index: 0, octave: 0, signalIds: ['sig-1'] }
      }

      const performance = generatePerformance({
        chords: progression,
        signals,
        signalRows,
        patternLengthBeats: 4,
        progressionLengthBeats: 8,
        octave: '3'
      })

      // Should appear at beats 1.5 and 5.5
      expect(performance).toHaveLength(2)
      expect(performance[0].startTime).toBe(1.5)
      expect(performance[1].startTime).toBe(5.5)
    })

    it('should resolve signals against chord active at onset time', () => {
      const progression: ProgressionItemT[] = [
        {
          id: 'chord-1',
          type: 'chord',
          name: 'C',
          symbol: 'C',
          rootNote: 'C',
          octaveOffset: 0,
          voicing: 'closed',
          inversion: 0,
          bassNote: 'C',
          startTime: 0,
          durationBeats: 2
        },
        {
          id: 'chord-2',
          type: 'chord',
          name: 'G',
          symbol: 'G',
          rootNote: 'G',
          octaveOffset: 0,
          voicing: 'closed',
          inversion: 0,
          bassNote: 'G',
          startTime: 2,
          durationBeats: 2
        }
      ]

      // 4-beat pattern with signals at 0, 1, 2, 3
      const signals: SignalT[] = [
        { id: 'sig-1', startTime: 0, duration: 0.5, noteIndex: 1, octaveOffset: 0 },
        { id: 'sig-2', startTime: 1, duration: 0.5, noteIndex: 1, octaveOffset: 0 },
        { id: 'sig-3', startTime: 2, duration: 0.5, noteIndex: 1, octaveOffset: 0 },
        { id: 'sig-4', startTime: 3, duration: 0.5, noteIndex: 1, octaveOffset: 0 }
      ]

      const signalRows: SignalRowsT = {
        N1: { id: 'N1', label: 'N1', totalIndex: 0, index: 0, octave: 0, signalIds: ['sig-1', 'sig-2', 'sig-3', 'sig-4'] }
      }

      const performance = generatePerformance({
        chords: progression,
        signals,
        signalRows,
        patternLengthBeats: 4,
        progressionLengthBeats: 4,
        octave: '3'
      })

      expect(performance).toHaveLength(4)
      // First two signals resolve to C chord
      expect(performance[0].chordId).toBe('chord-1')
      expect(performance[0].note).toBe('C3')
      expect(performance[1].chordId).toBe('chord-1')
      expect(performance[1].note).toBe('C3')
      // Last two signals resolve to G chord
      expect(performance[2].chordId).toBe('chord-2')
      expect(performance[2].note).toBe('G3')
      expect(performance[3].chordId).toBe('chord-2')
      expect(performance[3].note).toBe('G3')
    })

    it('should not stop at chord boundaries mid-pattern', () => {
      const progression: ProgressionItemT[] = [
        {
          id: 'chord-1',
          type: 'chord',
          name: 'C',
          symbol: 'C',
          rootNote: 'C',
          octaveOffset: 0,
          voicing: 'closed',
          inversion: 0,
          bassNote: 'C',
          startTime: 0,
          durationBeats: 1
        },
        {
          id: 'chord-2',
          type: 'chord',
          name: 'G',
          symbol: 'G',
          rootNote: 'G',
          octaveOffset: 0,
          voicing: 'closed',
          inversion: 0,
          bassNote: 'G',
          startTime: 1,
          durationBeats: 1
        }
      ]

      // 2-beat pattern continues across chord boundary
      const signals: SignalT[] = [{ id: 'sig-1', startTime: 0, duration: 0.5, noteIndex: 1, octaveOffset: 0 }]

      const signalRows: SignalRowsT = {
        N1: { id: 'N1', label: 'N1', totalIndex: 0, index: 0, octave: 0, signalIds: ['sig-1'] }
      }

      const performance = generatePerformance({
        chords: progression,
        signals,
        signalRows,
        patternLengthBeats: 2,
        progressionLengthBeats: 2,
        octave: '3'
      })

      // Pattern should loop normally, not be affected by chord boundary
      expect(performance).toHaveLength(1)
      expect(performance[0].startTime).toBe(0)
    })
  })

  /**
   * SPEC REQUIREMENT: Performance Rendering
   * Engine produces linear MIDI-style performance with:
   * - Absolute start time (beats)
   * - Duration
   * - Concrete MIDI pitch
   * - Velocity
   * - Chord reference
   */
  describe('Performance Rendering', () => {
    it('should produce deterministic MIDI-like output', () => {
      const progression: ProgressionItemT[] = [
        {
          id: 'chord-1',
          type: 'chord',
          name: 'C',
          symbol: 'C',
          rootNote: 'C',
          octaveOffset: 0,
          voicing: 'closed',
          inversion: 0,
          bassNote: 'C',
          startTime: 0,
          durationBeats: 4
        }
      ]

      const signals: SignalT[] = [
        { id: 'sig-1', startTime: 0, duration: 1, noteIndex: 1, octaveOffset: 0 },
        { id: 'sig-2', startTime: 1, duration: 0.5, noteIndex: 1, octaveOffset: 0 }
      ]

      const signalRows: SignalRowsT = {
        N1: { id: 'N1', label: 'N1', totalIndex: 0, index: 0, octave: 0, signalIds: ['sig-1', 'sig-2'] }
      }

      const performance1 = generatePerformance({
        chords: progression,
        signals,
        signalRows,
        patternLengthBeats: 4,
        progressionLengthBeats: 4,
        octave: '3'
      })

      const performance2 = generatePerformance({
        chords: progression,
        signals,
        signalRows,
        patternLengthBeats: 4,
        progressionLengthBeats: 4,
        octave: '3'
      })

      // Should produce identical output (velocity is randomized, so check other fields)
      expect(performance1.length).toBe(performance2.length)
      performance1.forEach((note1, index) => {
        const note2 = performance2[index]
        expect(note1.note).toBe(note2.note)
        expect(note1.startTime).toBe(note2.startTime)
        expect(note1.duration).toBe(note2.duration)
        expect(note1.chordId).toBe(note2.chordId)
      })
    })

    it('should include all required performance note fields', () => {
      const progression: ProgressionItemT[] = [
        {
          id: 'chord-1',
          type: 'chord',
          name: 'C',
          symbol: 'C',
          rootNote: 'C',
          octaveOffset: 0,
          voicing: 'closed',
          inversion: 0,
          bassNote: 'C',
          startTime: 0,
          durationBeats: 4
        }
      ]

      const signals: SignalT[] = [{ id: 'sig-1', startTime: 0, duration: 1, noteIndex: 1, octaveOffset: 0 }]

      const signalRows: SignalRowsT = {
        N1: { id: 'N1', label: 'N1', totalIndex: 0, index: 0, octave: 0, signalIds: ['sig-1'] }
      }

      const performance = generatePerformance({
        chords: progression,
        signals,
        signalRows,
        patternLengthBeats: 4,
        progressionLengthBeats: 4,
        octave: '3'
      })

      const note = performance[0]
      expect(note).toHaveProperty('id')
      expect(note).toHaveProperty('note')
      expect(note).toHaveProperty('startTime')
      expect(note).toHaveProperty('duration')
      expect(note).toHaveProperty('velocity')
      expect(note).toHaveProperty('chordId')
      expect(note).toHaveProperty('signalId')

      expect(typeof note.note).toBe('string')
      expect(typeof note.startTime).toBe('number')
      expect(typeof note.duration).toBe('number')
      expect(typeof note.velocity).toBe('number')
    })

    it('should sort performance notes by start time', () => {
      const progression: ProgressionItemT[] = [
        {
          id: 'chord-1',
          type: 'chord',
          name: 'C',
          symbol: 'C',
          rootNote: 'C',
          octaveOffset: 0,
          voicing: 'closed',
          inversion: 0,
          bassNote: 'C',
          startTime: 0,
          durationBeats: 8
        }
      ]

      // Create signals in non-chronological order
      const signals: SignalT[] = [
        { id: 'sig-3', startTime: 6, duration: 0.5, noteIndex: 1, octaveOffset: 0 },
        { id: 'sig-1', startTime: 2, duration: 0.5, noteIndex: 1, octaveOffset: 0 },
        { id: 'sig-2', startTime: 4, duration: 0.5, noteIndex: 1, octaveOffset: 0 }
      ]

      const signalRows: SignalRowsT = {
        N1: { id: 'N1', label: 'N1', totalIndex: 0, index: 0, octave: 0, signalIds: ['sig-1', 'sig-2', 'sig-3'] }
      }

      const performance = generatePerformance({
        chords: progression,
        signals,
        signalRows,
        patternLengthBeats: 8,
        progressionLengthBeats: 8,
        octave: '3'
      })

      expect(performance).toHaveLength(3)
      expect(performance[0].startTime).toBe(2)
      expect(performance[1].startTime).toBe(4)
      expect(performance[2].startTime).toBe(6)
    })
  })

  /**
   * SPEC GUARANTEES / INVARIANTS
   * - Rhythm invariance: Changing chords does not alter rhythmic structure
   * - Harmonic adaptivity: All pitches re-derived from chord context
   * - Voicing awareness: Degree indices refer to realized voices
   * - Octave continuity: Degree indexing produces predictable octave stacking
   */
  describe('Design Guarantees / Invariants', () => {
    it('INVARIANT: Rhythm remains unchanged when chords change', () => {
      const signals: SignalT[] = [
        { id: 'sig-1', startTime: 0, duration: 1, noteIndex: 1, octaveOffset: 0 },
        { id: 'sig-2', startTime: 2, duration: 0.5, noteIndex: 1, octaveOffset: 0 }
      ]

      const signalRows: SignalRowsT = {
        N1: { id: 'N1', label: 'N1', totalIndex: 0, index: 0, octave: 0, signalIds: ['sig-1', 'sig-2'] }
      }

      // Test with C major progression
      const progressionC: ProgressionItemT[] = [
        {
          id: 'chord-1',
          type: 'chord',
          name: 'C',
          symbol: 'C',
          rootNote: 'C',
          octaveOffset: 0,
          voicing: 'closed',
          inversion: 0,
          bassNote: 'C',
          startTime: 0,
          durationBeats: 4
        }
      ]

      // Test with G major progression
      const progressionG: ProgressionItemT[] = [
        {
          id: 'chord-2',
          type: 'chord',
          name: 'G',
          symbol: 'G',
          rootNote: 'G',
          octaveOffset: 0,
          voicing: 'closed',
          inversion: 0,
          bassNote: 'G',
          startTime: 0,
          durationBeats: 4
        }
      ]

      const performanceC = generatePerformance({
        chords: progressionC,
        signals,
        signalRows,
        patternLengthBeats: 4,
        progressionLengthBeats: 4,
        octave: '3'
      })

      const performanceG = generatePerformance({
        chords: progressionG,
        signals,
        signalRows,
        patternLengthBeats: 4,
        progressionLengthBeats: 4,
        octave: '3'
      })

      // Rhythm should be identical
      expect(performanceC.length).toBe(performanceG.length)
      performanceC.forEach((noteC, index) => {
        const noteG = performanceG[index]
        expect(noteC.startTime).toBe(noteG.startTime)
        expect(noteC.duration).toBe(noteG.duration)
      })

      // But pitches should differ
      expect(performanceC[0].note).not.toBe(performanceG[0].note)
    })

    it('INVARIANT: All pitches derived from current chord context', () => {
      const progression: ProgressionItemT[] = [
        {
          id: 'chord-1',
          type: 'chord',
          name: 'C',
          symbol: 'C',
          rootNote: 'C',
          octaveOffset: 0,
          voicing: 'closed',
          inversion: 0,
          bassNote: 'C',
          startTime: 0,
          durationBeats: 2
        },
        {
          id: 'chord-2',
          type: 'chord',
          name: 'Am',
          symbol: 'Am',
          rootNote: 'A',
          octaveOffset: 0,
          voicing: 'closed',
          inversion: 0,
          bassNote: 'A',
          startTime: 2,
          durationBeats: 2
        }
      ]

      // Same degree (N1) should produce different pitches based on active chord
      const signals: SignalT[] = [
        { id: 'sig-1', startTime: 0, duration: 0.5, noteIndex: 1, octaveOffset: 0 },
        { id: 'sig-2', startTime: 2, duration: 0.5, noteIndex: 1, octaveOffset: 0 }
      ]

      const signalRows: SignalRowsT = {
        N1: { id: 'N1', label: 'N1', totalIndex: 0, index: 0, octave: 0, signalIds: ['sig-1', 'sig-2'] }
      }

      const performance = generatePerformance({
        chords: progression,
        signals,
        signalRows,
        patternLengthBeats: 4,
        progressionLengthBeats: 4,
        octave: '3'
      })

      // N1 in C chord should be C
      expect(performance[0].note).toBe('C3')
      // N1 in Am chord should be A
      expect(performance[1].note).toBe('A3')
    })

    it('INVARIANT: Degree indices refer to realized voices (post-voicing)', () => {
      // This is implicitly tested by the voicing tests, but worth emphasizing
      const chordClosed: ChordT = {
        id: 'c-closed',
        name: 'C',
        symbol: 'C',
        rootNote: 'C',
        octaveOffset: 0,
        voicing: 'closed',
        inversion: 0,
        bassNote: ''
      }

      const chordInverted: ChordT = {
        id: 'c-inverted',
        name: 'C',
        symbol: 'C',
        rootNote: 'C',
        octaveOffset: 0,
        voicing: 'closed',
        inversion: 1,
        bassNote: ''
      }

      const notesClosed = chordToNotes({ chord: chordClosed, rootOctave: '3' })
      const notesInverted = chordToNotes({ chord: chordInverted, rootOctave: '3' })

      // N1 should refer to the FIRST voice after voicing is applied
      // For closed position: C3
      expect(notesClosed[0]).toBe('C3')
      // For first inversion: E3 (bass moves up)
      expect(notesInverted[0]).toContain('E')
    })

    it('INVARIANT: Octave continuity produces predictable stacking', () => {
      const cMajorNotes = ['C3', 'E3', 'G3']

      // Test continuous sequence
      const sequence = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
      const notes = sequence.map((degree) =>
        getNoteFromSignalRow({
          signalRowId: `N${degree}`,
          chord: null,
          chordNotes: cMajorNotes
        })
      )

      // Should create musically sensible ascending pattern
      const expectedPattern = ['C3', 'E3', 'G3', 'C4', 'E4', 'G4', 'C5', 'E5', 'G5', 'C6']
      expect(notes).toEqual(expectedPattern)
    })
  })

  /**
   * EDGE CASES AND ROBUSTNESS
   */
  describe('Edge Cases', () => {
    it('should handle empty progression gracefully', () => {
      const performance = generatePerformance({
        chords: [],
        signals: [{ id: 'sig-1', startTime: 0, duration: 1, noteIndex: 1, octaveOffset: 0 }],
        signalRows: {
          N1: { id: 'N1', label: 'N1', totalIndex: 0, index: 0, octave: 0, signalIds: ['sig-1'] }
        },
        patternLengthBeats: 4,
        progressionLengthBeats: 4,
        octave: '3'
      })

      expect(performance).toEqual([])
    })

    it('should handle empty signals gracefully', () => {
      const performance = generatePerformance({
        chords: [
          {
            id: 'chord-1',
            type: 'chord',
            name: 'C',
            symbol: 'C',
            rootNote: 'C',
            octaveOffset: 0,
            voicing: 'closed',
            inversion: 0,
            bassNote: 'C',
            startTime: 0,
            durationBeats: 4
          }
        ],
        signals: [],
        signalRows: {},
        patternLengthBeats: 4,
        progressionLengthBeats: 4,
        octave: '3'
      })

      expect(performance).toEqual([])
    })

    it('should handle zero pattern length', () => {
      const performance = generatePerformance({
        chords: [
          {
            id: 'chord-1',
            type: 'chord',
            name: 'C',
            symbol: 'C',
            rootNote: 'C',
            octaveOffset: 0,
            voicing: 'closed',
            inversion: 0,
            bassNote: 'C',
            startTime: 0,
            durationBeats: 4
          }
        ],
        signals: [{ id: 'sig-1', startTime: 0, duration: 1, noteIndex: 1, octaveOffset: 0 }],
        signalRows: {
          N1: { id: 'N1', label: 'N1', totalIndex: 0, index: 0, octave: 0, signalIds: ['sig-1'] }
        },
        patternLengthBeats: 0,
        progressionLengthBeats: 4,
        octave: '3'
      })

      expect(performance).toEqual([])
    })

    it('should handle very short signal durations', () => {
      const progression: ProgressionItemT[] = [
        {
          id: 'chord-1',
          type: 'chord',
          name: 'C',
          symbol: 'C',
          rootNote: 'C',
          octaveOffset: 0,
          voicing: 'closed',
          inversion: 0,
          bassNote: 'C',
          startTime: 0,
          durationBeats: 4
        }
      ]

      const signals: SignalT[] = [{ id: 'sig-1', startTime: 0, duration: 0.01, noteIndex: 1, octaveOffset: 0 }]

      const signalRows: SignalRowsT = {
        N1: { id: 'N1', label: 'N1', totalIndex: 0, index: 0, octave: 0, signalIds: ['sig-1'] }
      }

      const performance = generatePerformance({
        chords: progression,
        signals,
        signalRows,
        patternLengthBeats: 4,
        progressionLengthBeats: 4,
        octave: '3'
      })

      expect(performance).toHaveLength(1)
      expect(performance[0].duration).toBe(0.01)
    })

    it('should handle signal extending beyond progression end', () => {
      const progression: ProgressionItemT[] = [
        {
          id: 'chord-1',
          type: 'chord',
          name: 'C',
          symbol: 'C',
          rootNote: 'C',
          octaveOffset: 0,
          voicing: 'closed',
          inversion: 0,
          bassNote: 'C',
          startTime: 0,
          durationBeats: 4
        }
      ]

      // Signal starts at beat 3, extends to beat 8 (beyond progression)
      const signals: SignalT[] = [{ id: 'sig-1', startTime: 3, duration: 5, noteIndex: 1, octaveOffset: 0 }]

      const signalRows: SignalRowsT = {
        N1: { id: 'N1', label: 'N1', totalIndex: 0, index: 0, octave: 0, signalIds: ['sig-1'] }
      }

      const performance = generatePerformance({
        chords: progression,
        signals,
        signalRows,
        patternLengthBeats: 4,
        progressionLengthBeats: 4,
        octave: '3'
      })

      // Should be clipped to progression end
      expect(performance).toHaveLength(1)
      expect(performance[0].startTime).toBe(3)
      expect(performance[0].duration).toBe(1) // Clipped to beat 4
    })

    it('should handle multiple signals in same signal row', () => {
      const progression: ProgressionItemT[] = [
        {
          id: 'chord-1',
          type: 'chord',
          name: 'C',
          symbol: 'C',
          rootNote: 'C',
          octaveOffset: 0,
          voicing: 'closed',
          inversion: 0,
          bassNote: 'C',
          startTime: 0,
          durationBeats: 4
        }
      ]

      const signals: SignalT[] = [
        { id: 'sig-1', startTime: 0, duration: 0.5, noteIndex: 1, octaveOffset: 0 },
        { id: 'sig-2', startTime: 1, duration: 0.5, noteIndex: 1, octaveOffset: 0 },
        { id: 'sig-3', startTime: 2, duration: 0.5, noteIndex: 1, octaveOffset: 0 }
      ]

      const signalRows: SignalRowsT = {
        N1: { id: 'N1', label: 'N1', totalIndex: 0, index: 0, octave: 0, signalIds: ['sig-1', 'sig-2', 'sig-3'] }
      }

      const performance = generatePerformance({
        chords: progression,
        signals,
        signalRows,
        patternLengthBeats: 4,
        progressionLengthBeats: 4,
        octave: '3'
      })

      expect(performance).toHaveLength(3)
      expect(performance[0].note).toBe('C3')
      expect(performance[1].note).toBe('C3')
      expect(performance[2].note).toBe('C3')
    })

    it('should handle complex chord with many voices', () => {
      const progression: ProgressionItemT[] = [
        {
          id: 'chord-1',
          type: 'chord',
          name: 'Cmaj13',
          symbol: 'Cmaj13',
          rootNote: 'C',
          octaveOffset: 0,
          voicing: 'closed',
          inversion: 0,
          bassNote: 'C',
          startTime: 0,
          durationBeats: 4
        }
      ]

      const notes = chordToNotes({ chord: progression[0], rootOctave: '3' })

      // Cmaj13 should have many voices
      expect(notes.length).toBeGreaterThan(3)

      // Test degree indexing wraps correctly with more voices
      const degree1 = getNoteFromSignalRow({
        signalRowId: `N${notes.length + 1}`,
        chord: null,
        chordNotes: notes
      })

      // Should wrap to first voice in next octave
      const firstNote = notes[0]
      const firstNoteOctave = parseInt(firstNote.match(/\d+/)?.[0] || '0')
      expect(degree1).toContain(firstNote.replace(/\d+/, ''))
      expect(parseInt(degree1.match(/\d+/)?.[0] || '0')).toBe(firstNoteOctave + 1)
    })
  })

  /**
   * INTEGRATION TESTS
   * Complex scenarios combining multiple features
   */
  describe('Integration Tests', () => {
    it('should handle complex multi-chord progression with pattern looping', () => {
      const progression: ProgressionItemT[] = [
        {
          id: 'chord-1',
          type: 'chord',
          name: 'C',
          symbol: 'C',
          rootNote: 'C',
          octaveOffset: 0,
          voicing: 'closed',
          inversion: 0,
          bassNote: 'C',
          startTime: 0,
          durationBeats: 2
        },
        {
          id: 'chord-2',
          type: 'chord',
          name: 'Am',
          symbol: 'Am',
          rootNote: 'A',
          octaveOffset: 0,
          voicing: 'closed',
          inversion: 0,
          bassNote: 'A',
          startTime: 2,
          durationBeats: 2
        },
        {
          id: 'chord-3',
          type: 'chord',
          name: 'F',
          symbol: 'F',
          rootNote: 'F',
          octaveOffset: 0,
          voicing: 'closed',
          inversion: 0,
          bassNote: 'F',
          startTime: 4,
          durationBeats: 2
        },
        {
          id: 'chord-4',
          type: 'chord',
          name: 'G',
          symbol: 'G',
          rootNote: 'G',
          octaveOffset: 0,
          voicing: 'closed',
          inversion: 0,
          bassNote: 'G',
          startTime: 6,
          durationBeats: 2
        }
      ]

      // 2-beat pattern with multiple signals
      const signals: SignalT[] = [
        { id: 'sig-1', startTime: 0, duration: 0.5, noteIndex: 1, octaveOffset: 0 },
        { id: 'sig-2', startTime: 0.5, duration: 0.5, noteIndex: 2, octaveOffset: 0 },
        { id: 'sig-3', startTime: 1, duration: 0.5, noteIndex: 3, octaveOffset: 0 }
      ]

      const signalRows: SignalRowsT = {
        N1: { id: 'N1', label: 'N1', totalIndex: 0, index: 0, octave: 0, signalIds: ['sig-1'] },
        N2: { id: 'N2', label: 'N2', totalIndex: 1, index: 1, octave: 0, signalIds: ['sig-2'] },
        N3: { id: 'N3', label: 'N3', totalIndex: 2, index: 2, octave: 0, signalIds: ['sig-3'] }
      }

      const performance = generatePerformance({
        chords: progression,
        signals,
        signalRows,
        patternLengthBeats: 2,
        progressionLengthBeats: 8,
        octave: '3'
      })

      // Pattern repeats 4 times, 3 signals each = 12 total notes
      expect(performance).toHaveLength(12)

      // Verify each repetition maps to correct chord
      const repetition1 = performance.slice(0, 3)
      const repetition2 = performance.slice(3, 6)
      const repetition3 = performance.slice(6, 9)
      const repetition4 = performance.slice(9, 12)

      repetition1.forEach((note) => expect(note.chordId).toBe('chord-1'))
      repetition2.forEach((note) => expect(note.chordId).toBe('chord-2'))
      repetition3.forEach((note) => expect(note.chordId).toBe('chord-3'))
      repetition4.forEach((note) => expect(note.chordId).toBe('chord-4'))

      // Verify rhythm is consistent across all repetitions
      expect(repetition1[0].startTime).toBe(0)
      expect(repetition2[0].startTime).toBe(2)
      expect(repetition3[0].startTime).toBe(4)
      expect(repetition4[0].startTime).toBe(6)
    })

    it('should handle arpeggio pattern across changing chords', () => {
      const progression: ProgressionItemT[] = [
        {
          id: 'chord-1',
          type: 'chord',
          name: 'C',
          symbol: 'C',
          rootNote: 'C',
          octaveOffset: 0,
          voicing: 'closed',
          inversion: 0,
          bassNote: 'C',
          startTime: 0,
          durationBeats: 4
        },
        {
          id: 'chord-2',
          type: 'chord',
          name: 'G',
          symbol: 'G',
          rootNote: 'G',
          octaveOffset: 0,
          voicing: 'closed',
          inversion: 0,
          bassNote: 'G',
          startTime: 4,
          durationBeats: 4
        }
      ]

      // Arpeggio pattern: N1, N2, N3, N4 (wraps to next octave)
      const signals: SignalT[] = [
        { id: 'sig-1', startTime: 0, duration: 0.25, noteIndex: 1, octaveOffset: 0 },
        { id: 'sig-2', startTime: 0.25, duration: 0.25, noteIndex: 2, octaveOffset: 0 },
        { id: 'sig-3', startTime: 0.5, duration: 0.25, noteIndex: 3, octaveOffset: 0 },
        { id: 'sig-4', startTime: 0.75, duration: 0.25, noteIndex: 4, octaveOffset: 0 }
      ]

      const signalRows: SignalRowsT = {
        N1: { id: 'N1', label: 'N1', totalIndex: 0, index: 0, octave: 0, signalIds: ['sig-1'] },
        N2: { id: 'N2', label: 'N2', totalIndex: 1, index: 1, octave: 0, signalIds: ['sig-2'] },
        N3: { id: 'N3', label: 'N3', totalIndex: 2, index: 2, octave: 0, signalIds: ['sig-3'] },
        N4: { id: 'N4', label: 'N4', totalIndex: 3, index: 3, octave: 0, signalIds: ['sig-4'] }
      }

      const performance = generatePerformance({
        chords: progression,
        signals,
        signalRows,
        patternLengthBeats: 1,
        progressionLengthBeats: 8,
        octave: '3'
      })

      // 8 beats / 1 beat per pattern = 8 repetitions × 4 notes = 32 notes
      expect(performance).toHaveLength(32)

      // First 4 notes should be C major arpeggio
      const cNotes = chordToNotes({ chord: progression[0], rootOctave: '3' })
      expect(performance[0].note).toBe(cNotes[0]) // C3
      expect(performance[1].note).toBe(cNotes[1]) // E3
      expect(performance[2].note).toBe(cNotes[2]) // G3
      expect(performance[3].note).toBe(cNotes[0].replace(/3/, '4')) // C4 (wrapped)

      // Notes at beat 4+ should be G major arpeggio
      const gNotes = chordToNotes({ chord: progression[1], rootOctave: '3' })
      const notesAtBeat4 = performance.filter((note) => note.startTime >= 4 && note.startTime < 5)
      expect(notesAtBeat4[0].note).toBe(gNotes[0]) // G3
    })
  })
})
