import { SIGNAL_IDS, SIGNAL_ROWS } from '$lib/constants/signalRows'
import mainStore from './main.svelte'

type MoveSignalToRowOptionsT = {
  fromRowId: string
  toRowId: string
  signalId: string
}

class PatternStore {
  signals: SignalT[] = $state([])
  signalRows = $state(SIGNAL_ROWS)
  durationBeats = $state(16) // default 4 bars (16 beats)

  // Derived: active pattern length in beats (based on bars setting)
  // 1 bar = 4 beats
  activePatternLengthBeats = $derived.by(() => {
    const barsToBeats = mainStore.patternLengthBars * 4
    return barsToBeats
  })

  // Derived: only signals within the active pattern range
  activeSignals = $derived.by(() => {
    const filteredSignals = this.signals.filter((signal) => {
      const signalEndTime = signal.startTime + signal.duration
      const isWithinActiveRange = signal.startTime < this.activePatternLengthBeats
      return isWithinActiveRange
    })
    return filteredSignals
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