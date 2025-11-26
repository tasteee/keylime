<script lang="ts">
	import { onMount } from 'svelte'
	import PatternEditorSignal from './PatternEditorSignal.svelte'
	import { Input } from '$lib/components/ui/input/index.js'
	import { Label } from '$lib/components/ui/label/index.js'
	import { SIGNAL_IDS, SIGNAL_ROWS } from '$lib/constants/signalRows'
	import { createSignal } from '$lib/helpers/creators'
	import { resolveSignalConflicts, getNoteFromSignalRow } from '$lib/helpers/signalRows'
	import { patternStore } from '$lib/stores/pattern.svelte'
	import { progressionStore } from '$lib/stores/progression.svelte'
	import playbackStore from '$lib/stores/playback.svelte'

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

	type SignalRowKeyT = keyof typeof SIGNAL_ROWS

	// Grid layout constants
	// 1 beat = 4 cells, 1 bar = 4 beats = 16 cells
	const CELL_WIDTH = 16 // in pixels
	const CELLS_PER_BEAT = 4
	const BEATS_PER_CELL = 1 / CELLS_PER_BEAT // 0.25 beats per cell

	const selectedSignal = $derived(selectedSignalId ? patternStore.getSignalById(selectedSignalId) : null)
	const selectedChord = $derived(
		progressionStore.selectedChordId
			? (progressionStore.chords.find((chord) => chord.id === progressionStore.selectedChordId) ?? null)
			: null
	)

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
		const isInsideVelocityControls = target.closest('.velocityControls')
		const clickedSignalElement = target.closest('.signal') as HTMLElement
		const clickedSignalId = clickedSignalElement?.dataset?.signalId
		const isClickedSignalTheSelectedSignal = clickedSignalId === selectedSignalId

		const shouldKeepSelected = isInsideVelocityControls || isClickedSignalTheSelectedSignal
		if (shouldKeepSelected) return

		selectedSignalId = null
	}

	const handleKeyDown = (event: KeyboardEvent) => {
		const isEscapeKey = event.key === 'Escape'
		if (isEscapeKey) {
			selectedSignalId = null
		}
	}

	const handleMinVelocityChange = (event: Event) => {
		if (!selectedSignal) return
		const target = event.target as HTMLInputElement
		const value = target.value
		const parsedValue = parseInt(value, 10)
		const isValidNumber = !isNaN(parsedValue)
		if (!isValidNumber) return
		const clampedValue = Math.max(0, Math.min(127, parsedValue))
		selectedSignal.minVelocity = clampedValue
		selectedSignal.modifiedTime = Date.now()
	}

	const handleMaxVelocityChange = (event: Event) => {
		if (!selectedSignal) return
		const target = event.target as HTMLInputElement
		const value = target.value
		const parsedValue = parseInt(value, 10)
		const isValidNumber = !isNaN(parsedValue)
		if (!isValidNumber) return
		const clampedValue = Math.max(0, Math.min(127, parsedValue))
		selectedSignal.maxVelocity = clampedValue
		selectedSignal.modifiedTime = Date.now()
	}

	const handleVelocityChange = (event: Event) => {
		if (!selectedSignal) return
		const target = event.target as HTMLInputElement
		const value = target.value
		const parsedValue = parseInt(value, 10)
		const isValidNumber = !isNaN(parsedValue)
		if (!isValidNumber) return
		const clampedValue = Math.max(0, Math.min(127, parsedValue))
		selectedSignal.velocity = clampedValue
		selectedSignal.minVelocity = clampedValue
		selectedSignal.maxVelocity = clampedValue
		selectedSignal.modifiedTime = Date.now()
	}

	const handleSignalGridRowDoubleClick = (event: MouseEvent) => {
		console.log('handleSignalGridRowDoubleClick')
		if (isDraggingSignal || isResizingSignal) return

		selectedSignalId = null
		const target = event.target as HTMLElement

		const label = target.dataset.toneId
		const rect = target.getBoundingClientRect()
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

		const noteToPlay = getNoteFromSignalRow({ signalRowId: label as string, chord: selectedChord })
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

		const noteToPlay = getNoteFromSignalRow({ signalRowId: toneId, chord: selectedChord })
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

		isResizingSignal = true
		resizingSignalId = signalId
		resizeHandle = handle
		resizeStartX = event.clientX
		resizeStartTime = signal.startTime
		resizeStartDuration = signal.duration
		selectedSignalId = signalId

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

	onMount(() => {
		signalGridBox.scrollTop = 342.5
	})
</script>

<svelte:window onclick={handleClickOutside} onkeydown={handleKeyDown} />

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="PatternEditor">
	{#if selectedSignal}
		<div class="velocityControls">
			<div class="velocityControlGroup">
				<Label for="velocity">Velocity</Label>
				<Input
					id="velocity"
					type="number"
					min="0"
					max="127"
					value={selectedSignal.velocity}
					oninput={handleVelocityChange}
					class="h-8"
				/>
			</div>
			<div class="velocityControlGroup">
				<Label for="minVelocity">Min</Label>
				<Input
					id="minVelocity"
					type="number"
					min="0"
					max="127"
					value={selectedSignal.minVelocity}
					oninput={handleMinVelocityChange}
					class="h-8"
				/>
			</div>
			<div class="velocityControlGroup">
				<Label for="maxVelocity">Max</Label>
				<Input
					id="maxVelocity"
					type="number"
					min="0"
					max="127"
					value={selectedSignal.maxVelocity}
					oninput={handleMaxVelocityChange}
					class="h-8"
				/>
			</div>
		</div>
	{/if}

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

		<div class="signalRowLabelsBox">
			{#each SIGNAL_IDS as label, index (label + index)}
				<div class="signalRowLabel">
					{label}
				</div>
			{/each}
		</div>
	</div>
</div>

<style>
	.PatternEditor {
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 8px;
		border: 1px solid var(--border);
		border-radius: 2px;
	}

	.velocityControls {
		display: flex;
		flex-direction: row;
		gap: 12px;
		align-items: flex-end;
		padding: 8px;
		background: hsl(var(--muted) / 0.3);
		border: 1px solid var(--border);
		border-radius: 2px;
	}

	.velocityControlGroup {
		display: flex;
		flex-direction: column;
		gap: 4px;
		min-width: 80px;
	}

	.signalGridBox {
		width: 100%;
		height: 275px;
		max-height: 275px;
		display: flex;
		flex-direction: row-reverse;
		overflow-y: auto;
		overflow-x: hidden;
		border: 1px solid var(--border);
		border-radius: 2px;
		background: hsl(var(--background));
	}

	.signalRowLabelsBox {
		display: flex;
		height: fit-content;
		flex-direction: column;
		flex-shrink: 0;
		background: hsl(var(--muted));
		border-right: 1px solid var(--border);
		box-shadow: 4px 0px 8px -3px rgba(255, 255, 255, 0.0025);
	}

	.signalRowLabel {
		width: 52px;
		min-width: 52px;
		height: 24px;
		padding: 0px 8px;
		display: flex;
		align-items: center;
		justify-content: end;
		font-size: 0.875rem;
		font-weight: 500;
		color: hsl(var(--muted-foreground));
		border-bottom: 1px solid var(--border);
		flex-shrink: 0;
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
	}

	.signalGridRow {
		--beatWidth: 64px;
		--barCount: 16;
		--cellWidth: 16px;
		--beatsPerBar: 4;
		--barWidth: calc(var(--beatWidth) * var(--beatsPerBar));

		width: calc(var(--barWidth) * var(--barCount)); /* 3072px */
		min-width: calc(var(--barWidth) * var(--barCount));
		height: 24px;
		min-height: 24px;
		flex-shrink: 0;
		position: relative;
		background-color: hsl(var(--background));
		border-bottom: 1px solid var(--border);

		/* Alternating bar backgrounds + grid lines */
		background-image:
			/* Vertical grid lines every 12px */
			repeating-linear-gradient(
				to right,
				transparent 0px,
				transparent calc(var(--cellWidth) - 1px),
				rgba(222, 222, 222, 0.15) calc(var(--cellWidth) - 1px),
				rgba(222, 222, 222, 0.15) var(--cellWidth)
			),
			/* Alternating bar shading (every 2 bars = 384px) */
				repeating-linear-gradient(
					to right,
					rgba(200, 200, 200, 0.03) 0px,
					rgba(200, 200, 200, 0.03) var(--barWidth),
					transparent var(--barWidth),
					transparent calc(var(--barWidth) * 2)
				);
	}

	.signalGridRow:last-child {
		border-bottom: none;
	}

	/* Custom scrollbar styling */
	.signalGridBox::-webkit-scrollbar {
		width: 0px;
		height: 0px;
	}

	.signalGridBox::-webkit-scrollbar-track {
		background: hsl(var(--muted) / 0.3);
		border-radius: 0.25rem;
	}

	.signalGridBox::-webkit-scrollbar-thumb {
		background: hsl(var(--muted-foreground) / 0.3);
		border-radius: 0.25rem;
	}

	.signalGridBox::-webkit-scrollbar-thumb:hover {
		background: hsl(var(--muted-foreground) / 0.5);
	}

	.signalGridRowsBox::-webkit-scrollbar {
		width: 0px;
		height: 0px;
	}

	.signalGridRowsBox::-webkit-scrollbar-track {
		background: hsl(var(--muted) / 0.3);
		border-radius: 0.25rem;
	}

	.signalGridRowsBox::-webkit-scrollbar-thumb {
		background: hsl(var(--muted-foreground) / 0.3);
		border-radius: 0.25rem;
	}

	.signalGridRowsBox::-webkit-scrollbar-thumb:hover {
		background: hsl(var(--muted-foreground) / 0.5);
	}

	.inactivePatternOverlay {
		position: absolute;
		top: 0;
		bottom: 0;
		right: 0;
		background: rgba(0, 0, 0, 0.6);
		pointer-events: none;
		z-index: 100;
	}
</style>
