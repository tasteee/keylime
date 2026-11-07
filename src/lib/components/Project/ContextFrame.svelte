<script lang="ts">
	import { createNewProjectData, loadProject, saveProject } from '$lib/modules/projects'
	import { useActiveUser } from '$lib/helpers/useActiveUser.svelte'
	import { getFreshPatternSignalRows } from '$lib/modules/projects'
	import { getContext, onMount, setContext } from 'svelte'
	import { browser } from '$app/environment'
	import { createChord, getScaleChordSymbols } from '$lib/music'
	import { calculateStartTimes } from '$lib/helpers/progression'
	import { clearDraft, readDraft, writeDraft } from '$lib/modules/localDraft'
	import { checkIsSameHistorySnapshot, describeHistoryChange, type HistorySnapshotT } from '$lib/helpers/historyDescriptions'
	import { toaster } from '@tasteee/zest'

	type PropsT = {
		children: () => any
		project: ProjectT | null
	}

	const props: PropsT = $props()
	const activeUser = useActiveUser()

	// voicing null means the chord follows the project's voicing.
	type GridChordModifiersT = {
		octaveOffset: number
		inversion: number
		voicing: VoicingT | null
	}

	type PatternSnapshotT = {
		patternSignals: SignalT[]
		patternSignalRows: SignalRowsT
		patternDurationBars: number
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
		// True while the user works in the pattern editor. The
		// progression's keyboard commands stand down meanwhile.
		isPatternEditorActive: boolean
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
		replacePattern: (pattern: PatternSnapshotT) => void
		undoChange: () => string | null
		redoChange: () => string | null
		getGridChord: (chordId: string) => ChordT | undefined
		updateGridChordModifiers: (args: {
			chordId: string
			octaveOffset?: number
			inversion?: number
			voicing?: VoicingT | null
		}) => void
		getGridChordIdForName: (name: string) => string
		getDefaultGridChordModifiers: () => GridChordModifiersT
		save: () => Promise<{ didSucceed: boolean }>
		saveClone: () => Promise<{ didSucceed: boolean; newProjectId: string }>
		checkIsDirty: () => boolean
	}

	const createCleanSnapshot = (project: ProjectT): string => {
		// Zoom is a view preference. Changing it must not make the
		// project dirty, so it stays out of the comparison.
		const { createdAt, updatedAt, patternZoomLevel, progressionZoomLevel, ...rest } = project
		return JSON.stringify(rest)
	}

	const calculateProgressionDurationBars = (progressionChords: ProgressionItemT[]): number => {
		const hasNoChords = progressionChords.length === 0
		if (hasNoChords) return 0
		const totalBeats = progressionChords.reduce((total, item) => total + item.durationBeats, 0)
		const totalBars = totalBeats / 4
		return totalBars
	}

	const parseProjectData = (project: ProjectT): ProjectT => {
		const parsedProgressionChords =
			typeof project.progressionChords === 'string' ? JSON.parse(project.progressionChords) : project.progressionChords

		const progressionChordsWithStartTime = calculateStartTimes({ items: parsedProgressionChords })

		return {
			...project,
			updatedAt: new Date(project.updatedAt),
			createdAt: new Date(project.createdAt),
			octave: Number(project.octave),
			progressionChords: progressionChordsWithStartTime,
			patternSignals:
				typeof project.patternSignals === 'string' ? JSON.parse(project.patternSignals) : project.patternSignals,
			patternSignalRows:
				typeof project.patternSignalRows === 'string' ? JSON.parse(project.patternSignalRows) : project.patternSignalRows
		}
	}

	const createInitialState = (): ProjectEditorStateT => {
		const propsProject = props.project
		const hasProjectData = propsProject !== null

		if (hasProjectData) {
			const parsedProject = parseProjectData(propsProject)

			const hasValidSignalRows =
				parsedProject.patternSignalRows &&
				typeof parsedProject.patternSignalRows === 'object' &&
				Object.keys(parsedProject.patternSignalRows).length > 0

			const patternSignalRows = hasValidSignalRows ? parsedProject.patternSignalRows : getFreshPatternSignalRows()

			const progressionDurationBars =
				parsedProject.progressionDurationBars ?? calculateProgressionDurationBars(parsedProject.progressionChords)

			const loadedProject = {
				...parsedProject,
				patternSignalRows,
				progressionDurationBars
			}

			const hasProgressionItems = loadedProject.progressionChords.length > 0
			const selectedProgressionItemId = hasProgressionItems ? loadedProject.progressionChords[0].id : null

			return {
				project: loadedProject,
				isLoading: false,
				isSaving: false,
				isDirty: false,
				cleanProjectSnapshot: createCleanSnapshot(loadedProject),
				activeView: 'chords',
				selectedProgressionItemId,
				isPatternEditorActive: false,
				gridChordModifiers: {}
			}
		}

		// Create a minimal placeholder state if no project data
		const emptyProject = {
			id: '',
			title: '',
			description: '',
			userId: '',
			isPublic: false,
			key: 'C',
			scale: 'Major',
			octave: 3,
			voicing: 'closed',
			dataVersion: 3,
			bpm: 120,
			minVelocity: 70,
			maxVelocity: 80,
			progressionDurationBars: 0,
			progressionChords: [],
			chordSymbols: [],
			patternSignals: [],
			patternSignalRows: {},
			patternDurationBars: 1,
			doesPatternResetOnChordChange: false,
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
			isPatternEditorActive: false,
			gridChordModifiers: {}
		}
	}

	const editorState = $state<ProjectEditorStateT>(createInitialState())

	const checkIsDirty = (): boolean => {
		const currentSnapshot = createCleanSnapshot(editorState.project)
		return currentSnapshot !== editorState.cleanProjectSnapshot
	}

	// One undo history for the pattern and the progression.
	// Every snapshot is a deep copy taken AFTER a change, so
	// edits that mutate rows in place cannot leak into older
	// entries. "baseline" is the project as it is right now.
	const HISTORY_LIMIT = 100
	// Edits this close together (a drag, a resize) count as one step.
	const HISTORY_GROUP_MS = 400
	// Each entry holds the project on one side of a step. A
	// label names the step when the edit knows better than a
	// diff can (a duplicate looks like an add otherwise).
	type HistoryEntryT = {
		snapshot: HistorySnapshotT
		label: string | null
	}

	let undoStack: HistoryEntryT[] = []
	let redoStack: HistoryEntryT[] = []
	// Set just before an edit to name its step, then cleared.
	let pendingHistoryLabel: string | null = null
	let lastHistoryEditAt = 0
	let isRestoringHistory = false

	const takeHistorySnapshot = (): HistorySnapshotT => {
		const project = editorState.project
		return structuredClone({
			patternSignals: $state.snapshot(project.patternSignals),
			patternSignalRows: $state.snapshot(project.patternSignalRows),
			patternDurationBars: project.patternDurationBars,
			progressionChords: $state.snapshot(project.progressionChords)
		})
	}

	let baseline: HistorySnapshotT | null = null

	const resetHistory = () => {
		undoStack = []
		redoStack = []
		lastHistoryEditAt = 0
		baseline = takeHistorySnapshot()
	}

	resetHistory()

	type RecordHistoryChangeOptionsT = { shouldStartNewStep: boolean }

	const recordHistoryChange = (options: RecordHistoryChangeOptionsT) => {
		const previousSnapshot = baseline
		const nextSnapshot = takeHistorySnapshot()
		const label = pendingHistoryLabel
		pendingHistoryLabel = null
		const hasPrevious = previousSnapshot !== null
		// A drag that lands on the same value changes nothing.
		const isUnchanged = hasPrevious && checkIsSameHistorySnapshot(previousSnapshot, nextSnapshot)
		if (isUnchanged) return

		const now = Date.now()
		const isSameStep = now - lastHistoryEditAt < HISTORY_GROUP_MS
		lastHistoryEditAt = now
		baseline = nextSnapshot

		const shouldKeepPrevious = hasPrevious && (options.shouldStartNewStep || !isSameStep)
		if (!shouldKeepPrevious) return

		undoStack.push({ snapshot: previousSnapshot, label })
		if (undoStack.length > HISTORY_LIMIT) undoStack.shift()
		redoStack = []
	}

	// Undo can remove the selected chord. Fall back to the
	// first chord so the pattern editor keeps a reference.
	const repairProgressionSelection = () => {
		const items = editorState.project.progressionChords
		const selectedId = editorState.selectedProgressionItemId
		const selectedItem = items.find((item) => item.id === selectedId)
		if (selectedItem) return
		const firstItem = items[0]
		editorState.selectedProgressionItemId = firstItem ? firstItem.id : null
	}

	const restoreSnapshot = (snapshot: HistorySnapshotT) => {
		isRestoringHistory = true
		updateProject(structuredClone(snapshot))
		isRestoringHistory = false
		baseline = takeHistorySnapshot()
		lastHistoryEditAt = 0
		repairProgressionSelection()
	}

	// Edits grouped into one step can cancel out (add, then
	// delete within a moment). Such a step would undo nothing,
	// so it is dropped and the next one is used instead.
	const popDistinctEntry = (stack: HistoryEntryT[], currentSnapshot: HistorySnapshotT): HistoryEntryT | null => {
		const entry = stack.pop()
		if (!entry) return null
		const isSameAsCurrent = checkIsSameHistorySnapshot(entry.snapshot, currentSnapshot)
		if (isSameAsCurrent) return popDistinctEntry(stack, currentSnapshot)
		return entry
	}

	// Returns what was undone, or null when there was nothing.
	const undoChange = (): string | null => {
		const currentSnapshot = baseline ?? takeHistorySnapshot()
		const previousEntry = popDistinctEntry(undoStack, currentSnapshot)
		if (!previousEntry) return null
		const diffDescription = describeHistoryChange(previousEntry.snapshot, currentSnapshot)
		const description = previousEntry.label ?? diffDescription
		redoStack.push({ snapshot: currentSnapshot, label: previousEntry.label })
		restoreSnapshot(previousEntry.snapshot)
		return description
	}

	// Returns what was redone, or null when there was nothing.
	const redoChange = (): string | null => {
		const currentSnapshot = baseline ?? takeHistorySnapshot()
		const nextEntry = popDistinctEntry(redoStack, currentSnapshot)
		if (!nextEntry) return null
		const diffDescription = describeHistoryChange(currentSnapshot, nextEntry.snapshot)
		const description = nextEntry.label ?? diffDescription
		undoStack.push({ snapshot: currentSnapshot, label: nextEntry.label })
		restoreSnapshot(nextEntry.snapshot)
		return description
	}

	const getIsHistoryUpdate = (updates: Partial<ProjectT>): boolean => {
		const hasSignals = updates.patternSignals !== undefined
		const hasRows = updates.patternSignalRows !== undefined
		const hasDuration = updates.patternDurationBars !== undefined
		const hasProgression = updates.progressionChords !== undefined
		return hasSignals || hasRows || hasDuration || hasProgression
	}

	const updateProject = (updates: Partial<ProjectT>) => {
		editorState.project = { ...editorState.project, ...updates }

		const shouldRecordHistory = getIsHistoryUpdate(updates) && !isRestoringHistory
		if (shouldRecordHistory) recordHistoryChange({ shouldStartNewStep: false })

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

		const isRest = originalItem.type === 'rest'
		const itemLabel = isRest ? 'rest' : originalItem.symbol
		pendingHistoryLabel = `Duplicate ${itemLabel}`
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

	// Swaps the whole pattern for another one as a single undo step.
	const replacePattern = (pattern: PatternSnapshotT) => {
		isRestoringHistory = true
		updateProject(pattern)
		isRestoringHistory = false
		recordHistoryChange({ shouldStartNewStep: true })
	}

	const getDefaultGridChordModifiers = (): GridChordModifiersT => {
		return {
			octaveOffset: 0,
			inversion: 0,
			voicing: null
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
		voicing?: VoicingT | null
	}) => {
		const currentModifiers = editorState.gridChordModifiers[args.chordId] || getDefaultGridChordModifiers()
		// null is a real choice here (follow the project), so only
		// a missing voicing keeps the current one.
		const isVoicingGiven = args.voicing !== undefined
		const nextVoicing = isVoicingGiven ? (args.voicing as VoicingT | null) : currentModifiers.voicing

		editorState.gridChordModifiers[args.chordId] = {
			octaveOffset: args.octaveOffset ?? currentModifiers.octaveOffset,
			inversion: args.inversion ?? currentModifiers.inversion,
			voicing: nextVoicing
		}
	}

	const gridChords = $derived.by(() => {
		const { key, scale } = editorState.project
		const symbols = getScaleChordSymbols(key, scale)

		const chords: ChordT[] = symbols.map((symbol) => {
			const chordId = getGridChordIdForName(symbol)
			const modifiers = editorState.gridChordModifiers[chordId] || getDefaultGridChordModifiers()
			return createChord(symbol, { id: chordId, ...modifiers })
		})

		return chords
	})

	const getGridChord = (chordId: string): ChordT | undefined => {
		return gridChords.find((chord) => chord.id === chordId)
	}

	// After a save, the editor keeps what the user was editing and only
	// takes the server's timestamps. Replacing the whole project with the
	// server copy reset fields such as the pattern duration.
	const mergeSavedProject = (savedProject: ProjectT, serverProject: ProjectT | null): ProjectT => {
		if (!serverProject) return savedProject
		const updatedAt = new Date(serverProject.updatedAt)
		const createdAt = new Date(serverProject.createdAt)
		return { ...savedProject, updatedAt, createdAt }
	}

	const save = async (): Promise<{ didSucceed: boolean }> => {
		console.log('ContextFrame save() called')
		console.log('activeUser:', activeUser)

		if (!activeUser) throw new Error('User must be authenticated to save project')

		editorState.isSaving = true

		try {
			// Parse the clean snapshot to check the original owner
			const cleanProject = JSON.parse(editorState.cleanProjectSnapshot) as Partial<ProjectT>
			const isOtherUsersProject = cleanProject.userId && cleanProject.userId !== activeUser.id

			console.log('cleanProject userId:', cleanProject.userId)
			console.log('current activeUser id:', activeUser.id)
			console.log('isOtherUsersProject:', isOtherUsersProject)

			// If this is another user's project, create a new one (clone)
			if (isOtherUsersProject) {
				console.log('Saving as clone (other user project)')
				const newProjectId = crypto.randomUUID()
				const projectToSave = {
					...editorState.project,
					id: newProjectId,
					userId: activeUser.id,
					createdAt: new Date(),
					updatedAt: new Date()
				}

				console.log('About to call saveProject() for clone')
				const saveResult = await saveProject(projectToSave)

				if (saveResult.error) {
					throw new Error(`Failed to save cloned project: ${saveResult.error.message}`)
				}

				const syncedProject = mergeSavedProject(projectToSave, saveResult.data as ProjectT | null)

				clearDraft(cleanProject.id as string)
				clearDraft(syncedProject.id)
				baseUpdatedAt = syncedProject.updatedAt
				editorState.project = syncedProject
				editorState.cleanProjectSnapshot = createCleanSnapshot(syncedProject)
				editorState.isDirty = false

				console.log('Saved cloned project:', syncedProject)
				return { didSucceed: true }
			}

			// Otherwise, update the existing project
			console.log('Saving as regular update (own project)')
			const projectToSave = {
				...editorState.project,
				userId: activeUser.id,
				updatedAt: new Date()
			}

			console.log('About to call saveProject() for update')
			const saveResult = await saveProject(projectToSave)

			console.log('saveProject() returned, checking result')
			if (saveResult.error) {
				throw new Error(`Failed to save project: ${saveResult.error.message}`)
			}

			// Use synced data if available, otherwise use the project we just saved
			const syncedProject = mergeSavedProject(projectToSave, saveResult.data as ProjectT | null)

			clearDraft(syncedProject.id)
			baseUpdatedAt = syncedProject.updatedAt
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
		if (!activeUser) throw new Error('User must be authenticated to save clone')

		editorState.isSaving = true

		try {
			const newProjectId = crypto.randomUUID()
			const clonedTitle = `${editorState.project.title} (Clone)`

			const projectToSave = {
				...editorState.project,
				id: newProjectId,
				title: clonedTitle,
				userId: activeUser.id,
				createdAt: new Date(),
				updatedAt: new Date()
			}

			const saveResult = await saveProject(projectToSave)

			if (saveResult.error) {
				throw new Error(`Failed to save clone: ${saveResult.error.message}`)
			}

			clearDraft(editorState.project.id)
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

		const loadResult = await loadProject(projectId)

		if (loadResult.error) {
			throw new Error(`Failed to load project: ${loadResult.error.message}`)
		}

		const projectData = loadResult.data as unknown as ProjectT

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
		resetHistory()
		editorState.cleanProjectSnapshot = createCleanSnapshot(loadedProject)
		editorState.isDirty = false
		editorState.isLoading = false

		// If this project belongs to another user, mark it as a clone
		const isOtherUsersProject = activeUser && loadedProject.userId !== activeUser.id
		if (isOtherUsersProject) {
			const clonedTitle = `${loadedProject.title} (Clone)`
			editorState.project = { ...loadedProject, title: clonedTitle }
			resetHistory()
			editorState.isDirty = true
		}

		const hasProgressionItems = loadedProject.progressionChords.length > 0
		editorState.selectedProgressionItemId = hasProgressionItems ? loadedProject.progressionChords[0].id : null

		console.log('current auth stuff', activeUser)
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
		replacePattern,
		undoChange,
		redoChange,
		getGridChord,
		updateGridChordModifiers,
		getGridChordIdForName,
		getDefaultGridChordModifiers,
		save,
		saveClone,
		checkIsDirty
	}

	setContext('projectEditor', context)

	// Edits are kept in this browser while the user works. The server
	// only hears about them when the user saves (button or Ctrl/Cmd+S).
	let isDraftReady = false
	// The server copy's updatedAt the current edits started from.
	let baseUpdatedAt: Date | string = props.project?.updatedAt ?? new Date()
	let draftTimer: ReturnType<typeof setTimeout> | undefined

	$effect(() => {
		const currentProject = editorState.project
		const currentSnapshot = createCleanSnapshot(currentProject)
		if (!browser || !isDraftReady || editorState.isLoading) return

		clearTimeout(draftTimer)
		const isDirty = currentSnapshot !== editorState.cleanProjectSnapshot
		if (!isDirty) return clearDraft(currentProject.id)

		draftTimer = setTimeout(() => writeDraft(currentProject, baseUpdatedAt), 500)
		return () => clearTimeout(draftTimer)
	})

	const restoreDraft = () => {
		const serverProject = props.project
		if (!serverProject) return
		const draft = readDraft(serverProject.id, serverProject.updatedAt)
		if (!draft) return
		editorState.project = parseProjectData(draft)
		resetHistory()
		editorState.isDirty = checkIsDirty()
	}

	const getIsTypingTarget = (target: EventTarget | null): boolean => {
		const element = target as HTMLElement | null
		if (!element) return false
		const tagName = element.tagName ?? ''
		const isFormField = ['INPUT', 'TEXTAREA', 'SELECT', 'Z-INPUT', 'Z-TEXTAREA'].includes(tagName)
		return isFormField || Boolean(element.isContentEditable)
	}

	type ShowHistoryToastArgsT = {
		action: 'undo' | 'redo'
		description: string | null
	}

	// One toast id, so quick repeated undos update it in place
	// instead of stacking.
	const showHistoryToast = (args: ShowHistoryToastArgsT) => {
		const isUndo = args.action === 'undo'
		const hasDescription = args.description !== null

		if (!hasDescription) {
			const emptyTitle = isUndo ? 'Nothing to undo' : 'Nothing to redo'
			toaster.show({ id: 'history', title: emptyTitle, tone: 'neutral', duration: 1500 })
			return
		}

		const title = isUndo ? 'Undone' : 'Redone'
		toaster.show({ id: 'history', title, description: args.description ?? '', tone: 'success', duration: 2000 })
	}

	// Ctrl/Cmd+Z undoes the last pattern or progression change.
	// Shift+Z (or Ctrl+Y) redoes it. Works in either view.
	const handleHistoryShortcut = (event: KeyboardEvent) => {
		const hasModifier = event.ctrlKey || event.metaKey
		if (!hasModifier) return
		if (getIsTypingTarget(event.target)) return

		const pressedKey = event.key.toLowerCase()
		const isUndoKey = pressedKey === 'z' && !event.shiftKey
		const isRedoKey = (pressedKey === 'z' && event.shiftKey) || pressedKey === 'y'
		const isHistoryKey = isUndoKey || isRedoKey
		if (!isHistoryKey) return

		event.preventDefault()

		if (isUndoKey) {
			const undoneDescription = undoChange()
			showHistoryToast({ action: 'undo', description: undoneDescription })
			return
		}

		const redoneDescription = redoChange()
		showHistoryToast({ action: 'redo', description: redoneDescription })
	}

	onMount(() => {
		if (!browser) return

		restoreDraft()
		isDraftReady = true
		window.addEventListener('keydown', handleHistoryShortcut)

		return () => {
			window.removeEventListener('keydown', handleHistoryShortcut)
			clearTimeout(draftTimer)
			// when user navigates away, stop playback from PlaybackContextFrame context
			const playbackContext = getContext<PlaybackContextT>('playback')
			playbackContext.stop()
		}
	})
</script>

{@render props.children()}

<z-toaster position="top-end"></z-toaster>
