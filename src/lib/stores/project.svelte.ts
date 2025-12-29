import { SIGNAL_ROWS } from "$lib/constants/signalRows"
import { numbers } from "$lib/helpers/numbers"
import { getProjectById, getUserById } from "$lib/modules/database"
import { createNewProjectData, getFreshPatternSignalRows } from "$lib/modules/projects"
import { asCleanAsync, cleanAsync, type CleanAsyncReturnT } from "$lib/modules/promises"
import { type TheAwaitedReturnT } from "$lib/modules/the-awaited"
import { createSupabaseClient } from '$lib/supabase/client'
import { authStore } from './auth.svelte'

const TOTAL_UNITS = 64
const PATTERN_MIN_ZOOM = 16
const PATTERN_MAX_ZOOM = 48
const PATTERN_ZOOM_STEP = 4

class ProjectStore {
  isLoading = $state(false)
  activeView = $state<'pattern' | 'chords'>('chords')
  initialState = $state('')

  id: string = $state(crypto.randomUUID())
  title = $state('New Project')
  description = $state('')
  userId = $state('')
  key = $state('C')
  scale = $state('Major')
  octave = $state('3')
  bpm = $state(124)
  minVelocity = $state(70)
  maxVelocity = $state(80)
  isPublic = $state(false)
  isSaved = $state(false)
  isDirty = $state(false)
  infoText = $state('');
  patternSignals: SignalT[] = $state([])
  patternSignalRows = $state(getFreshPatternSignalRows())
  patternDurationBars = $state(1)
  baseProgressionItems: ProgressionItemT[] = $state([])
  selectedProgressionItemId: string | null = $state(null)
  patternZoomLevel = $state(32) // cells are 32x32px by default
  progressionZoomLevel = $state(82) // pixels per beat for progression
  createdAt = $state<Date | null>(new Date())
  updatedAt = $state<Date | null>(new Date())

  zoomInPattern = () => {
    this.adjustPatternZoomLevel(1)
  }

  zoomOutPattern = () => {
    this.adjustPatternZoomLevel(-1)
  }

  // adjustPatternZoomLevel(1) -> zooms in by 4px
  // adjustPatternZoomLevel(-1) -> zooms out by 4px
  adjustPatternZoomLevel = (delta: number = 0) => {
    const addition = delta * PATTERN_ZOOM_STEP
    const newZoomLevel = this.patternZoomLevel + addition
    const clampedZoomLevel = numbers.clamp(PATTERN_MIN_ZOOM, newZoomLevel, PATTERN_MAX_ZOOM)
    this.patternZoomLevel = clampedZoomLevel
    this.markDirty()
  }

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
    return this.progressionChords.map((chord) => {
      const hasOctaveOffset = chord.octaveOffset !== 0
      const hasInversion = chord.inversion !== 0
      const hasVoicingModifier = chord.voicing !== 'closed'
      const isModified = hasOctaveOffset || hasInversion || hasVoicingModifier

      const symbolWithModifier = isModified ? chord.symbol + '*' : chord.symbol
      return symbolWithModifier
    })
  })

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
    fromRow.signalIds = fromRow.signalIds.filter((id: string) => id !== options.signalId)
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

  // Generate the current project data with keys in alphabetical order.
  // This is the single source of truth for serialization.
  private generateProjectData = (): ProjectT => {
    const userId = authStore.authUser?.id
    if (!userId) throw new Error('User must be authenticated to generate project data')
    const data = createNewProjectData(userId,)
    return {
      bpm: this.bpm,
      chordSymbols: this.chordSymbols,
      createdAt: this.createdAt,
      description: this.description,
      id: this.id,
      isPublic: this.isPublic,
      key: this.key,
      maxVelocity: this.maxVelocity,
      minVelocity: this.minVelocity,
      octave: this.octave,
      originalProjectId: null,
      patternDurationBars: this.patternDurationBars,
      patternSignalRows: this.patternSignalRows,
      patternSignals: this.patternSignals,
      patternZoomLevel: this.patternZoomLevel,
      progressionChords: this.baseProgressionItems,
      progressionZoomLevel: this.progressionZoomLevel,
      scale: this.scale,
      title: this.title,
      updatedAt: this.updatedAt,
      userId: this.userId,
    } as ProjectT
  }

  // Serialize current project data to string with consistent key ordering.
  private serializeProjectData = (): string => {
    const projectData = this.generateProjectData()
    return JSON.stringify(projectData)
  }

  // Set the initial state baseline for change detection.
  private captureInitialState = () => {
    this.initialState = this.serializeProjectData()
  }

  getProjectDocumentString = () => this.serializeProjectData()
  getProjectDocumentData = () => this.generateProjectData()

  checkUnsavedChanges = () => {
    const currentState = this.serializeProjectData()
    const hasChanges = currentState !== this.initialState
    return hasChanges
  }

  save = cleanAsync<{ didSucceed: boolean }>(async () => {
    if (!authStore.authUser) throw new Error('User must be authenticated to save project')
    const supabase = createSupabaseClient()
    const projectData = this.getProjectDocumentData()

    const { error } = await supabase
      .from('all_projects')
      .upsert(projectData as any)

    if (error) throw new Error(`Failed to save project: ${error.message}`)
    this.updatedAt = new Date()
    this.isSaved = true
    this.isDirty = false
    console.log('Saved project: ', projectData)
    this.captureInitialState()
    return { didSucceed: true }
  })

  saveClone = cleanAsync<{ didSucceed: boolean, newProjectId: string }>(async () => {
    if (!authStore.authUser) throw new Error('User must be authenticated to save project')
    const supabase = createSupabaseClient()
    const newProjectId = crypto.randomUUID()
    const clonedTitle = `${this.title} (Clone)`

    const projectData = this.getProjectDocumentData()
    projectData.id = newProjectId
    projectData.title = clonedTitle
    projectData.userId = authStore.authUser.id
    projectData.createdAt = new Date()
    projectData.updatedAt = new Date()

    const { error } = await supabase
      .from('all_projects')
      .insert(projectData as any)

    if (error) throw new Error(`Failed to save clone: ${error.message}`)

    this.isSaved = true
    this.isDirty = false
    this.captureInitialState()
    console.log('Saved cloned project: ', projectData)

    return { didSucceed: true, newProjectId }
  })

  load = async (projectId: string) => {
    this.isLoading = true

    try {
      const projectResult = await getProjectById(projectId)
      const project = projectResult.data

      if (projectResult.error || !project) {
        throw new Error(`Failed to load project: ${projectResult.error?.message || 'Not found'}`)
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
      this.patternZoomLevel = project.patternZoomLevel ?? 32
      this.progressionZoomLevel = project.progressionZoomLevel ?? 82
      this.isPublic = project.isPublic
      this.createdAt = new Date(project.createdAt)
      this.updatedAt = new Date(project.updatedAt)
      this.baseProgressionItems = project.progressionChords || []
      this.patternSignals = project.patternSignals || []

      const hasValidSignalRows = project.patternSignalRows &&
        typeof project.patternSignalRows === 'object' &&
        Object.keys(project.patternSignalRows).length > 0

      this.patternSignalRows = hasValidSignalRows ? project.patternSignalRows : getFreshPatternSignalRows()
      const hasProgressionItems = this.baseProgressionItems.length > 0
      this.selectedProgressionItemId = hasProgressionItems ? this.baseProgressionItems[0].id : null

      this.isSaved = true
      this.isDirty = false

      // Capture the initial state AFTER all properties are set
      this.captureInitialState()

      return { success: true }
    } catch (error) {
      throw error
    } finally {
      this.isLoading = false
    }
  }

  delete = async () => {
    if (!authStore.authUser) {
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
    const userId = this.userId
    const blankProjectData = createNewProjectData(userId)
    Object.assign(this, blankProjectData)
    this.baseProgressionItems = []
    this.selectedProgressionItemId = null
    this.activeView = 'chords'
    this.isSaved = false
    this.isDirty = false
    this.captureInitialState()
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
