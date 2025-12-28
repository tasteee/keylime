import { getContext } from 'svelte'

type ProjectEditorStateT = {
  project: ProjectT
  isLoading: boolean
  isSaving: boolean
  isDirty: boolean
  cleanProjectSnapshot: string
  activeView: 'chords' | 'pattern'
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
  save: () => Promise<{ didSucceed: boolean }>
  saveClone: () => Promise<{ didSucceed: boolean; newProjectId: string }>
  checkIsDirty: () => boolean
}

export const useProjectEditor = (): ProjectEditorContextT => {
  return getContext<ProjectEditorContextT>('projectEditor')
}
