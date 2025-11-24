import { SIGNAL_IDS, SIGNAL_ROWS } from '$lib/constants/signalRows'

// patternStore holds the signals in the pattern editor.
// signals are unaware what note they will be mapped to.
// all that is known is that a signal inside a signalRow
// with label "N3+2" will be mapped to the 3rd note of an
// arbitrary chord in the future, plus 2 octaves from the
// base octave of the project. N1 will be mapped to the root
// note of the chord the pattern is applied to, at the base
// octave of the project (although the chord the pattern is
// applied to can have its own octave offset, which will
// affect the final note played). So signals are placeholders
// for notes that are unknown to the pattern editor / pattern store.

// Later we may apply a pattern to the chord C Major, with the project
// base octave set to 3, the chord octave offset set to +1, so N1 would
// map to C4, N3 would map to E4, etc. Since C Major only has 3 notes,
// if the pattern had a signal in row "N4", that would have to wrap
// around to the root note again, so N4 would map to C4, N5 to E4, N6 to G4, N7 to C5, etc.

// This allows patterns to be completely chord-agnostic, and reusable
// across any chord progression.

type MoveSignalToRowOptionsT = {
  fromRowId: string
  toRowId: string
  signalId: string
}

class PatternStore {
  signals: SignalT[] = $state([])
  signalRows = $state(SIGNAL_ROWS)

  getSignalById = (id: string): SignalT => {
    const finder = (s: SignalT) => s.id === id
    return this.signals.find(finder) as SignalT
  }

  moveSignalToRow = (options: MoveSignalToRowOptionsT) => {
    // Remove signal id from old row.
    // Add signal id to new row
    // which will cause it to render aligned with the new row.
    const fromRow = this.signalRows[options.fromRowId]
    const toRow = this.signalRows[options.toRowId]
    fromRow.signalIds = fromRow.signalIds.filter((id) => id !== options.signalId)
    toRow.signalIds = [...toRow.signalIds, options.signalId]
  }
}

const patternStore = new PatternStore()
export { patternStore }