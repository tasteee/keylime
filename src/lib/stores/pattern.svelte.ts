import { SIGNAL_ROWS } from '$lib/constants/signalRows'

class PatternStore {
  signals: SignalT[] = $state([])
  signalRows = $state(SIGNAL_ROWS)
  patternDurationBars = $state(1)

  activePatternLengthBeats = $derived.by(() => {
    const barsToBeats = this.patternDurationBars * 4
    return barsToBeats
  })

  // Derived: only signals within the active pattern range
  activeSignals = $derived.by(() => {
    return this.signals.filter((signal) => {
      const signalEndTime = signal.startTime + signal.duration
      const isWithinActiveRange = signal.startTime < this.activePatternLengthBeats
      return isWithinActiveRange
    })
  })

  getSignalById = (id: string): SignalT => {
    const finder = (s: SignalT) => s.id === id
    return this.signals.find(finder) as SignalT
  }

  moveSignalToRow = (options: MoveSignalToRowOptionsT) => {
    const fromRow = this.signalRows[options.fromRowId]
    const toRow = this.signalRows[options.toRowId]
    fromRow.signalIds = fromRow.signalIds.filter((id) => id !== options.signalId)
    toRow.signalIds = [...toRow.signalIds, options.signalId]
  }
}

const patternStore = new PatternStore()
export { patternStore }