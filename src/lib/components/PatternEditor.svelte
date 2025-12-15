<script lang="ts">
	import { onMount } from 'svelte'
	import PatternEditorSignal from './PatternEditorSignal.svelte'
	import { Input } from '$lib/components/ui/input/index.js'
	import { Label } from '$lib/components/ui/label/index.js'
	import { SIGNAL_IDS, SIGNAL_ROWS } from '$lib/constants/signalRows'
	import { createSignal } from '$lib/helpers/creators'
	import { resolveSignalConflicts, getNoteFromSignalRow } from '$lib/helpers/signalRows'
	import { chordToNotes } from '$lib/helpers/chordToNotes'
	import { chordNotesToSignalRowNotes } from '$lib/helpers/chordNotesToSignalRowNotes'
	import { patternStore } from '$lib/stores/pattern.svelte'
	import { progressionStore } from '$lib/stores/progression.svelte'
	import playbackStore from '$lib/stores/playback.svelte'
	import mainStore from '$lib/stores/main.svelte'
	import outputStore from '$lib/stores/output.svelte'

	let signalGridBox: HTMLDivElement
	let selectedSignalId: string | null = $state(null)
	let isDraggingSignal = $state(false)
	let draggingToneId: string | null = $state(null)
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
	// 1 beat = 4 cells, 1 bar = 4 beats = 16 cells
	const CELL_WIDTH = 32 // in pixels
	const CELLS_PER_BEAT = 4
	const BEATS_PER_CELL = 1 / CELLS_PER_BEAT // 0.25 beats per cell

	const selectedSignal = $derived(selectedSignalId ? patternStore.getSignalById(selectedSignalId) : null)
	const selectedChord = $derived(
		progressionStore.selectedItemId
			? (progressionStore.chords.find((chord) => chord.id === progressionStore.selectedItemId) ?? null)
			: null
	)

	// Calculate note mappings for each signal row based on selected chord
	const signalRowNotes = $derived.by(() => {
		if (!selectedChord) return new Map<string, string>()
		const chordNotes = chordToNotes({ chord: selectedChord, rootOctave: mainStore.rootOctave })
		const notes = chordNotesToSignalRowNotes({ chordNotes })
		const noteMap = new Map<string, string>()
		SIGNAL_IDS.forEach((signalId, index) => {
			noteMap.set(signalId, notes[index])
		})
		return noteMap
	})

	// Calculate where the inactive area starts (in pixels)
	const activePatternWidthPx = $derived.by(() => {
		const activePatternCells = patternStore.activePatternLengthBeats * CELLS_PER_BEAT
		const widthInPixels = activePatternCells * CELL_WIDTH
		return widthInPixels
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
		const timePositionInCells = Math.floor(x / CELL_WIDTH)
		const timePositionInBeats = timePositionInCells * BEATS_PER_CELL
		const signalRow = patternStore.signalRows[label as keyof typeof SIGNAL_ROWS]

		const signal = createSignal({
			startTime: timePositionInBeats,
			duration: BEATS_PER_CELL, // 0.25 beats (1/4 beat = 1 cell)
			modifiedTime: Date.now()
		})

		signalRow.signalIds.push(signal.id)
		patternStore.signals.push(signal)
		console.log('>>>', signal.startTime)
		selectedSignalId = signal.id

		// Derive notes from selected chord if available
		let noteToPlay: string | null = null
		if (selectedChord) {
			const chordNotes = chordToNotes({ chord: selectedChord, rootOctave: mainStore.rootOctave })
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

		const signal = patternStore.getSignalById(signalId)
		if (!signal) return

		isDraggingSignal = true
		draggingToneId = toneId
		draggedSignalId = signalId
		dragStartX = event.clientX
		dragStartTime = signal.startTime
		selectedSignalId = signalId

		// Derive notes from selected chord if available
		let noteToPlay: string | null = null
		if (selectedChord) {
			const chordNotes = chordToNotes({ chord: selectedChord, rootOctave: mainStore.rootOctave })
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

		const signal = patternStore.getSignalById(signalId)
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
			const chordNotes = chordToNotes({ chord: selectedChord, rootOctave: mainStore.rootOctave })
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
			const signal = patternStore.getSignalById(resizingSignalId as string)
			if (!signal) return

			const deltaX = event.clientX - resizeStartX
			const deltaCells = Math.round(deltaX / CELL_WIDTH)
			const deltaBeats = deltaCells * BEATS_PER_CELL

			const isResizingLeft = resizeHandle === 'left'
			if (isResizingLeft) {
				const newStartTime = Math.max(0, resizeStartTime + deltaBeats)
				const endTime = resizeStartTime + resizeStartDuration
				const newDuration = Math.max(BEATS_PER_CELL, endTime - newStartTime)

				signal.startTime = newStartTime
				signal.duration = newDuration
				signal.modifiedTime = Date.now()
			}

			const isResizingRight = resizeHandle === 'right'
			if (isResizingRight) {
				const newDuration = Math.max(BEATS_PER_CELL, resizeStartDuration + deltaBeats)
				signal.duration = newDuration
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

		const signal = patternStore.getSignalById(draggedSignalId as string)
		if (!signal) return

		const target = event.target as HTMLElement
		const currentRowElement = target.closest('[data-tone-id]') as HTMLElement
		const currentRowId = currentRowElement?.dataset?.toneId
		const shouldMoveToNewRow = currentRowId && draggingToneId && currentRowId !== draggingToneId

		if (shouldMoveToNewRow) {
			patternStore.moveSignalToRow({
				fromRowId: draggingToneId as string,
				toRowId: currentRowId,
				signalId: draggedSignalId as string
			})

			draggingToneId = currentRowId
		}

		const deltaCells = Math.round(deltaX / CELL_WIDTH)
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
			const toneId = Object.keys(patternStore.signalRows).find((key) => {
				const signalId = resizingSignalId as string
				const signalRow = patternStore.signalRows[key as SignalRowKeyT]
				return signalRow.signalIds.includes(signalId)
			})

			if (toneId) {
				const signalRow = patternStore.signalRows[toneId as SignalRowKeyT]
				const newSignals = resolveSignalConflicts(signalRow, patternStore.signals)
				patternStore.signals = [...patternStore.signals, ...newSignals]
				signalRow.signalIds = [...signalRow.signalIds, ...newSignals.map((signal) => signal.id)]
			}

			resizeHandle = null
			isResizingSignal = false
			resizingSignalId = null
		}

		if (wasDragging) {
			const signalRow = patternStore.signalRows[draggingToneId as SignalRowKeyT]
			const newSignals = resolveSignalConflicts(signalRow, patternStore.signals)
			patternStore.signals = [...patternStore.signals, ...newSignals]
			signalRow.signalIds = [...signalRow.signalIds, ...newSignals.map((signal) => signal.id)]

			isDraggingSignal = false
			draggedSignalId = null
			draggingToneId = null
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
			patternStore.signals = patternStore.signals.filter((signal) => signal.id !== signalId)

			// Remove signal ID from its row
			for (const rowKey in patternStore.signalRows) {
				const row = patternStore.signalRows[rowKey as SignalRowKeyT]
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
		patternStore.signals = patternStore.signals.filter((signal) => signal.id !== signalId)

		// Remove signal ID from its row
		for (const rowKey in patternStore.signalRows) {
			const row = patternStore.signalRows[rowKey as SignalRowKeyT]
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

<div class="herPanel patternPanel">
	<div class="herPanelTitleBox">
		<span class="herPanelTitle">Pattern</span>
	</div>
</div>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="PatternEditor">
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="signalGridBox" bind:this={signalGridBox}>
		<div class="signalGridRowsBox" onmousemove={handleMouseMove} onmouseup={handleMouseUp}>
			{#each SIGNAL_IDS as label, index (label + index)}
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<div class="signalGridRow" ondblclick={handleSignalGridRowDoubleClick} data-tone-id={label}>
					{#each patternStore.signalRows[label as SignalRowKeyT].signalIds as signalId}
						{@const signal = patternStore.getSignalById(signalId)}
						{@const isSignalInactive = signal.startTime >= patternStore.activePatternLengthBeats}

						<PatternEditorSignal
							{signal}
							isSelected={signal.id === selectedSignalId}
							isDragging={draggedSignalId === signal.id}
							beatsPerCell={BEATS_PER_CELL}
							cellWidth={CELL_WIDTH}
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

		<div class="signalRowLabelsBox" onmouseup={handleLabelMouseUp}>
			{#each SIGNAL_IDS as label, index (label + index)}
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div
					class="signalRowLabel"
					data-signal-id={label}
					onmousedown={handleLabelMouseDown}
					onmouseenter={handleLabelMouseEnter}
					onmouseleave={handleLabelMouseLeave}
				>
					<span class="labelId">{label}</span>
					{#if signalRowNotes.get(label)}
						<span class="labelNote">{signalRowNotes.get(label)}</span>
					{/if}
				</div>
			{/each}
		</div>
	</div>
</div>

<style>
	.PatternEditor {
		width: 100%;
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 12px;
		padding: 0;
		min-height: 0;
	}

	.signalGridBox {
		width: 100%;
		flex: 1;
		display: flex;
		flex-direction: row-reverse;
		overflow-y: auto;
		overflow-x: hidden;
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		background: var(--card);
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
	}

	.signalRowLabelsBox {
		display: flex;
		height: fit-content;
		flex-direction: column;
		flex-shrink: 0;
		background: var(--muted);
		border-right: 1px solid var(--border);
		z-index: 20;
	}

	.signalRowLabel {
		width: 100px;
		min-width: 100px;
		height: 32px;
		padding: 0px 12px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		font-size: 11px;
		font-weight: 600;
		color: var(--muted-foreground);
		border-bottom: 1px solid var(--border);
		flex-shrink: 0;
		user-select: none;
		transition:
			color 0.1s,
			background-color 0.1s;
	}

	.labelId {
		text-align: right;
		flex: 1;
	}

	.labelNote {
		text-align: left;
		color: var(--primary);
		font-weight: 500;
		min-width: 28px;
	}

	.signalRowLabel:hover {
		color: var(--foreground);
		background-color: var(--accent);
		cursor: pointer;
	}

	.signalRowLabel:last-child {
		border-bottom: none;
	}

	.signalGridRowsBox {
		flex: 1;
		display: flex;
		flex-direction: column;
		overflow-x: auto;
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
		border-bottom: 1px solid var(--border);

		/* Alternating bar backgrounds + grid lines */
		background-image:
			/* Vertical grid lines every 16px (cell) */
			repeating-linear-gradient(
				to right,
				transparent 0px,
				transparent calc(var(--cellWidth) - 1px),
				var(--border) calc(var(--cellWidth) - 1px),
				var(--border) var(--cellWidth)
			),
			/* Alternating bar shading (every 2 bars) */
				repeating-linear-gradient(
					to right,
					var(--secondary) 0px,
					var(--secondary) var(--barWidth),
					transparent var(--barWidth),
					transparent calc(var(--barWidth) * 2)
				);
	}

	.signalGridRow:last-child {
		border-bottom: none;
	}

	/* Custom scrollbar styling */
	.signalGridBox::-webkit-scrollbar {
		width: 10px;
		height: 10px;
	}

	.signalGridBox::-webkit-scrollbar-track {
		background: transparent;
	}

	.signalGridBox::-webkit-scrollbar-thumb {
		background: var(--border);
		border-radius: 5px;
		border: 2px solid var(--card); /* Creates padding effect */
	}

	.signalGridBox::-webkit-scrollbar-thumb:hover {
		background: var(--muted-foreground);
	}

	.signalGridRowsBox::-webkit-scrollbar {
		width: 10px;
		height: 10px;
	}

	.signalGridRowsBox::-webkit-scrollbar-track {
		background: transparent;
	}

	.signalGridRowsBox::-webkit-scrollbar-thumb {
		background: var(--border);
		border-radius: 5px;
		border: 2px solid var(--background);
	}

	.signalGridRowsBox::-webkit-scrollbar-thumb:hover {
		background: var(--muted-foreground);
	}

	.inactivePatternOverlay {
		position: absolute;
		top: 0;
		bottom: 0;
		right: 0;
		background: var(--background);
		opacity: 0.5;
		pointer-events: none;
		z-index: 100;
		backdrop-filter: grayscale(100%);
	}
</style>
