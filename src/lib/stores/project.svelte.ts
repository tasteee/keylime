import { SIGNAL_ROWS } from "$lib/constants/signalRows"

class ProjectStore {
  id = $state(crypto.randomUUID())
  title = $state('New Project')
  description = $state('')
  userId = $state('')
  key = $state('C')
  scale = $state('Major')
  octave = $state(3)
  bpm = $state(108)
  minVelocity = $state(60)
  maxVelocity = $state(100)
  patternSignals: SignalT[] = $state([])
  patternSignalRows = $state(SIGNAL_ROWS)
  patternDurationBars = $state(1)
  progressionChords = $state<ProgressionChordT[]>([])
  createdAt = $state<Date | null>(new Date())
  updatedAt = $state<Date | null>(new Date())

  // can other users see this project (persisted)
  isPublic = $state(false)
  // has the project been saved previously (local state)
  isSaved = $state(false)
  // have there been changes since last save (local state)
  isDirty = $state(false)

  patternActiveDurationBeats = $derived.by(() => {
    const barsToBeats = this.patternDurationBars * 4
    return barsToBeats
  })

  // Derived: only signals within the active pattern range
  patternActiveSignals = $derived.by(() => {
    return this.patternSignals.filter((signal) => {
      const signalEndTime = signal.startTime + signal.duration
      const isWithinActiveRange = signal.startTime < this.patternActiveDurationBeats
      return isWithinActiveRange
    })
  })

  getPatternSignalById = (id: string): SignalT => {
    const finder = (s: SignalT) => s.id === id
    return this.patternSignals.find(finder) as SignalT
  }

  movePatternSignalToRow = (options: MoveSignalToRowOptionsT) => {
    const fromRow = this.patternSignalRows[options.fromRowId]
    const toRow = this.patternSignalRows[options.toRowId]
    fromRow.signalIds = fromRow.signalIds.filter((id) => id !== options.signalId)
    toRow.signalIds = [...toRow.signalIds, options.signalId]
  }

  markDirty = () => {
    this.isDirty = true
  }

  save = async () => {
    // TODO: Implement actual save logic (API call, etc.)
    console.log('Saving project:', {
      id: this.id,
      title: this.title,
      description: this.description,
      bpm: this.bpm,
      isPublic: this.isPublic
    })

    this.updatedAt = new Date()
    this.isSaved = true
    this.isDirty = false
  }
}

export const createProjectStore = (projectData: Partial<ProjectT> = {}) => {
  const store = new ProjectStore()
  Object.assign(store, projectData)
  return store
}

const projectStore = createProjectStore()
export default projectStore
