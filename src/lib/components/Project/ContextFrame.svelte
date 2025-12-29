<script lang="ts">
	import { createNewProjectData, loadProject, saveProject } from '$lib/modules/projects'
	import { authStore } from '$lib/stores/auth.svelte'
	import { getFreshPatternSignalRows } from '$lib/modules/projects'
	import { getContext, onMount, setContext } from 'svelte'
	import { browser } from '$app/environment'
	import chordsByScale from '$lib/constants/chordsByScale.json'
	import { generateChord } from '$lib/helpers/chords'

	const props = $props()

	type GridChordModifiersT = {
		octaveOffset: number
		inversion: number
		voicing: VoicingT
	}

	type GridChordMapT = {
		[chordId: string]: GridChordModifiersT
	}

	type ProjectEditorStateT = {
		project: ProjectT
		isLoading: boolean
		isSaving: boolean
		isDirty: boolean
		cleanProjectSnapshot: string
		activeView: 'chords' | 'pattern'
		selectedProgressionItemId: string | null
		gridChordModifiers: GridChordMapT
	}

	type ProjectEditorContextT = {
		state: ProjectEditorStateT
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
		updateGridChordModifiers: (args: {
			chordId: string
			octaveOffset?: number
			inversion?: number
			voicing?: VoicingT
		}) => void
		getGridChordIdForName: (name: string) => string
		getDefaultGridChordModifiers: () => GridChordModifiersT
		save: () => Promise<{ didSucceed: boolean }>
		saveClone: () => Promise<{ didSucceed: boolean; newProjectId: string }>
		checkIsDirty: () => boolean
	}

	const createCleanSnapshot = (project: ProjectT): string => {
		const { createdAt, updatedAt, ...rest } = project
		return JSON.stringify(rest)
	}

	const calculateProgressionDurationBars = (progressionChords: ProgressionItemT[]): number => {
		const hasNoChords = progressionChords.length === 0
		if (hasNoChords) return 0
		const totalBeats = progressionChords.reduce((total, item) => total + item.durationBeats, 0)
		const totalBars = totalBeats / 4
		return totalBars
	}

	const createInitialState = (): ProjectEditorStateT => {
		// Create a minimal placeholder state that doesn't require auth
		// This works for both SSR and initial client hydration
		const emptyProject = {
			id: '',
			title: '',
			description: '',
			userId: '',
			isPublic: false,
			key: 'C',
			scale: 'Major',
			octave: '3',
			bpm: 120,
			minVelocity: 70,
			maxVelocity: 80,
			progressionDurationBars: 0,
			progressionChords: [],
			chordSymbols: [],
			patternSignals: [],
			patternSignalRows: {},
			patternDurationBars: 1,
			patternZoomLevel: 32,
			progressionZoomLevel: 82,
			createdAt: new Date(),
			updatedAt: new Date()
		} as ProjectT

		return {
			project: emptyProject,
			isLoading: true,
			isSaving: false,
			isDirty: false,
			cleanProjectSnapshot: '{}',
			activeView: 'chords',
			selectedProgressionItemId: null,
			gridChordModifiers: {}
		}
	}

	const editorState = $state<ProjectEditorStateT>(createInitialState())

	const checkIsDirty = (): boolean => {
		const currentSnapshot = createCleanSnapshot(editorState.project)
		return currentSnapshot !== editorState.cleanProjectSnapshot
	}

	const updateProject = (updates: Partial<ProjectT>) => {
		editorState.project = { ...editorState.project, ...updates }

		// Recalculate progressionDurationBars if progressionChords changed
		const hasProgressionChordsUpdate = updates.progressionChords !== undefined
		if (hasProgressionChordsUpdate) {
			editorState.project.progressionDurationBars = calculateProgressionDurationBars(editorState.project.progressionChords)
		}

		editorState.isDirty = checkIsDirty()
	}

	const updateProgressionItem = (updatedItem: Partial<ProgressionItemT>) => {
		const updatedItems = editorState.project.progressionChords.map((item) => {
			const isTargetItem = item.id === updatedItem.id
			if (!isTargetItem) return item
			return { ...item, ...updatedItem } as ProgressionItemT
		})
		updateProject({ progressionChords: updatedItems })
	}

	const selectProgressionItem = (id: string | null) => {
		editorState.selectedProgressionItemId = id
	}

	const addProgressionChord = (chord: ChordT) => {
		const chordWithTimelineData: ProgressionChordT = {
			...chord,
			type: 'chord',
			startTime: 0,
			durationBeats: 4
		}

		const updatedItems = [...editorState.project.progressionChords, chordWithTimelineData]
		updateProject({ progressionChords: updatedItems })
		editorState.selectedProgressionItemId = chordWithTimelineData.id
	}

	const addProgressionRest = () => {
		const restItem: ProgressionRestT = {
			id: `rest-${Date.now()}`,
			type: 'rest',
			symbol: 'REST',
			rootNote: 'REST',
			startTime: 0,
			durationBeats: 4
		}

		const updatedItems = [...editorState.project.progressionChords, restItem]
		updateProject({ progressionChords: updatedItems })
		editorState.selectedProgressionItemId = restItem.id
	}

	const removeProgressionItem = (id: string) => {
		const wasSelected = editorState.selectedProgressionItemId === id
		const updatedItems = editorState.project.progressionChords.filter((item) => item.id !== id)
		updateProject({ progressionChords: updatedItems })

		if (wasSelected) {
			const hasItemsRemaining = updatedItems.length > 0
			if (hasItemsRemaining) {
				const lastItem = updatedItems[updatedItems.length - 1]
				editorState.selectedProgressionItemId = lastItem.id
			} else {
				editorState.selectedProgressionItemId = null
			}
		}
	}

	const duplicateProgressionItem = (id: string) => {
		const originalItem = editorState.project.progressionChords.find((item) => item.id === id)
		if (!originalItem) return

		const duplicatedItem: ProgressionItemT = {
			...originalItem,
			id: `${originalItem.id}-${Date.now()}`,
			startTime: 0
		} as ProgressionItemT

		const originalIndex = editorState.project.progressionChords.findIndex((item) => item.id === id)
		const updatedItems = [...editorState.project.progressionChords]
		updatedItems.splice(originalIndex + 1, 0, duplicatedItem)

		updateProject({ progressionChords: updatedItems })
	}

	const reorderProgressionItem = (args: { itemId: string; newIndex: number }) => {
		const itemIndex = editorState.project.progressionChords.findIndex((item) => item.id === args.itemId)
		if (itemIndex === -1) return

		const item = editorState.project.progressionChords[itemIndex]
		const updatedItems = [...editorState.project.progressionChords]
		updatedItems.splice(itemIndex, 1)
		updatedItems.splice(args.newIndex, 0, item)

		updateProject({ progressionChords: updatedItems })
	}

	const addPatternSignal = (signal: SignalT) => {
		const updatedSignals = [...editorState.project.patternSignals, signal]
		updateProject({ patternSignals: updatedSignals })
	}

	const updatePatternSignal = (signalId: string, updates: Partial<SignalT>) => {
		const updatedSignals = editorState.project.patternSignals.map((signal) => {
			const isTargetSignal = signal.id === signalId
			if (!isTargetSignal) return signal
			return { ...signal, ...updates }
		})
		updateProject({ patternSignals: updatedSignals })
	}

	const removePatternSignal = (signalId: string) => {
		const updatedSignals = editorState.project.patternSignals.filter((signal) => signal.id !== signalId)

		const updatedSignalRows = { ...editorState.project.patternSignalRows }
		for (const rowKey in updatedSignalRows) {
			const row = updatedSignalRows[rowKey]
			row.signalIds = row.signalIds.filter((id: string) => id !== signalId)
		}

		updateProject({
			patternSignals: updatedSignals,
			patternSignalRows: updatedSignalRows
		})
	}

	const movePatternSignalToRow = (args: MoveSignalToRowOptionsT) => {
		const updatedSignalRows = { ...editorState.project.patternSignalRows }
		const fromRow = updatedSignalRows[args.fromRowId]
		const toRow = updatedSignalRows[args.toRowId]

		fromRow.signalIds = fromRow.signalIds.filter((id: string) => id !== args.signalId)
		toRow.signalIds = [...toRow.signalIds, args.signalId]

		updateProject({ patternSignalRows: updatedSignalRows })
	}

	const getDefaultGridChordModifiers = (): GridChordModifiersT => {
		return {
			octaveOffset: 0,
			inversion: 0,
			voicing: 'closed'
		}
	}

	const getGridChordIdForName = (name: string): string => {
		const scale = editorState.project.key + ' ' + editorState.project.scale
		return `grid-${scale}-${name}`
	}

	const updateGridChordModifiers = (args: {
		chordId: string
		octaveOffset?: number
		inversion?: number
		voicing?: VoicingT
	}) => {
		const currentModifiers = editorState.gridChordModifiers[args.chordId] || getDefaultGridChordModifiers()

		editorState.gridChordModifiers[args.chordId] = {
			octaveOffset: args.octaveOffset ?? currentModifiers.octaveOffset,
			inversion: args.inversion ?? currentModifiers.inversion,
			voicing: args.voicing ?? currentModifiers.voicing
		}
	}

	const gridChords = $derived.by(() => {
		const scale = editorState.project.key + ' ' + editorState.project.scale
		const inScaleChordNames = chordsByScale[scale as keyof typeof chordsByScale]

		if (!inScaleChordNames) return []

		const chords: ChordT[] = inScaleChordNames.map((name) => {
			const chordId = getGridChordIdForName(name)
			const modifiers = editorState.gridChordModifiers[chordId] || getDefaultGridChordModifiers()

			const baseChord = generateChord({
				name,
				baseOctave: String(editorState.project.octave)
			})

			const chord: ChordT = {
				...baseChord,
				id: chordId,
				octaveOffset: modifiers.octaveOffset,
				inversion: modifiers.inversion,
				voicing: modifiers.voicing
			}

			return chord
		})

		return chords
	})

	const getGridChord = (chordId: string): ChordT | undefined => {
		return gridChords.find((chord) => chord.id === chordId)
	}

	const save = async (): Promise<{ didSucceed: boolean }> => {
		if (!authStore.authUser) throw new Error('User must be authenticated to save project')
		editorState.isSaving = true

		try {
			// Parse the clean snapshot to check the original owner
			const cleanProject = JSON.parse(editorState.cleanProjectSnapshot) as Partial<ProjectT>
			const isOtherUsersProject = cleanProject.userId && cleanProject.userId !== authStore.authUser.id

			// If this is another user's project, create a new one (clone)
			if (isOtherUsersProject) {
				const newProjectId = crypto.randomUUID()
				const projectToSave = {
					...editorState.project,
					id: newProjectId,
					userId: authStore.authUser.id,
					createdAt: new Date(),
					updatedAt: new Date()
				}

				const supabaseSaveResult = await saveProject(projectToSave)

				if (supabaseSaveResult.error) {
					throw new Error(`Failed to save cloned project: ${supabaseSaveResult.error.message}`)
				}

				const syncedProject = (supabaseSaveResult.data?.[0] as unknown as ProjectT) || projectToSave

				editorState.project = syncedProject
				editorState.cleanProjectSnapshot = createCleanSnapshot(syncedProject)
				editorState.isDirty = false

				console.log('Saved cloned project:', syncedProject)
				return { didSucceed: true }
			}

			// Otherwise, update the existing project
			const projectToSave = {
				...editorState.project,
				userId: authStore.authUser.id,
				updatedAt: new Date()
			}

			const supabaseSaveResult = await saveProject(projectToSave)

			if (supabaseSaveResult.error) {
				throw new Error(`Failed to save project: ${supabaseSaveResult.error.message}`)
			}

			// Use synced data if available, otherwise use the project we just saved
			const syncedProject = (supabaseSaveResult.data?.[0] as unknown as ProjectT) || projectToSave

			editorState.project = syncedProject
			editorState.cleanProjectSnapshot = createCleanSnapshot(syncedProject)
			editorState.isDirty = false

			console.log('Saved project:', syncedProject)
			return { didSucceed: true }
		} catch (error) {
			console.error('Save error:', error)
			throw error
		} finally {
			editorState.isSaving = false
		}
	}

	const saveClone = async (): Promise<{ didSucceed: boolean; newProjectId: string }> => {
		if (!authStore.authUser) throw new Error('User must be authenticated to save clone')

		editorState.isSaving = true

		try {
			const newProjectId = crypto.randomUUID()
			const clonedTitle = `${editorState.project.title} (Clone)`

			const projectToSave = {
				...editorState.project,
				id: newProjectId,
				title: clonedTitle,
				userId: authStore.authUser.id,
				createdAt: new Date(),
				updatedAt: new Date()
			}

			const supabaseSaveResult = await saveProject(projectToSave)

			if (supabaseSaveResult.error) {
				throw new Error(`Failed to save clone: ${supabaseSaveResult.error.message}`)
			}

			console.log('Saved cloned project:', projectToSave)
			return { didSucceed: true, newProjectId }
		} catch (error) {
			console.error('Save clone error:', error)
			throw error
		} finally {
			editorState.isSaving = false
		}
	}

	const loadProjectData = async (projectId: string) => {
		editorState.isLoading = true

		const supabaseLoadResult = await loadProject(projectId)

		if (supabaseLoadResult.error) {
			throw new Error(`Failed to load project: ${supabaseLoadResult.error.message}`)
		}

		const projectData = supabaseLoadResult.data as unknown as ProjectT

		const hasValidSignalRows =
			projectData.patternSignalRows &&
			typeof projectData.patternSignalRows === 'object' &&
			Object.keys(projectData.patternSignalRows).length > 0

		const patternSignalRows = hasValidSignalRows ? projectData.patternSignalRows : getFreshPatternSignalRows()

		// Calculate progressionDurationBars from progressionChords if not present
		const progressionDurationBars =
			projectData.progressionDurationBars ?? calculateProgressionDurationBars(projectData.progressionChords)

		const loadedProject = {
			...projectData,
			createdAt: new Date(projectData.createdAt),
			updatedAt: new Date(projectData.updatedAt),
			patternSignalRows,
			progressionDurationBars
		}

		editorState.project = loadedProject
		editorState.cleanProjectSnapshot = createCleanSnapshot(loadedProject)
		editorState.isDirty = false
		editorState.isLoading = false

		// If this project belongs to another user, mark it as a clone
		const isOtherUsersProject = authStore.authUser && loadedProject.userId !== authStore.authUser.id
		if (isOtherUsersProject) {
			const clonedTitle = `${loadedProject.title} (Clone)`
			editorState.project = { ...loadedProject, title: clonedTitle }
			editorState.isDirty = true
		}

		const hasProgressionItems = loadedProject.progressionChords.length > 0
		editorState.selectedProgressionItemId = hasProgressionItems ? loadedProject.progressionChords[0].id : null

		console.log('current auth stuff', authStore.authUser)
		console.log('Loaded project:', { projectData, loadedProject, stateProject: editorState.project })
	}

	const context: ProjectEditorContextT = {
		state: editorState,
		get gridChords() {
			return gridChords
		},
		updateProject,
		updateProgressionItem,
		addProgressionChord,
		addProgressionRest,
		removeProgressionItem,
		duplicateProgressionItem,
		reorderProgressionItem,
		selectProgressionItem,
		addPatternSignal,
		updatePatternSignal,
		removePatternSignal,
		movePatternSignalToRow,
		getGridChord,
		updateGridChordModifiers,
		getGridChordIdForName,
		getDefaultGridChordModifiers,
		save,
		saveClone,
		checkIsDirty
	}

	setContext('projectEditor', context)

	onMount(() => {
		if (!browser) return

		const url = new URL(window.location.href)
		const pathParts = url.pathname.split('/')
		const projectId = pathParts[pathParts.length - 1]

		if (projectId) {
			loadProjectData(projectId)
		}

		return () => {
			// when user navigates away, stop playback from PlaybackContextFrame context
			const playbackContext = getContext<PlaybackContextT>('playback')
			playbackContext.stop()
		}
	})
</script>

{@render props.children()}
