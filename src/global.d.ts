// Notes because I dont know fuck about music theory:
// inversions: +1 would mean rotated notes up one, so the bassNote would now be the 2nd note of the chord, rather than the first. When you go up X amount of inversions as there are notes in your chord, you wind up back at the same original notes, but an octave up.
// voicings: ways to arrange chord notes, from closed (standard, close as possible) to spread wide across octaves. can be useful for eliminating mud. makes interesting sounds of same chords.

type VoicingT =
  | 'open'
  | 'closed'
  | 'drop2'
  | 'drop3'
  | 'drop2and4'
  | 'spread'
  | 'shell'
  | 'tonal-lefthand'
  | 'tonal-triads'

// A ChordT is a wild, un-commited-to chord that the user can preview,
// modify, and optionally add to their progression if they like it.
// When a ChordT is added to a progression, it just evolves into a
// ProgressionChordT, which is a more concrete version of the chord
// that has a duration and is marked as not a rest.
// type TonalChordT = TonalChord.Chord

type ChordT = {
  id: string
  name: string
  symbol: string
  rootNote: string
  octaveOffset: number
  voicing: string
  inversion: number
  bassNote: string
}

type ProgressionChordT = ChordT & {
  type: 'chord'
  startTime: number // beats - position in progression timeline
  durationBeats: number // beats - length in progression timeline
}

type ProgressionRestT = {
  id: string
  type: 'rest'
  symbol: 'REST',
  rootNote: 'REST',
  startTime: number // beats - position in progression timeline
  durationBeats: number // beats - length in progression timeline
}

type ProgressionItemT = ProgressionChordT | ProgressionRestT

type SignalRowT = {
  id: string
  label: string
  totalIndex: number
  index: number
  octave: number
  signalIds: string[]
}

type SignalRowsT = {
  [key: string]: SignalRowT
}

type SignalT = {
  id: string
  startTime: number // beats (can be decimal, e.g., 0.25 = 1/4 beat)
  noteIndex: number
  duration: number // beats (can be decimal, e.g., 0.25 = 1/4 beat)
  octaveOffset: number
  modifiedTime?: number
}

type PerformanceNoteT = {
  id: string
  note: string
  startTime: number // beats (absolute time in the progression)
  duration: number // beats
  velocity: number
  chordId: string
  signalId: string
}

type ProjectT = {
  id: string
  title: string
  description: string
  userId: string
  isPublic: boolean
  key: string
  scale: string
  octave: string
  bpm: number
  minVelocity: number
  maxVelocity: number
  progressionChords: ProgressionChordT[]
  chordSymbols: string[] // e.g., ['Cmaj7', 'Am7', ...] derived from progressionChords.
  patternSignals: SignalT[] // json... right? or array in supabase??
  patternSignalRows: SignalRowsT // json...
  patternDurationBars: number
  createdAt: Date | null
  updatedAt: Date | null
}

type MoveSignalToRowOptionsT = {
  fromRowId: string
  toRowId: string
  signalId: string
}

type JsonT =
  | string
  | number
  | boolean
  | null
  | { [key: string]: JsonT | undefined }
  | JsonT[]