<script lang="ts">
	import { onMount } from 'svelte'
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
	import projectStore from '$lib/stores/project.svelte'
	import playbackStore from '$lib/stores/playback.svelte'

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

	type SignalRowKeyT = keyof typeof SIGNAL_ROWS

	// Grid layout constants
	// 1 beat = 4 cells
	// 1 bar = 4 beats = 16 cells
	const CELLS_PER_BEAT = 4
	const BEATS_PER_CELL = 1 / CELLS_PER_BEAT // 0.25 beats per cell

	// const selectedSignal = $derived(selectedSignalId ? projectStore.getPatternSignalById(selectedSignalId) : null)

	const selectedChord = $derived(
		projectStore.selectedProgressionItemId
			? (projectStore.progressionChords.find((chord) => chord.id === projectStore.selectedProgressionItemId) ?? null)
			: null
	)

	// Calculate note mappings for each signal row based on selected chord
	const signalRowNotes = $derived.by(() => {
		if (!selectedChord) return new Map<string, string>()
		const chordNotes = chordToNotes({ chord: selectedChord, rootOctave: String(projectStore.octave) })
		const notes = chordNotesToSignalRowNotes({ chordNotes })
		const noteMap = new Map<string, string>()
		SIGNAL_IDS.forEach((signalId, index) => {
			noteMap.set(signalId, notes[index])
		})
		return noteMap
	})

	// Calculate where the inactive area starts (in pixels)
	const activePatternWidthPx = $derived.by(() => {
		const activePatternCells = projectStore.patternActiveDurationBeats * CELLS_PER_BEAT
		const widthInPixels = activePatternCells * projectStore.patternZoomLevel
		return widthInPixels
	})

	// Calculate font size based on zoom level
	// zoomLevel 16px -> 11px, zoomLevel 48px -> 14px
	const labelFontSize = $derived.by(() => {
		const minZoom = 16
		const maxZoom = 48
		const minFontSize = 11
		const maxFontSize = 14
		const zoomLevel = projectStore.patternZoomLevel
		const clampedZoom = Math.max(minZoom, Math.min(maxZoom, zoomLevel))
		const fontSize = minFontSize + ((clampedZoom - minZoom) / (maxZoom - minZoom)) * (maxFontSize - minFontSize)
		return fontSize
	})

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
		const timePositionInCells = Math.floor(x / projectStore.patternZoomLevel)
		const timePositionInBeats = timePositionInCells * BEATS_PER_CELL
		const signalRow = projectStore.patternSignalRows[label as keyof typeof SIGNAL_ROWS]

		const signal = createSignal({
			startTime: timePositionInBeats,
			duration: BEATS_PER_CELL, // 0.25 beats (1/4 beat = 1 cell)
			modifiedTime: Date.now()
		})

		signalRow.signalIds.push(signal.id)
		projectStore.patternSignals.push(signal)
		console.log('>>>', signal.startTime)
		selectedSignalId = signal.id

		// Derive notes from selected chord if available
		let noteToPlay: string | null = null
		if (selectedChord) {
			const chordNotes = chordToNotes({ chord: selectedChord, rootOctave: String(projectStore.octave) })
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

		const signal = projectStore.getPatternSignalById(signalId)
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
			const chordNotes = chordToNotes({ chord: selectedChord, rootOctave: String(projectStore.octave) })
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

		const signal = projectStore.getPatternSignalById(signalId)
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
			const chordNotes = chordToNotes({ chord: selectedChord, rootOctave: String(projectStore.octave) })
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
			const signal = projectStore.getPatternSignalById(resizingSignalId as string)
			if (!signal) return

			const deltaX = event.clientX - resizeStartX
			const deltaCells = Math.round(deltaX / projectStore.patternZoomLevel)
			const deltaBeats = deltaCells * BEATS_PER_CELL

			const isResizingLeft = resizeHandle === 'left'
			if (isResizingLeft) {
				const newStartTime = Math.max(0, resizeStartTime + deltaBeats)
				const endTime = resizeStartTime + resizeStartDuration

				// Ensure we don't extend past the active pattern length
				const maxEndTime = projectStore.patternActiveDurationBeats
				const effectiveEndTime = Math.min(endTime, maxEndTime)

				const newDuration = effectiveEndTime - newStartTime

				// Reject the resize if it would make the signal smaller than minimum
				const isAtMinimumDuration = signal.duration === BEATS_PER_CELL
				const wouldShrinkBelowMinimum = newDuration < BEATS_PER_CELL
				if (isAtMinimumDuration && wouldShrinkBelowMinimum) return

				const clampedDuration = Math.max(BEATS_PER_CELL, newDuration)

				signal.startTime = newStartTime
				signal.duration = clampedDuration
				signal.modifiedTime = Date.now()
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
				const maxDuration = Math.max(BEATS_PER_CELL, projectStore.patternActiveDurationBeats - signal.startTime)
				const clampedDuration = Math.min(clampedNewDuration, maxDuration)

				signal.duration = clampedDuration
				signal.modifiedTime = Date.now()
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

		const signal = projectStore.getPatternSignalById(draggedSignalId as string)
		if (!signal) return

		const target = event.target as HTMLElement
		const currentRowElement = target.closest('[data-tone-id]') as HTMLElement
		const currentRowId = currentRowElement?.dataset?.toneId
		const shouldMoveToNewRow = currentRowId && draggingToneId && currentRowId !== draggingToneId

		if (shouldMoveToNewRow) {
			projectStore.movePatternSignalToRow({
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
				const chordNotes = chordToNotes({ chord: selectedChord, rootOctave: String(projectStore.octave) })
				const noteToPlay = getNoteFromSignalRow({ signalRowId: currentRowId, chord: null, chordNotes })
				if (noteToPlay) {
					currentlyPlayingNote = noteToPlay
					playbackStore.playNote({ note: noteToPlay })
				}
			}
		}

		const deltaCells = Math.round(deltaX / projectStore.patternZoomLevel)
		const deltaBeats = deltaCells * BEATS_PER_CELL
		const newStartTime = Math.max(0, dragStartTime + deltaBeats)

		signal.startTime = newStartTime
		signal.modifiedTime = Date.now()
	}

	const handleMouseUp = () => {
		const wasResizingOrDragging = isResizingSignal || isDraggingSignal
		const wasResizing = isResizingSignal && resizingSignalId
		const wasDragging = isDraggingSignal && draggedSignalId

		if (wasResizing) {
			const toneId = Object.keys(projectStore.patternSignalRows).find((key) => {
				const signalId = resizingSignalId as string
				const signalRow = projectStore.patternSignalRows[key as SignalRowKeyT]
				return signalRow.signalIds.includes(signalId)
			})

			if (toneId) {
				const signalRow = projectStore.patternSignalRows[toneId as SignalRowKeyT]
				const newSignals = resolveSignalConflicts(signalRow, projectStore.patternSignals)
				projectStore.patternSignals = [...projectStore.patternSignals, ...newSignals]
				signalRow.signalIds = [...signalRow.signalIds, ...newSignals.map((signal) => signal.id)]
			}

			resizeHandle = null
			isResizingSignal = false
			resizingSignalId = null
		}

		if (wasDragging) {
			const signal = projectStore.getPatternSignalById(draggedSignalId as string)

			// If the signal starts after the active pattern length, revert the move
			if (signal && signal.startTime >= projectStore.patternActiveDurationBeats) {
				signal.startTime = dragStartTime
				signal.modifiedTime = Date.now()

				if (draggingToneId !== dragStartToneId && dragStartToneId) {
					projectStore.movePatternSignalToRow({
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
				const extendsBeyondActivePattern = signalEndTime > projectStore.patternActiveDurationBeats
				if (extendsBeyondActivePattern) {
					const maxDuration = projectStore.patternActiveDurationBeats - signal.startTime
					signal.duration = Math.max(BEATS_PER_CELL, maxDuration)
					signal.modifiedTime = Date.now()
				}
			}

			const signalRow = projectStore.patternSignalRows[draggingToneId as SignalRowKeyT]
			const newSignals = resolveSignalConflicts(signalRow, projectStore.patternSignals)
			projectStore.patternSignals = [...projectStore.patternSignals, ...newSignals]
			signalRow.signalIds = [...signalRow.signalIds, ...newSignals.map((signal) => signal.id)]

			isDraggingSignal = false
			draggedSignalId = null
			draggingToneId = null
			dragStartToneId = null
		}

		if (currentlyPlayingNote) {
			playbackStore.stopNote({ note: currentlyPlayingNote })
			currentlyPlayingNote = null
		}

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
			const signalId = signalElement?.dataset.signalId
			if (!signalId) return

			// Remove signal from signals array
			projectStore.patternSignals = projectStore.patternSignals.filter((signal) => signal.id !== signalId)

			// Remove signal ID from its row
			for (const rowKey in projectStore.patternSignalRows) {
				const row = projectStore.patternSignalRows[rowKey as SignalRowKeyT]
				row.signalIds = row.signalIds.filter((id) => id !== signalId)
			}

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
		projectStore.patternSignals = projectStore.patternSignals.filter((signal) => signal.id !== signalId)

		// Remove signal ID from its row
		for (const rowKey in projectStore.patternSignalRows) {
			const row = projectStore.patternSignalRows[rowKey as SignalRowKeyT]
			row.signalIds = row.signalIds.filter((id) => id !== signalId)
		}

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

	const handleLabelMouseUp = (event: MouseEvent) => {
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
		// Only stop if we're leaving the entire label area, not just switching between labels
		const relatedTarget = event.relatedTarget as HTMLElement
		const isEnteringAnotherLabel = relatedTarget?.closest('.signalRowLabel')
		if (isEnteringAnotherLabel) return

		if (!isMouseDownOnLabel) return
		if (!currentLabelNote) return

		playbackStore.stopNote({ note: currentLabelNote })
		isMouseDownOnLabel = false
		currentLabelNote = null
	}

	onMount(() => {
		signalGridBox.scrollTop = 342.5
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
					{toFractionString(projectStore.patternDurationBars)}
					{projectStore.patternDurationBars === 1 ? 'BAR' : 'BARS'}
				</span>
			</div>
		</Box>

		<Divider margin="24px" />

		<Box gap="8px" align="center">
			<Button size="small" isIcon={true} onclick={projectStore.zoomOutPattern}>
				<MagnifyingGlassMinus size={16} weight="bold" />
			</Button>
			<Button size="small" isIcon={true} onclick={projectStore.zoomInPattern}>
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
					style="height: {projectStore.patternZoomLevel}px; font-size: {labelFontSize}px;"
				>
					<span class="labelId">{label}</span>
					{#if signalRowNotes.get(label)}
						<span class="labelNote">{signalRowNotes.get(label)}</span>
					{/if}
				</div>
			{/each}
		</div>
		<div class="signalGridRowsBox" onmousemove={handleMouseMove} onmouseup={handleMouseUp}>
			<PatternTimingHeader cellWidth={projectStore.patternZoomLevel} />
			{#each SIGNAL_IDS as label, index (label + index)}
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<div
					class="signalGridRow"
					ondblclick={handleSignalGridRowDoubleClick}
					data-tone-id={label}
					style="--cellWidth: {projectStore.patternZoomLevel}px; --beatWidth: {projectStore.patternZoomLevel *
						4}px; height: {projectStore.patternZoomLevel}px; min-height: {projectStore.patternZoomLevel}px;"
				>
					{#each projectStore.patternSignalRows[label as SignalRowKeyT]?.signalIds || [] as signalId}
						{@const signal = projectStore.getPatternSignalById(signalId)}
						{@const isSignalInactive = signal.startTime >= projectStore.patternActiveDurationBeats}

						<PatternEditorSignal
							{signal}
							isSelected={signal.id === selectedSignalId}
							isDragging={draggedSignalId === signal.id}
							beatsPerCell={BEATS_PER_CELL}
							cellWidth={projectStore.patternZoomLevel}
							cellHeight={projectStore.patternZoomLevel}
							onSignalClick={handleSignalClick}
							onSignalMouseDown={handleSignalMouseDown}
							onSignalDoubleClick={handleSignalDoubleClick}
							onResizeMouseDown={handleResizeMouseDown}
							opacity={isSignalInactive ? 0.3 : 1}
						/>
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
</style>
