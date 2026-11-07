import { getContext } from 'svelte'

type ProjectEditorStateT = {
  project: ProjectT
  isLoading: boolean
  isSaving: boolean
  isDirty: boolean
  cleanProjectSnapshot: string
  activeView: 'chords' | 'pattern'
  selectedProgressionItemId: string | null
  // True while the user works in the pattern editor. The
  // progression's keyboard commands stand down meanwhile.
  isPatternEditorActive: boolean
}

type ProjectEditorContextT = {
  state: ProjectEditorStateT
  updateProject: (updates: Partial<ProjectT>) => void
  updateProgressionItem: (updatedItem: Partial<ProgressionItemT>) => void
  addProgressionChord: (chord: ChordT) => void
  addProgressionRest: () => void
  removeProgressionItem: (id: string) => void
  duplicateProgressionItem: (id: string) => void
  reorderProgressionItem: (args: { itemId: string; newIndex: number }) => void
  addPatternSignal: (signal: SignalT) => void
  updatePatternSignal: (signalId: string, updates: Partial<SignalT>) => void
  removePatternSignal: (signalId: string) => void
  movePatternSignalToRow: (args: MoveSignalToRowOptionsT) => void
  replacePattern: (pattern: {
    patternSignals: SignalT[]
    patternSignalRows: SignalRowsT
    patternDurationBars: number
  }) => void
  // Each returns a short description of the step, or null
  // when there was nothing to undo or redo.
  undoChange: () => string | null
  redoChange: () => string | null
  updateGridChordModifiers: (args: {
    chordId: string
    octaveOffset?: number
    inversion?: number
    voicing?: VoicingT
  }) => void
  save: () => Promise<{ didSucceed: boolean }>
  saveClone: () => Promise<{ didSucceed: boolean; newProjectId: string }>
  checkIsDirty: () => boolean
}

export const useProjectEditor = (): ProjectEditorContextT => {
  return getContext<ProjectEditorContextT>('projectEditor')
}
