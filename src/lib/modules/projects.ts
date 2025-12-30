import { goto } from "$app/navigation"
import { SIGNAL_ROWS } from "$lib/constants/signalRows"
import { supabase } from "$lib/supabase/client"

export const getFreshPatternSignalRows = () => {
  return JSON.parse(JSON.stringify(SIGNAL_ROWS))
}

// can create a new project data from scratch (just needing the userId to assign it to)
// or can derive the new project data from an existing project / offer flexibility with overrides.
export const createNewProjectData = (userId: string, overrides: Partial<ProjectT> = {}): ProjectT => {
  const progressionChords = overrides.progressionChords ?? []
  const progressionDurationBars = calculateProgressionDurationBars(progressionChords)

  const newProject = {
    id: crypto.randomUUID(),
    userId: overrides.userId ?? userId,
    title: overrides.title ?? 'New Project',
    description: overrides.description ?? '',
    bpm: overrides.bpm ?? 124,
    key: overrides.key ?? 'C',
    scale: overrides.scale ?? 'Major',
    octave: overrides.octave ?? '3',
    minVelocity: overrides.minVelocity ?? 70,
    maxVelocity: overrides.maxVelocity ?? 80,
    patternDurationBars: overrides.patternDurationBars ?? 1,
    isPublic: overrides.isPublic ?? false, // TODO: Once public, cant make private??? Or is that not ok?
    progressionDurationBars: overrides.progressionDurationBars ?? progressionDurationBars,
    progressionChords,
    chordSymbols: overrides.chordSymbols ?? [],
    patternSignals: overrides.patternSignals ?? [],
    patternSignalRows: overrides.patternSignalRows ?? getFreshPatternSignalRows(), // TODO: Eliminate necessity for patternSignalRows.
    progressionZoomLevel: overrides.progressionZoomLevel ?? 82,
    patternZoomLevel: overrides.patternZoomLevel ?? 32,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  return newProject
}

const calculateProgressionDurationBars = (progressionChords: ProgressionItemT[]): number => {
  const hasNoChords = progressionChords.length === 0
  if (hasNoChords) return 0
  const totalBeats = progressionChords.reduce((total, item) => total + item.durationBeats, 0)
  const totalBars = totalBeats / 4
  return totalBars
}

// update title, override userId. allow flexibility for other overrides.
export const createClonedProjectData = (userId: string, overrides: Partial<ProjectT> = {}): ProjectT => {
  const newTitle = `${overrides.title} (Clone)`
  const clonedProject = createNewProjectData(userId, { ...overrides, title: newTitle })
  return clonedProject
}

// overwrite or create a new project in the database.
export const saveProject = async (project: ProjectT): Promise<any> => {
  console.log('saveProject called for project:', project)
  console.log('About to call supabase upsert...')

  try {
    console.log('Supabase client exists:', !!supabase)
    console.log('Calling upsert now...')

    const supabaseSaveResult = await supabase
      .from('all_projects')
      .upsert(project as any)
      .select()

    console.log('Upsert completed, result:', supabaseSaveResult)
    console.log('Result data:', supabaseSaveResult.data)
    console.log('Result error:', supabaseSaveResult.error)

    return supabaseSaveResult
  } catch (error) {
    console.error('Error in saveProject catch block:', error)
    throw error
  }
}

export const deleteProject = async (id: string) => {

  const supabaseDeleteResult = await supabase
    .from('all_projects')
    .delete()
    .eq('id', id)

  return supabaseDeleteResult
}

export const goToProjectEditor = (id: string) => {
  goto(`/project/editor/${id}`)
}

export const loadProject = async (id: string): Promise<any> => {


  const supabaseLoadResult = await supabase
    .from('all_projects')
    .select('*')
    .eq('id', id)
    .single()


  return supabaseLoadResult
}