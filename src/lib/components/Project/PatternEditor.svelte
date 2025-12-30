<script lang="ts">
	import { onMount, getContext } from 'svelte'
	import PatternEditorSignal from './PatternEditorSignal.svelte'
	import PatternTimingHeader from './PatternTimingHeader.svelte'
	import { Button } from '$lib/components/ui/button/index.js'
	import Box from '$lib/components/ui/box.svelte'
	import Divider from '../ui/divider.svelte'
	import Icon from '@iconify/svelte'
	import { toFractionString } from '$lib/helpers/numbers'
	import { MagnifyingGlassPlus, MagnifyingGlassMinus } from 'phosphor-svelte'
	import { SIGNAL_IDS, SIGNAL_ROWS } from '$lib/constants/signalRows'
	import { createSignal } from '$lib/helpers/creators'
	import { resolveSignalConflicts, getNoteFromSignalRow } from '$lib/helpers/signalRows'
	import { chordToNotes } from '$lib/helpers/chordToNotes'
	import { chordNotesToSignalRowNotes } from '$lib/helpers/chordNotesToSignalRowNotes'
	import { numbers } from '$lib/helpers/numbers'
	import playbackStore from '$lib/stores/playback.svelte'

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
		save: () => Promise<{ didSucceed: boolean }>
		saveClone: () => Promise<{ didSucceed: boolean; newProjectId: string }>
		checkIsDirty: () => boolean
	}

	const context = getContext<ProjectEditorContextT>('projectEditor')
	const playbackContext = getContext<PlaybackContextT>('playback')

	let signalGridBox: HTMLDivElement
	let selectedSignalId: string | null = $state(null)
	let isDraggingSignal = $state(false)
	let draggingToneId: string | null = $state(null)
	let dragStartToneId: string | null = $state(null)
	let draggedSignalId: string | null = $state(null)
	let dragStartX = $state(0)
	let dragStartTime = $state(0)
	let dragThresholdMet = $state(false)
	let isResizingSignal = $state(false)
	let resizingSignalId: string | null = $state(null)
	let resizeHandle: 'left' | 'right' | null = $state(null)
	let resizeStartX = $state(0)
	let resizeStartTime = $state(0)
	let resizeStartDuration = $state(0)
	let ignoreClickOutsideUntil = $state(0)
	let currentlyPlayingNote: string | null = $state(null)
	let isMouseDownOnLabel = $state(false)
	let currentLabelNote: string | null = $state(null)
	let cursorElement: HTMLElement | null = $state(null)
	let animationFrameId: number

	type SignalRowKeyT = keyof typeof SIGNAL_ROWS

	// Grid layout constants
	// 1 beat = 4 cells
	// 1 bar = 4 beats = 16 cells
	const CELLS_PER_BEAT = 4
	const BEATS_PER_CELL = 1 / CELLS_PER_BEAT // 0.25 beats per cell
	const PATTERN_MIN_ZOOM = 16
	const PATTERN_MAX_ZOOM = 48
	const PATTERN_ZOOM_STEP = 4

	// Helper to get signal by ID from context
	const getPatternSignalById = (id: string): SignalT | undefined => {
		const finder = (signal: SignalT) => signal.id === id
		return context.state.project.patternSignals.find(finder)
	}

	// Derived: active pattern duration in beats
	const patternActiveDurationBeats = $derived.by(() => {
		const barsToBeats = context.state.project.patternDurationBars * 4
		return barsToBeats
	})

	// Derive progressionItems with calculated startTime
	const progressionItems = $derived.by(() => {
		let accumulatedStartTime = 0
		return context.state.project.progressionChords.map((item) => {
			const startTime = accumulatedStartTime
			accumulatedStartTime += item.durationBeats
			return { ...item, startTime } as ProgressionItemT
		})
	})

	// Derive progression chords only (filter out rests)
	const progressionChords = $derived.by(() => {
		return progressionItems.filter((item): item is ProgressionChordT => item.type === 'chord')
	})

	// Derive selected chord
	const selectedChord = $derived.by(() => {
		const selectedProgressionItemId = context.state.selectedProgressionItemId
		if (!selectedProgressionItemId) return null
		const found = progressionChords.find((chord) => chord.id === selectedProgressionItemId)
		return found ?? null
	})

	// Calculate note mappings for each signal row based on selected chord
	const signalRowNotes = $derived.by(() => {
		if (!selectedChord) return new Map<string, string>()
		const chordNotes = chordToNotes({ chord: selectedChord, rootOctave: String(context.state.project.octave) })
		const notes = chordNotesToSignalRowNotes({ chordNotes })
		const noteMap = new Map<string, string>()
		SIGNAL_IDS.forEach((signalId, index) => {
			noteMap.set(signalId, notes[index])
		})
		return noteMap
	})

	// Calculate where the inactive area starts (in pixels)
	const activePatternWidthPx = $derived.by(() => {
		const activePatternCells = patternActiveDurationBeats * CELLS_PER_BEAT
		const widthInPixels = activePatternCells * context.state.project.patternZoomLevel
		return widthInPixels
	})

	// Calculate font size based on zoom level
	// zoomLevel 16px -> 11px, zoomLevel 48px -> 14px
	const labelFontSize = $derived.by(() => {
		const minZoom = 16
		const maxZoom = 48
		const minFontSize = 11
		const maxFontSize = 14
		const zoomLevel = context.state.project.patternZoomLevel
		const clampedZoom = Math.max(minZoom, Math.min(maxZoom, zoomLevel))
		const fontSize = minFontSize + ((clampedZoom - minZoom) / (maxZoom - minZoom)) * (maxFontSize - minFontSize)
		return fontSize
	})

	// Zoom handlers
	const zoomInPattern = () => {
		const addition = PATTERN_ZOOM_STEP
		const newZoomLevel = context.state.project.patternZoomLevel + addition
		const clampedZoomLevel = numbers.clamp(PATTERN_MIN_ZOOM, newZoomLevel, PATTERN_MAX_ZOOM)
		context.updateProject({ patternZoomLevel: clampedZoomLevel })
	}

	const zoomOutPattern = () => {
		const subtraction = -PATTERN_ZOOM_STEP
		const newZoomLevel = context.state.project.patternZoomLevel + subtraction
		const clampedZoomLevel = numbers.clamp(PATTERN_MIN_ZOOM, newZoomLevel, PATTERN_MAX_ZOOM)
		context.updateProject({ patternZoomLevel: clampedZoomLevel })
	}

	const handleClickOutside = (event: MouseEvent) => {
		const hasNoSelectedSignal = selectedSignalId === null
		if (hasNoSelectedSignal) return

		const currentTime = Date.now()
		const isIgnoringClickOutside = currentTime < ignoreClickOutsideUntil
		if (isIgnoringClickOutside) return

		const target = event.target as HTMLElement
		const clickedSignalElement = target.closest('.signal') as HTMLElement
		const clickedSignalId = clickedSignalElement?.dataset?.signalId
		const isClickedSignalTheSelectedSignal = clickedSignalId === selectedSignalId

		const shouldKeepSelected = isClickedSignalTheSelectedSignal
		if (shouldKeepSelected) return

		selectedSignalId = null
	}

	const handleKeyDown = (event: KeyboardEvent) => {
		const isEscapeKey = event.key === 'Escape'
		if (isEscapeKey) {
			selectedSignalId = null
		}
	}

	const handleSignalGridRowDoubleClick = (event: MouseEvent) => {
		console.log('handleSignalGridRowDoubleClick')
		if (isDraggingSignal || isResizingSignal) return

		selectedSignalId = null
		const target = event.target as HTMLElement

		// Find the row element - may need to look up the DOM tree if clicking on signal/resize handle
		const rowElement = target.closest('.signalGridRow') as HTMLElement
		if (!rowElement) return

		const label = rowElement.dataset.toneId
		if (!label) return

		const rect = rowElement.getBoundingClientRect()
		const x = event.clientX - rect.left
		const timePositionInCells = Math.floor(x / context.state.project.patternZoomLevel)
		const timePositionInBeats = timePositionInCells * BEATS_PER_CELL

		const signal = createSignal({
			startTime: timePositionInBeats,
			duration: BEATS_PER_CELL, // 0.25 beats (1/4 beat = 1 cell)
			modifiedTime: Date.now()
		})

		const updatedSignalRows = { ...context.state.project.patternSignalRows }
		updatedSignalRows[label as keyof typeof SIGNAL_ROWS].signalIds.push(signal.id)
		const updatedSignals = [...context.state.project.patternSignals, signal]

		context.updateProject({
			patternSignals: updatedSignals,
			patternSignalRows: updatedSignalRows
		})

		console.log('>>>', signal.startTime)
		selectedSignalId = signal.id

		// Derive notes from selected chord if available
		let noteToPlay: string | null = null
		if (selectedChord) {
			const chordNotes = chordToNotes({ chord: selectedChord, rootOctave: String(context.state.project.octave) })
			noteToPlay = getNoteFromSignalRow({ signalRowId: label as string, chord: null, chordNotes })
		}

		if (noteToPlay) {
			playbackStore.playNote({ note: noteToPlay })
			setTimeout(() => {
				playbackStore.stopNote({ note: noteToPlay })
			}, 250)
		}
	}

	const handleSignalClick = (event: MouseEvent) => {
		const target = event.target as HTMLElement
		const signalId = target.dataset.signalId
		event.stopPropagation() // Prevent triggering row click
		selectedSignalId = signalId || null
	}

	const handleSignalMouseDown = (event: MouseEvent) => {
		if (isResizingSignal) return

		const target = event.target as HTMLElement
		const parent = target.parentElement as HTMLElement
		const signalId = target.dataset.signalId
		const toneId = parent.dataset.toneId
		if (!signalId || !toneId) return

		const signal = getPatternSignalById(signalId)
		if (!signal) return

		isDraggingSignal = true
		draggingToneId = toneId
		dragStartToneId = toneId
		draggedSignalId = signalId
		dragStartX = event.clientX
		dragStartTime = signal.startTime
		selectedSignalId = signalId

		// Derive notes from selected chord if available
		let noteToPlay: string | null = null
		if (selectedChord) {
			const chordNotes = chordToNotes({ chord: selectedChord, rootOctave: String(context.state.project.octave) })
			noteToPlay = getNoteFromSignalRow({ signalRowId: toneId, chord: null, chordNotes })
		}

		if (noteToPlay) {
			currentlyPlayingNote = noteToPlay
			playbackStore.playNote({ note: noteToPlay })
		}

		event.stopPropagation()
		event.preventDefault()
	}

	const handleResizeMouseDown = (event: MouseEvent, handle: 'left' | 'right') => {
		const target = event.target as HTMLElement
		const signalElement = target.parentElement as HTMLElement
		const signalId = signalElement.dataset.signalId
		if (!signalId) return

		const signal = getPatternSignalById(signalId)
		if (!signal) return

		// Find the row to get the signal row ID for note playback
		const rowElement = signalElement.closest('.signalGridRow') as HTMLElement
		const toneId = rowElement?.dataset.toneId

		isResizingSignal = true
		resizingSignalId = signalId
		resizeHandle = handle
		resizeStartX = event.clientX
		resizeStartTime = signal.startTime
		resizeStartDuration = signal.duration
		selectedSignalId = signalId

		// Play note when resizing starts
		if (selectedChord && toneId) {
			const chordNotes = chordToNotes({ chord: selectedChord, rootOctave: String(context.state.project.octave) })
			const noteToPlay = getNoteFromSignalRow({ signalRowId: toneId, chord: null, chordNotes })
			if (noteToPlay) {
				playbackStore.playNote({ note: noteToPlay })
				setTimeout(() => {
					playbackStore.stopNote({ note: noteToPlay })
				}, 250)
			}
		}

		event.stopPropagation()
		event.preventDefault()
	}

	const handleMouseMove = (event: MouseEvent) => {
		const isCurrentlyResizing = isResizingSignal && resizingSignalId
		if (isCurrentlyResizing) {
			const signal = getPatternSignalById(resizingSignalId as string)
			if (!signal) return

			const deltaX = event.clientX - resizeStartX
			const deltaCells = Math.round(deltaX / context.state.project.patternZoomLevel)
			const deltaBeats = deltaCells * BEATS_PER_CELL

			const isResizingLeft = resizeHandle === 'left'
			if (isResizingLeft) {
				const newStartTime = Math.max(0, resizeStartTime + deltaBeats)
				const endTime = resizeStartTime + resizeStartDuration

				// Ensure we don't extend past the active pattern length
				const maxEndTime = patternActiveDurationBeats
				const effectiveEndTime = Math.min(endTime, maxEndTime)

				const newDuration = effectiveEndTime - newStartTime

				// Reject the resize if it would make the signal smaller than minimum
				const isAtMinimumDuration = signal.duration === BEATS_PER_CELL
				const wouldShrinkBelowMinimum = newDuration < BEATS_PER_CELL
				if (isAtMinimumDuration && wouldShrinkBelowMinimum) return

				const clampedDuration = Math.max(BEATS_PER_CELL, newDuration)

				context.updatePatternSignal(signal.id, {
					startTime: newStartTime,
					duration: clampedDuration,
					modifiedTime: Date.now()
				})
			}

			const isResizingRight = resizeHandle === 'right'
			if (isResizingRight) {
				const newDuration = resizeStartDuration + deltaBeats

				// Reject the resize if it would make the signal smaller than minimum
				const isAtMinimumDuration = signal.duration === BEATS_PER_CELL
				const wouldShrinkBelowMinimum = newDuration < BEATS_PER_CELL
				if (isAtMinimumDuration && wouldShrinkBelowMinimum) return

				const clampedNewDuration = Math.max(BEATS_PER_CELL, newDuration)

				// Clamp to active pattern length
				const maxDuration = Math.max(BEATS_PER_CELL, patternActiveDurationBeats - signal.startTime)
				const clampedDuration = Math.min(clampedNewDuration, maxDuration)

				context.updatePatternSignal(signal.id, {
					duration: clampedDuration,
					modifiedTime: Date.now()
				})
			}
			return
		}

		const isMouseDownOnSignal = isDraggingSignal && draggedSignalId
		if (!isMouseDownOnSignal) return

		const deltaX = event.clientX - dragStartX
		const absoluteDeltaX = Math.abs(deltaX)
		const dragThreshold = 3
		const hasMovedEnoughToStartDrag = absoluteDeltaX >= dragThreshold

		if (!dragThresholdMet && !hasMovedEnoughToStartDrag) return

		if (!dragThresholdMet) {
			dragThresholdMet = true
		}

		const signal = getPatternSignalById(draggedSignalId as string)
		if (!signal) return

		const target = event.target as HTMLElement
		const currentRowElement = target.closest('[data-tone-id]') as HTMLElement
		const currentRowId = currentRowElement?.dataset?.toneId
		const shouldMoveToNewRow = currentRowId && draggingToneId && currentRowId !== draggingToneId

		if (shouldMoveToNewRow) {
			context.movePatternSignalToRow({
				fromRowId: draggingToneId as string,
				toRowId: currentRowId,
				signalId: draggedSignalId as string
			})

			draggingToneId = currentRowId

			// Stop the previous note if playing
			if (currentlyPlayingNote) {
				playbackStore.stopNote({ note: currentlyPlayingNote })
				currentlyPlayingNote = null
			}

			// Play the new note for the new row
			if (selectedChord) {
				const chordNotes = chordToNotes({ chord: selectedChord, rootOctave: String(context.state.project.octave) })
				const noteToPlay = getNoteFromSignalRow({ signalRowId: currentRowId, chord: null, chordNotes })
				if (noteToPlay) {
					currentlyPlayingNote = noteToPlay
					playbackStore.playNote({ note: noteToPlay })
				}
			}
		}

		const deltaCells = Math.round(deltaX / context.state.project.patternZoomLevel)
		const deltaBeats = deltaCells * BEATS_PER_CELL
		const newStartTime = Math.max(0, dragStartTime + deltaBeats)

		context.updatePatternSignal(signal.id, {
			startTime: newStartTime,
			modifiedTime: Date.now()
		})
	}

	const handleMouseUp = () => {
		const wasResizingOrDragging = isResizingSignal || isDraggingSignal
		const wasResizing = isResizingSignal

		isResizingSignal = false
		resizingSignalId = null
		resizeHandle = null

		const wasDragging = isDraggingSignal && draggedSignalId

		if (wasDragging) {
			const signal = getPatternSignalById(draggedSignalId as string)

			// If the signal starts after the active pattern length, revert the move
			if (signal && signal.startTime >= patternActiveDurationBeats) {
				context.updatePatternSignal(signal.id, {
					startTime: dragStartTime,
					modifiedTime: Date.now()
				})

				if (draggingToneId !== dragStartToneId && dragStartToneId) {
					context.movePatternSignalToRow({
						fromRowId: draggingToneId as string,
						toRowId: dragStartToneId,
						signalId: draggedSignalId as string
					})
				}

				isDraggingSignal = false
				draggedSignalId = null
				draggingToneId = null
				dragStartToneId = null
				return
			}

			// Clamp duration if signal extends beyond active pattern length
			if (signal) {
				const signalEndTime = signal.startTime + signal.duration
				const extendsBeyondActivePattern = signalEndTime > patternActiveDurationBeats
				if (extendsBeyondActivePattern) {
					const maxDuration = patternActiveDurationBeats - signal.startTime
					context.updatePatternSignal(signal.id, {
						duration: Math.max(BEATS_PER_CELL, maxDuration),
						modifiedTime: Date.now()
					})
				}
			}

			const signalRow = context.state.project.patternSignalRows[draggingToneId as SignalRowKeyT]
			const newSignals = resolveSignalConflicts(signalRow, context.state.project.patternSignals)
			const updatedSignals = [...context.state.project.patternSignals, ...newSignals]
			const updatedSignalRows = { ...context.state.project.patternSignalRows }
			updatedSignalRows[draggingToneId as SignalRowKeyT].signalIds = [
				...signalRow.signalIds,
				...newSignals.map((signal) => signal.id)
			]

			context.updateProject({
				patternSignals: updatedSignals,
				patternSignalRows: updatedSignalRows
			})

			isDraggingSignal = false
			draggedSignalId = null
			draggingToneId = null
			dragStartToneId = null
		}

		if (currentlyPlayingNote) {
			playbackStore.stopNote({ note: currentlyPlayingNote })
			currentlyPlayingNote = null
		}

		dragThresholdMet = false

		if (wasResizingOrDragging) {
			ignoreClickOutsideUntil = Date.now() + 100
		}
	}
	const handleSignalDoubleClick = (event: MouseEvent) => {
		const target = event.target as HTMLElement

		// Check if we're clicking on a resize handle - if so, just delete the signal
		const isResizeHandle = target.classList.contains('resizeHandle')
		if (isResizeHandle) {
			const signalElement = target.parentElement as HTMLElement
			const signalId = signalElement?.dataset?.signalId
			if (!signalId) return

			// Remove signal from signals array
			const updatedSignals = context.state.project.patternSignals.filter((signal) => signal.id !== signalId)

			// Remove signal ID from its row
			const updatedSignalRows = { ...context.state.project.patternSignalRows }
			for (const rowKey in updatedSignalRows) {
				const row = updatedSignalRows[rowKey as SignalRowKeyT]
				row.signalIds = row.signalIds.filter((id) => id !== signalId)
			}

			context.updateProject({
				patternSignals: updatedSignals,
				patternSignalRows: updatedSignalRows
			})

			// Clear selection if the deleted signal was selected
			if (selectedSignalId === signalId) {
				selectedSignalId = null
			}

			event.stopPropagation()
			return
		}

		// Normal signal double-click - delete it
		const signalId = target.dataset.signalId
		if (!signalId) return

		// Remove signal from signals array
		const updatedSignals = context.state.project.patternSignals.filter((signal) => signal.id !== signalId)

		// Remove signal ID from its row
		const updatedSignalRows = { ...context.state.project.patternSignalRows }
		for (const rowKey in updatedSignalRows) {
			const row = updatedSignalRows[rowKey as SignalRowKeyT]
			row.signalIds = row.signalIds.filter((id) => id !== signalId)
		}

		context.updateProject({
			patternSignals: updatedSignals,
			patternSignalRows: updatedSignalRows
		})

		// Clear selection if the deleted signal was selected
		if (selectedSignalId === signalId) {
			selectedSignalId = null
		}

		event.stopPropagation() // Prevent triggering row click
	}

	const handleLabelMouseDown = (event: MouseEvent) => {
		const target = event.target as HTMLElement
		const labelElement = target.closest('.signalRowLabel') as HTMLElement
		if (!labelElement) return

		const signalId = labelElement.dataset.signalId
		if (!signalId) return

		const note = signalRowNotes.get(signalId)
		if (!note) return

		isMouseDownOnLabel = true
		currentLabelNote = note
		playbackStore.playNote({ note })
	}

	const handleLabelMouseUp = () => {
		if (!isMouseDownOnLabel) return
		if (!currentLabelNote) return

		playbackStore.stopNote({ note: currentLabelNote })
		isMouseDownOnLabel = false
		currentLabelNote = null
	}

	const handleLabelMouseEnter = (event: MouseEvent) => {
		if (!isMouseDownOnLabel) return

		const target = event.target as HTMLElement
		const labelElement = target.closest('.signalRowLabel') as HTMLElement
		if (!labelElement) return

		const signalId = labelElement.dataset.signalId
		if (!signalId) return

		const note = signalRowNotes.get(signalId)
		if (!note) return

		const wasSameNote = note === currentLabelNote
		if (wasSameNote) return

		// Stop the previous note
		if (currentLabelNote) {
			playbackStore.stopNote({ note: currentLabelNote })
		}

		// Play the new note
		currentLabelNote = note
		playbackStore.playNote({ note })
	}

	const handleLabelMouseLeave = (event: MouseEvent) => {
		if (!isMouseDownOnLabel) return

		const relatedTarget = event.relatedTarget as HTMLElement
		const isLeavingLabelsBox = !relatedTarget || !relatedTarget.closest('.signalRowLabelsBox')

		if (isLeavingLabelsBox && currentLabelNote) {
			playbackStore.stopNote({ note: currentLabelNote })
			isMouseDownOnLabel = false
			currentLabelNote = null
		}
	}

	onMount(() => {
		signalGridBox.scrollTop = 342.5
	})

	const updateCursor = () => {
		if (!playbackContext.state.isPlaying || !cursorElement) return

		const now = performance.now()
		const elapsedMs = now - playbackContext.state.loopStartTime
		const bpm = context.state.project.bpm
		const msPerBeat = 60000 / bpm
		const currentBeat = elapsedMs / msPerBeat

		const patternDurationBeats = patternActiveDurationBeats
		if (patternDurationBeats === 0) return

		const loopedBeat = currentBeat % patternDurationBeats
		const cellsPerBeat = CELLS_PER_BEAT
		const x = loopedBeat * cellsPerBeat * context.state.project.patternZoomLevel
		cursorElement.style.transform = `translateX(${x}px)`

		animationFrameId = requestAnimationFrame(updateCursor)
	}

	$effect(() => {
		if (playbackContext.state.isPlaying) {
			animationFrameId = requestAnimationFrame(updateCursor)
		} else {
			cancelAnimationFrame(animationFrameId)
		}
		return () => cancelAnimationFrame(animationFrameId)
	})
</script>

<svelte:window onclick={handleClickOutside} onkeydown={handleKeyDown} />

<div class="PatternEditor">
	<div class="patternToolbar">
		<Box gap="16px" align="center">
			<Icon icon="mingcute:grid-fill" width="20px" height="20px" />

			<div class="titleSection">
				<span class="herPanelTitle">Pattern</span>
				<span class="patternBarCount text-xs font-medium text-foreground/80 whitespace-nowrap uppercase">
					{toFractionString(context.state.project.patternDurationBars)}
					{context.state.project.patternDurationBars === 1 ? 'BAR' : 'BARS'}
				</span>
			</div>
		</Box>

		<Divider margin="24px" />

		<Box gap="8px" align="center">
			<Button size="small" isIcon={true} onclick={zoomOutPattern}>
				<MagnifyingGlassMinus size={16} weight="bold" />
			</Button>
			<Button size="small" isIcon={true} onclick={zoomInPattern}>
				<MagnifyingGlassPlus size={16} weight="bold" />
			</Button>
		</Box>

		<Divider margin="24px" />
	</div>

	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="signalGridBox" bind:this={signalGridBox}>
		<div class="signalRowLabelsBox" onmouseup={handleLabelMouseUp}>
			<div class="signalRowLabelSpacer"></div>
			{#each SIGNAL_IDS as label, index (label + index)}
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div
					class="signalRowLabel"
					data-signal-id={label}
					onmousedown={handleLabelMouseDown}
					onmouseenter={handleLabelMouseEnter}
					onmouseleave={handleLabelMouseLeave}
					style="height: {context.state.project.patternZoomLevel}px; font-size: {labelFontSize}px;"
				>
					<span class="labelId">{label}</span>
					{#if signalRowNotes.get(label)}
						<span class="labelNote">{signalRowNotes.get(label)}</span>
					{/if}
				</div>
			{/each}
		</div>
		<div class="signalGridRowsBox" onmousemove={handleMouseMove} onmouseup={handleMouseUp}>
			<PatternTimingHeader cellWidth={context.state.project.patternZoomLevel} />
			{#if playbackContext.state.isPlaying}
				<div class="playbackCursor" bind:this={cursorElement}></div>
			{/if}
			{#each SIGNAL_IDS as label, index (label + index)}
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<div
					class="signalGridRow"
					ondblclick={handleSignalGridRowDoubleClick}
					data-tone-id={label}
					style="--cellWidth: {context.state.project.patternZoomLevel}px; --beatWidth: {context.state.project
						.patternZoomLevel * 4}px; height: {context.state.project.patternZoomLevel}px; min-height: {context.state.project
						.patternZoomLevel}px;"
				>
					{#each context.state.project.patternSignalRows[label as SignalRowKeyT]?.signalIds || [] as signalId}
						{@const signal = getPatternSignalById(signalId)}
						{#if signal}
							{@const isSignalInactive = signal.startTime >= patternActiveDurationBeats}

							<PatternEditorSignal
								{signal}
								isSelected={signal.id === selectedSignalId}
								isDragging={draggedSignalId === signal.id}
								beatsPerCell={BEATS_PER_CELL}
								cellWidth={context.state.project.patternZoomLevel}
								cellHeight={context.state.project.patternZoomLevel}
								onSignalClick={handleSignalClick}
								onSignalMouseDown={handleSignalMouseDown}
								onSignalDoubleClick={handleSignalDoubleClick}
								onResizeMouseDown={handleResizeMouseDown}
								opacity={isSignalInactive ? 0.3 : 1}
							/>
						{/if}
					{/each}
				</div>
			{/each}

			<!-- Overlay for inactive pattern area -->
			<div class="inactivePatternOverlay" style="left: {activePatternWidthPx}px;"></div>
		</div>
	</div>
</div>

<style>
	.PatternEditor {
		width: 100%;
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0px;
		padding: 0;
		min-height: 0;
		/* border-bottom: 1px solid var(--n-03); */
		/* border-top: 1px solid var(--n-03); */
	}

	.patternToolbar {
		display: flex;
		flex-direction: row;
		align-items: center;
		padding: 0px 24px;
		height: 54px;
		background-color: var(--color-panel-bg);
		border-bottom: 1px solid var(--n-03);
		/* border-top: 1px solid var(--n-03); */
	}

	.titleSection {
		display: flex;
		flex-direction: column;
	}

	.patternBarCount {
		position: relative;
		top: -5px;
	}

	.signalGridBox {
		width: 100%;
		flex: 1;
		display: flex;
		flex-direction: row;
		overflow: auto;
		/* border: 1px solid var(--n-03); */
		/* border: 1px solid #747474; */
	}

	.signalRowLabelsBox {
		display: flex;
		height: fit-content;
		flex-direction: column;
		flex-shrink: 0;
		background: red;
		border-right: 1px solid var(--n-03);
		z-index: 110;
		position: sticky;
		left: 0;
	}

	.signalRowLabelSpacer {
		height: 32px;
		width: 100%;
		flex-shrink: 0;
		background: var(--colorWhite);
		border-bottom: 1px solid var(--n-03);
		position: sticky;
		top: 0;
		z-index: 120;
	}

	.signalRowLabel {
		width: 80px;
		min-width: 80px;
		height: 32px;
		padding: 0px 4px;
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		font-weight: 600;
		color: var(--n-05);
		border-bottom: 1px solid var(--n-03);
		flex-shrink: 0;
		user-select: none;
		background: var(--n-00);
		transition:
			color 0.1s,
			background-color 0.1s;
	}

	.labelId {
		text-align: left;
	}

	.labelNote {
		text-align: right;
		color: var(--a-03);
		font-weight: 700;
	}

	.signalRowLabel:hover {
		color: var(--n-08);
		background: var(--colorWhite);
		cursor: pointer;
	}

	.signalRowLabel:last-child {
		border-bottom: none;
	}

	.signalGridRowsBox {
		flex: 1;
		display: flex;
		flex-direction: column;
		position: relative;
		min-height: min-content;
		background-color: var(--background);
	}

	.signalGridRow {
		--beatWidth: 128px;
		--barCount: 16;
		--cellWidth: 32px;
		--beatsPerBar: 4;
		--barWidth: calc(var(--beatWidth) * var(--beatsPerBar));

		width: calc(var(--barWidth) * var(--barCount)); /* 6144px */
		min-width: calc(var(--barWidth) * var(--barCount));
		height: 32px;
		min-height: 32px;
		flex-shrink: 0;
		position: relative;
		background-color: transparent;
		border-bottom: 1px solid var(--n-03);

		/* Alternating bar backgrounds + grid lines */
		background-image:
			/* Vertical grid lines every 16px (cell) */
			repeating-linear-gradient(
				to right,
				transparent 0px,
				transparent calc(var(--cellWidth) - 1px),
				var(--n-03) calc(var(--cellWidth) - 1px),
				var(--n-03) var(--cellWidth)
			),
			/* Alternating bar shading (every 2 bars) */
				repeating-linear-gradient(
					to right,
					var(--n-01) 0px,
					var(--n-01) var(--barWidth),
					var(--n-00) var(--barWidth),
					var(--n-00) calc(var(--barWidth) * 2)
				);
	}

	.signalGridRow:last-child {
		border-bottom: none;
	}

	.inactivePatternOverlay {
		position: absolute;
		top: 32px; /* Below header */
		bottom: 0;
		right: 0;
		background: var(--n-03);
		opacity: 0.5;
		pointer-events: auto;
		z-index: 100;
		cursor: not-allowed;
		/* backdrop-filter: grayscale(50%); */
	}

	.playbackCursor {
		position: absolute;
		top: 32px; /* Below header */
		bottom: 0;
		width: 1px;
		background-color: var(--n-09);
		z-index: 105;
		pointer-events: none;
		will-change: transform;
	}
</style>
