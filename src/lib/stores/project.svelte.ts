import { SIGNAL_ROWS } from "$lib/constants/signalRows"
import { createSupabaseClient } from '$lib/supabase/client'
import authStore from './auth.svelte'

const TOTAL_UNITS = 64

const getUserById = async (id: string) => {
  const supabase = createSupabaseClient()

  const result = await supabase
    .from('all_users')
    .select('id')
    .eq('id', id)
    .single()

  const user = result.data
  const error = result.error
  return { user, error }
}

class ProjectStore {
  id = $state(crypto.randomUUID())
  title = $state('New Project')
  description = $state('')
  userId = $state('')
  key = $state('C')
  scale = $state('Major')
  octave = $state('3')
  bpm = $state(124)
  minVelocity = $state(70)
  maxVelocity = $state(80)
  patternSignals: SignalT[] = $state([])
  patternSignalRows = $state(SIGNAL_ROWS)
  patternDurationBars = $state(1)
  baseProgressionItems: ProgressionItemT[] = $state([])
  selectedProgressionItemId: string | null = $state(null)

  createdAt = $state<Date | null>(new Date())
  updatedAt = $state<Date | null>(new Date())

  // Regenerate all progression items with startTime calculated
  progressionItems = $derived.by(() => {
    let accumulatedStartTime = 0

    return this.baseProgressionItems.map((item) => {
      const startTime = accumulatedStartTime
      accumulatedStartTime += item.durationBeats

      return {
        ...item,
        startTime
      } as ProgressionItemT
    })
  })

  // Backwards compatibility - returns only chords
  progressionChords = $derived.by(() => {
    return this.progressionItems.filter((item) => item.type === 'chord') as ProgressionChordT[]
  })

  chordSymbols: string[] = $derived.by(() => {
    return this.progressionChords.map((chord) => chord.symbol)
  })

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

  // Progression methods
  getProgressionItem = (id: string): ProgressionItemT | undefined => {
    const finder = (item: ProgressionItemT) => item.id === id
    return this.baseProgressionItems.find(finder)
  }

  getProgressionChord = (id: string): ProgressionChordT | undefined => {
    const item = this.getProgressionItem(id)
    if (item?.type === 'chord') return item
    return undefined
  }

  getProgressionTotalDuration = (): number => {
    if (!this.baseProgressionItems.length) return 0
    return this.baseProgressionItems.reduce((total, item) => total + item.durationBeats, 0)
  }

  addProgressionChord = (chord: ChordT) => {
    const chordWithTimelineData: ProgressionChordT = {
      ...chord,
      type: 'chord',
      startTime: 0,
      durationBeats: 4
    }

    const hasSelectedItem = this.selectedProgressionItemId !== null

    if (hasSelectedItem) {
      const selectedIndex = this.baseProgressionItems.findIndex((item) => item.id === this.selectedProgressionItemId)
      if (selectedIndex !== -1) {
        const newItems = [...this.baseProgressionItems]
        newItems.splice(selectedIndex + 1, 0, chordWithTimelineData)
        this.baseProgressionItems = newItems
      } else {
        this.baseProgressionItems = [...this.baseProgressionItems, chordWithTimelineData]
      }
    } else {
      this.baseProgressionItems = [...this.baseProgressionItems, chordWithTimelineData]
    }

    this.selectedProgressionItemId = chordWithTimelineData.id
    this.markDirty()
  }

  addProgressionRest = () => {
    const restItem: ProgressionRestT = {
      id: `rest-${Date.now()}`,
      type: 'rest',
      symbol: 'REST',
      rootNote: 'REST',
      startTime: 0,
      durationBeats: 4
    }

    const hasSelectedItem = this.selectedProgressionItemId !== null
    if (hasSelectedItem) {
      const selectedIndex = this.baseProgressionItems.findIndex((item) => item.id === this.selectedProgressionItemId)
      if (selectedIndex !== -1) {
        const newItems = [...this.baseProgressionItems]
        newItems.splice(selectedIndex + 1, 0, restItem)
        this.baseProgressionItems = newItems
      } else {
        this.baseProgressionItems = [...this.baseProgressionItems, restItem]
      }
    } else {
      this.baseProgressionItems = [...this.baseProgressionItems, restItem]
    }

    this.selectedProgressionItemId = restItem.id
    this.markDirty()
  }

  removeProgressionItem = (id: string) => {
    const wasSelected = this.selectedProgressionItemId === id
    this.baseProgressionItems = this.baseProgressionItems.filter((item) => item.id !== id)

    if (wasSelected) {
      const hasItemsRemaining = this.baseProgressionItems.length > 0
      if (hasItemsRemaining) {
        const lastItem = this.baseProgressionItems[this.baseProgressionItems.length - 1]
        this.selectedProgressionItemId = lastItem.id
      } else {
        this.selectedProgressionItemId = null
      }
    }
    this.markDirty()
  }

  updateProgressionItem = (updatedItem: Partial<ProgressionItemT>) => {
    this.baseProgressionItems = this.baseProgressionItems.map((item) => {
      const isTargetItem = item.id === updatedItem.id
      if (!isTargetItem) return item

      const mergedItem = { ...item, ...updatedItem }
      return mergedItem as ProgressionItemT
    })
    this.markDirty()
  }

  selectProgressionItem = (id: string | null) => {
    this.selectedProgressionItemId = id
  }

  deleteSelectedProgressionItem = () => {
    const hasSelectedItem = this.selectedProgressionItemId !== null
    if (hasSelectedItem) {
      this.removeProgressionItem(this.selectedProgressionItemId as string)
    }
  }

  duplicateSelectedProgressionItem = () => {
    const hasSelectedItem = this.selectedProgressionItemId !== null
    if (!hasSelectedItem) return

    const originalItem = this.getProgressionItem(this.selectedProgressionItemId as string)
    if (!originalItem) return

    const duplicatedItem: ProgressionItemT = {
      ...originalItem,
      id: `${originalItem.id}-${Date.now()}`,
      startTime: 0
    } as ProgressionItemT

    const selectedIndex = this.baseProgressionItems.findIndex((item) => item.id === this.selectedProgressionItemId)
    if (selectedIndex !== -1) {
      const newItems = [...this.baseProgressionItems]
      newItems.splice(selectedIndex + 1, 0, duplicatedItem)
      this.baseProgressionItems = newItems
    } else {
      this.baseProgressionItems = [...this.baseProgressionItems, duplicatedItem]
    }

    this.selectedProgressionItemId = duplicatedItem.id
    this.markDirty()
  }

  reorderProgressionItem = (args: { itemId: string; newIndex: number }) => {
    const itemIndex = this.baseProgressionItems.findIndex(item => item.id === args.itemId)
    if (itemIndex === -1) return

    const item = this.baseProgressionItems[itemIndex]
    const newItems = [...this.baseProgressionItems]
    newItems.splice(itemIndex, 1)
    newItems.splice(args.newIndex, 0, item)

    this.baseProgressionItems = newItems
    this.markDirty()
  }

  markDirty = () => {
    this.isDirty = true
  }

  save = async () => {
    if (!authStore.user) throw new Error('User must be authenticated to save project')
    const supabase = createSupabaseClient()
    const userId = authStore.user.id
    const { user } = await getUserById(userId)
    if (!user) throw new Error('User not found, cannot save project.')

    const projectData = JSON.parse(JSON.stringify({
      id: this.id,
      userId: user.id,
      title: this.title,
      description: this.description,
      key: this.key,
      scale: this.scale,
      octave: this.octave,
      bpm: this.bpm,
      minVelocity: this.minVelocity,
      maxVelocity: this.maxVelocity,
      patternDurationBars: this.patternDurationBars,
      isPublic: this.isPublic,
      progressionChords: this.baseProgressionItems,
      chordSymbols: this.chordSymbols,
      patternSignals: this.patternSignals,
      patternSignalRows: this.patternSignalRows
    } as ProjectT))

    const { error } = await supabase
      .from('all_projects')
      .upsert(projectData)

    if (error) throw new Error(`Failed to save project: ${error.message}`)
    this.updatedAt = new Date()
    this.isSaved = true
    this.isDirty = false
    console.log('Saved project: ', projectData)
    return { success: true }
  }

  load = async (projectId: string) => {
    const supabase = createSupabaseClient()

    const { data: project, error: projectError } = await supabase
      .from('all_projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      throw new Error(`Failed to load project: ${projectError?.message || 'Not found'}`)
    }

    this.id = project.id
    this.title = project.title
    this.description = project.description
    this.userId = project.userId
    this.key = project.key
    this.scale = project.scale
    this.octave = project.octave
    this.bpm = project.bpm
    this.minVelocity = project.minVelocity
    this.maxVelocity = project.maxVelocity
    this.patternDurationBars = project.patternDurationBars
    this.isPublic = project.isPublic
    this.createdAt = new Date(project.createdAt)
    this.updatedAt = new Date(project.updatedAt)
    this.baseProgressionItems = project.progressionChords || []
    this.selectedProgressionItemId = this.baseProgressionItems.length > 0 ? this.baseProgressionItems[0].id : null
    this.patternSignals = project.patternSignals || []

    const hasValidSignalRows = project.patternSignalRows &&
      typeof project.patternSignalRows === 'object' &&
      Object.keys(project.patternSignalRows).length > 0

    this.patternSignalRows = hasValidSignalRows ? project.patternSignalRows : SIGNAL_ROWS
    this.baseProgressionItems = project.progressionChords || []

    this.isSaved = true
    this.isDirty = false

    return { success: true }
  }

  delete = async () => {
    if (!authStore.user) {
      throw new Error('User must be authenticated to delete project')
    }

    const supabase = createSupabaseClient()

    const { error } = await supabase
      .from('all_projects')
      .delete()
      .eq('id', this.id)

    if (error) {
      throw new Error(`Failed to delete project: ${error.message}`)
    }

    return { success: true }
  }

  reset = () => {
    this.id = crypto.randomUUID()
    this.title = 'New Project'
    this.description = ''
    this.userId = ''
    this.key = 'C'
    this.scale = 'Major'
    this.octave = '3'
    this.bpm = 108
    this.minVelocity = 60
    this.maxVelocity = 100
    this.patternSignals = []
    this.patternSignalRows = SIGNAL_ROWS
    this.patternDurationBars = 1
    this.baseProgressionItems = []
    this.selectedProgressionItemId = null
    this.createdAt = new Date()
    this.updatedAt = new Date()
    this.isPublic = false
    this.isSaved = false
    this.isDirty = false
  }
}

export const createProjectStore = (projectData: Partial<ProjectT> = {}) => {
  const store = new ProjectStore()
  Object.assign(store, projectData)
  store.baseProgressionItems = projectData.progressionChords || []
  store.selectedProgressionItemId = projectData.progressionChords?.[0]?.id || null
  return store
}

const projectStore = createProjectStore()
export default projectStore
