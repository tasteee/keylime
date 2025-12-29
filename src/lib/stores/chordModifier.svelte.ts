import playbackStore from './playback.svelte'
import { generateChord, applyVoicingAndInversion } from '$lib/helpers/chords'
import { Note } from 'tonal'
import { getContext } from 'svelte'

type ProjectEditorContextT = {
  state: {
    project: ProjectT
    isLoading: boolean
    isSaving: boolean
    isDirty: boolean
    cleanProjectSnapshot: string
    activeView: 'chords' | 'pattern'
    selectedProgressionItemId: string | null
  }
  gridChords: ChordT[]
  updateProject: (updates: Partial<ProjectT>) => void
  updateProgressionItem: (updatedItem: Partial<ProgressionItemT>) => void
  addProgressionChord: (chord: ChordT) => void
  addProgressionRest: () => void
  removeProgressionItem: (id: string) => void
  duplicateProgressionItem: (id: string) => void
  reorderProgressionItem: (args: { itemId: string; newIndex: number }) => void
  selectProgressionItem: (id: string | null) => void
  addPatternSignal: (signal: SignalT) => void
  updatePatternSignal: (signalId: string, updates: Partial<SignalT>) => void
  removePatternSignal: (signalId: string) => void
  movePatternSignalToRow: (args: MoveSignalToRowOptionsT) => void
  getGridChord: (chordId: string) => ChordT | undefined
  updateGridChordModifiers: (args: { chordId: string; octaveOffset?: number; inversion?: number; voicing?: VoicingT }) => void
  save: () => Promise<{ didSucceed: boolean }>
  saveClone: () => Promise<{ didSucceed: boolean; newProjectId: string }>
  checkIsDirty: () => boolean
}

type ChordSourceT = 'grid' | 'progression'

type ChordModifierStateT = {
  isOpen: boolean
  chordId: string | null
  source: ChordSourceT | null
  // Modifiers (used by both grid and progression chords)
  octaveOffset: number
  inversion: number
  voicing: VoicingT
}

type InitialStateSnapshotT = {
  octaveOffset: number
  inversion: number
  voicing: VoicingT
}

class ChordModifierStore {
  state: ChordModifierStateT = $state({
    isOpen: false,
    chordId: null,
    source: null,
    octaveOffset: 0,
    inversion: 0,
    voicing: 'closed'
  })

  private initialStateSnapshot: InitialStateSnapshotT | null = null

  private getProjectEditorContext = (): ProjectEditorContextT => {
    return getContext<ProjectEditorContextT>('projectEditor')
  }

  // Get the current chord being modified (fully computed with all modifications)
  currentChord = $derived.by(() => {
    const isModifierOpen = this.state.isOpen
    if (!isModifierOpen) return null

    const context = this.getProjectEditorContext()

    const isProgressionChord = this.state.source === 'progression'
    if (isProgressionChord) {
      const progressionChord = context.state.project.progressionChords.find((c) => c.id === this.state.chordId)
      if (!progressionChord) return null
      if (progressionChord.type !== 'chord') return null

      // Return the progression chord with current modifier values applied
      return this.applyModifiersToChord(progressionChord)
    }

    const isGridChord = this.state.source === 'grid'
    if (isGridChord) {
      const gridChord = context.getGridChord(this.state.chordId!)
      if (!gridChord) return null

      // Return the grid chord with current modifier values applied
      return this.applyModifiersToChord(gridChord)
    }

    return null
  })

  openForGridChord = (args: { chordId: string }) => {
    const context = this.getProjectEditorContext()
    const gridChord = context.getGridChord(args.chordId)
    if (!gridChord) return

    this.state.isOpen = true
    this.state.chordId = args.chordId
    this.state.source = 'grid'
    // Load existing modifiers from the grid chord
    this.state.octaveOffset = gridChord.octaveOffset
    this.state.inversion = gridChord.inversion
    this.state.voicing = gridChord.voicing as VoicingT
    // Save initial state for discard functionality
    this.initialStateSnapshot = {
      octaveOffset: gridChord.octaveOffset,
      inversion: gridChord.inversion,
      voicing: gridChord.voicing as VoicingT
    }
  }

  openForProgressionChord = (chordId: string) => {
    const context = this.getProjectEditorContext()
    const progressionChord = context.state.project.progressionChords.find((c) => c.id === chordId)
    if (!progressionChord) return
    if (progressionChord.type !== 'chord') return

    this.state.isOpen = true
    this.state.chordId = chordId
    this.state.source = 'progression'
    // Load existing modifiers from the progression chord
    this.state.octaveOffset = progressionChord.octaveOffset
    this.state.inversion = progressionChord.inversion
    this.state.voicing = progressionChord.voicing as VoicingT
    // Save initial state for discard functionality
    this.initialStateSnapshot = {
      octaveOffset: progressionChord.octaveOffset,
      inversion: progressionChord.inversion,
      voicing: progressionChord.voicing as VoicingT
    }

    console.log('Opened chord modifier for progression chord', chordId, 'with state', this.state)
  }

  closeDialog = () => {
    this.state.isOpen = false
    this.state.chordId = null
    this.state.source = null
    this.initialStateSnapshot = null
  }

  updateOctaveOffset = (value: number) => {
    this.state.octaveOffset = value
    this.saveToProgressionIfNeeded()
    this.playCurrentChord()
  }

  updateInversion = (value: number) => {
    this.state.inversion = value
    this.saveToProgressionIfNeeded()
    this.playCurrentChord()
  }

  updateVoicing = (value: VoicingT) => {
    this.state.voicing = value
    this.saveToProgressionIfNeeded()
    this.playCurrentChord()
  }

  resetModifiers = () => {
    this.state.octaveOffset = 0
    this.state.inversion = 0
    this.state.voicing = 'closed'
    this.saveToProgressionIfNeeded()
    this.playCurrentChord()
  }

  confirmChanges = () => {
    this.saveToProgressionIfNeeded()
    this.closeDialog()
  }

  discardChanges = () => {
    if (!this.initialStateSnapshot) {
      this.closeDialog()
      return
    }

    // Restore initial state
    this.state.octaveOffset = this.initialStateSnapshot.octaveOffset
    this.state.inversion = this.initialStateSnapshot.inversion
    this.state.voicing = this.initialStateSnapshot.voicing
    this.saveToProgressionIfNeeded()
    this.closeDialog()
  }

  private saveToProgressionIfNeeded = () => {
    const context = this.getProjectEditorContext()

    const isProgressionChord = this.state.source === 'progression'
    if (isProgressionChord) {
      const chordId = this.state.chordId
      if (!chordId) return

      context.updateProgressionItem({
        id: chordId,
        octaveOffset: this.state.octaveOffset,
        inversion: this.state.inversion,
        voicing: this.state.voicing
      })
      return
    }

    const isGridChord = this.state.source === 'grid'
    if (isGridChord) {
      const chordId = this.state.chordId
      if (!chordId) return

      context.updateGridChordModifiers({
        chordId,
        octaveOffset: this.state.octaveOffset,
        inversion: this.state.inversion,
        voicing: this.state.voicing
      })
    }
  }

  private playCurrentChord = () => {
    const chord = this.currentChord
    if (!chord) return
    const context = this.getProjectEditorContext()
    playbackStore.playChord(chord, String(context.state.project.octave), 500)
  }

  private applyModifiersToChord = (baseChord: ChordT): ChordT => {
    return {
      ...baseChord,
      octaveOffset: this.state.octaveOffset,
      inversion: this.state.inversion,
      voicing: this.state.voicing
    }
  }
}

const chordModifierStore = new ChordModifierStore()
export { chordModifierStore }
