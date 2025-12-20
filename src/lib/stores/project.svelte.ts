import { SIGNAL_ROWS } from "$lib/constants/signalRows"
import { createSupabaseClient } from '$lib/supabase/client'
import authStore from './auth.svelte'

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
    if (!authStore.user) {
      throw new Error('User must be authenticated to save project')
    }

    const supabase = createSupabaseClient()
    const userId = authStore.user.id

    // Prepare project data
    const projectData: DatabaseT['public']['Tables']['projects']['Insert'] = {
      id: this.id,
      user_id: userId,
      title: this.title,
      description: this.description,
      key: this.key,
      scale: this.scale,
      octave: this.octave,
      bpm: this.bpm,
      min_velocity: this.minVelocity,
      max_velocity: this.maxVelocity,
      pattern_duration_bars: this.patternDurationBars,
      is_public: this.isPublic
    }

    // Upsert project
    const { error: projectError } = await supabase
      .from('projects')
      .upsert(projectData)

    if (projectError) {
      throw new Error(`Failed to save project: ${projectError.message}`)
    }

    // Delete existing signals and progression items (will be replaced)
    await supabase.from('pattern_signals').delete().eq('project_id', this.id)
    await supabase.from('progression_items').delete().eq('project_id', this.id)

    // Save pattern signals
    if (this.patternSignals.length > 0) {
      const signalsData = this.patternSignals.map((signal) => ({
        project_id: this.id,
        signal_id: signal.id,
        row_id: signal.rowId,
        start_time: signal.startTime,
        duration: signal.duration,
        note: signal.note,
        velocity: signal.velocity
      }))

      const { error: signalsError } = await supabase
        .from('pattern_signals')
        .insert(signalsData)

      if (signalsError) {
        throw new Error(`Failed to save pattern signals: ${signalsError.message}`)
      }
    }

    // Save progression items
    if (this.progressionChords.length > 0) {
      const progressionData = this.progressionChords.map((item, index) => {
        const baseData = {
          project_id: this.id,
          item_type: item.type as 'chord' | 'rest',
          chord_id: item.id,
          symbol: item.symbol,
          root_note: item.rootNote,
          duration_beats: item.durationBeats,
          position: index
        }

        if (item.type === 'chord') {
          return {
            ...baseData,
            color: item.color,
            inversion: item.inversion,
            octave_offset: item.octaveOffset,
            voicing: item.voicing,
            bass_note: item.bassNote
          }
        }

        return baseData
      })

      const { error: progressionError } = await supabase
        .from('progression_items')
        .insert(progressionData)

      if (progressionError) {
        throw new Error(`Failed to save progression: ${progressionError.message}`)
      }
    }

    this.updatedAt = new Date()
    this.isSaved = true
    this.isDirty = false

    return { success: true }
  }

  load = async (projectId: string) => {
    const supabase = createSupabaseClient()

    // Load project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      throw new Error(`Failed to load project: ${projectError?.message || 'Not found'}`)
    }

    // Load pattern signals
    const { data: signals, error: signalsError } = await supabase
      .from('pattern_signals')
      .select('*')
      .eq('project_id', projectId)

    if (signalsError) {
      throw new Error(`Failed to load pattern signals: ${signalsError.message}`)
    }

    // Load progression items
    const { data: progressionItems, error: progressionError } = await supabase
      .from('progression_items')
      .select('*')
      .eq('project_id', projectId)
      .order('position')

    if (progressionError) {
      throw new Error(`Failed to load progression: ${progressionError.message}`)
    }

    // Update store with loaded data
    this.id = project.id
    this.title = project.title
    this.description = project.description
    this.userId = project.user_id
    this.key = project.key
    this.scale = project.scale
    this.octave = project.octave
    this.bpm = project.bpm
    this.minVelocity = project.min_velocity
    this.maxVelocity = project.max_velocity
    this.patternDurationBars = project.pattern_duration_bars
    this.isPublic = project.is_public
    this.createdAt = new Date(project.created_at)
    this.updatedAt = new Date(project.updated_at)

    // Map signals
    this.patternSignals = (signals || []).map((s) => ({
      id: s.signal_id,
      rowId: s.row_id,
      startTime: s.start_time,
      duration: s.duration,
      note: s.note,
      velocity: s.velocity
    }))

    // Map progression items
    this.progressionChords = (progressionItems || []).map((item) => {
      const baseItem = {
        id: item.chord_id,
        type: item.item_type as 'chord' | 'rest',
        symbol: item.symbol,
        rootNote: item.root_note,
        durationBeats: item.duration_beats,
        startTime: 0 // Will be calculated by progression store
      }

      if (item.item_type === 'chord') {
        return {
          ...baseItem,
          color: item.color || 'blue',
          inversion: item.inversion || 0,
          octaveOffset: item.octave_offset || 0,
          voicing: item.voicing || 'closed',
          bassNote: item.bass_note || ''
        } as ProgressionChordT
      }

      return baseItem as ProgressionRestT
    })

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
      .from('projects')
      .delete()
      .eq('id', this.id)

    if (error) {
      throw new Error(`Failed to delete project: ${error.message}`)
    }

    return { success: true }
  }
}

export const createProjectStore = (projectData: Partial<ProjectT> = {}) => {
  const store = new ProjectStore()
  Object.assign(store, projectData)
  return store
}

const projectStore = createProjectStore()
export default projectStore
