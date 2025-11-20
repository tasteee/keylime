<script lang="ts">
	import { SIGNAL_IDS, SIGNAL_ROWS } from '$lib/constants/signalRows'
	import { createSignal } from '$lib/helpers/creators'
	import { resolveSignalConflicts } from '$lib/helpers/signalRows'

	let signals: SignalT[] = $state([])
	let signalRows = $state(SIGNAL_ROWS)
	let selectedSignalId: string | null = $state(null)
	let isDraggingSignal = $state(false)
	let draggingToneId: string | null = $state(null)
	let draggedSignalId: string | null = $state(null)
	let dragStartX = $state(0)
	let dragStartTime = $state(0)
	let isResizingSignal = $state(false)
	let resizingSignalId: string | null = $state(null)
	let resizeHandle: 'left' | 'right' | null = $state(null)
	let resizeStartX = $state(0)
	let resizeStartTime = $state(0)
	let resizeStartDuration = $state(0)

	const getSignalById = (id: string): SignalT => {
		return signals.find((signal) => signal.id === id) as SignalT
	}

	// ticks per quarter note (beat)
	const PPQ = 16
	const CELL_WIDTH = 16 // in pixels
	const CELLS_PER_BEAT = 4
	const TICKS_PER_CELL = PPQ / CELLS_PER_BEAT
	const TICKS_PER_BEAT = PPQ * 4
	const TICKS_PER_BAR = TICKS_PER_BEAT * 4

	const handleSignalGridRowClick = (event: MouseEvent) => {
		console.log('handleSignalGridRowClick')
		if (isDraggingSignal || isResizingSignal) return

		selectedSignalId = null
		const target = event.target as HTMLElement

		const label = target.dataset.toneId
		const rect = target.getBoundingClientRect()
		const x = event.clientX - rect.left
		const timePositionInCells = Math.floor(x / CELL_WIDTH)
		const timePositionInTicks = timePositionInCells * TICKS_PER_CELL
		const signalRow = signalRows[label as keyof typeof SIGNAL_ROWS]

		const signal = createSignal({
			startTime: timePositionInTicks,
			duration: TICKS_PER_CELL,
			modifiedTime: Date.now()
		})

		signalRow.signalIds.push(signal.id)
		signals.push(signal)
		console.log('>>>', signal.startTime)
		selectedSignalId = signal.id
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

		const signal = getSignalById(signalId)
		if (!signal) return

		isDraggingSignal = true
		draggingToneId = toneId
		draggedSignalId = signalId
		dragStartX = event.clientX
		dragStartTime = signal.startTime
		selectedSignalId = signalId

		event.stopPropagation()
		event.preventDefault()
	}

	const handleResizeMouseDown = (event: MouseEvent, handle: 'left' | 'right') => {
		const target = event.target as HTMLElement
		const signalElement = target.parentElement as HTMLElement
		const signalId = signalElement.dataset.signalId
		if (!signalId) return

		const signal = getSignalById(signalId)
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
		if (isResizingSignal && resizingSignalId) {
			const signal = getSignalById(resizingSignalId)
			if (!signal) return

			const deltaX = event.clientX - resizeStartX
			const deltaCells = Math.round(deltaX / CELL_WIDTH)
			const deltaTicks = deltaCells * TICKS_PER_CELL

			if (resizeHandle === 'left') {
				const newStartTime = Math.max(0, resizeStartTime + deltaTicks)
				const endTime = resizeStartTime + resizeStartDuration
				const newDuration = Math.max(TICKS_PER_CELL, endTime - newStartTime)

				signal.startTime = newStartTime
				signal.duration = newDuration
				signal.modifiedTime = Date.now()
			} else if (resizeHandle === 'right') {
				const newDuration = Math.max(TICKS_PER_CELL, resizeStartDuration + deltaTicks)
				signal.duration = newDuration
				signal.modifiedTime = Date.now()
			}
			return
		}

		if (!isDraggingSignal || !draggedSignalId) return

		const signal = getSignalById(draggedSignalId)
		if (!signal) return

		const deltaX = event.clientX - dragStartX
		const deltaCells = Math.round(deltaX / CELL_WIDTH)
		const deltaTicks = deltaCells * TICKS_PER_CELL
		const newStartTime = Math.max(0, dragStartTime + deltaTicks)

		signal.startTime = newStartTime
		signal.modifiedTime = Date.now()
	}

	const handleMouseUp = () => {
		console.log('handleMouseUp')

		if (isResizingSignal && resizingSignalId) {
			const signalIdToFind = resizingSignalId
			const toneId = Object.keys(signalRows).find((key) =>
				signalRows[key as keyof typeof SIGNAL_ROWS].signalIds.includes(signalIdToFind)
			)

			if (toneId) {
				const signalRow = signalRows[toneId as keyof typeof SIGNAL_ROWS]
				const newSignals = resolveSignalConflicts(signalRow, signals)
				signals = [...signals, ...newSignals]
				signalRow.signalIds = [...signalRow.signalIds, ...newSignals.map((signal) => signal.id)]
			}
		}

		if (isDraggingSignal && draggedSignalId) {
			const signalRow = signalRows[draggingToneId as keyof typeof SIGNAL_ROWS]
			const newSignals = resolveSignalConflicts(signalRow, signals)
			signals = [...signals, ...newSignals]
			signalRow.signalIds = [...signalRow.signalIds, ...newSignals.map((signal) => signal.id)]
		}

		// This prevents handleSignalGridRowClick from firing and
		// adding a new signal right after dragging ends and the cursor
		// MAY be slightly over another grid cell, creating an unwanted signal.
		setTimeout(() => {
			resizeHandle = null
			isDraggingSignal = false
			draggedSignalId = null
			draggingToneId = null
			isResizingSignal = false
			resizingSignalId = null
		}, 100)
	}

	const handleSignalDoubleClick = (event: MouseEvent) => {
		const target = event.target as HTMLElement
		const signalId = target.dataset.signalId
		if (!signalId) return

		// Remove signal from signals array
		signals = signals.filter((signal) => signal.id !== signalId)

		// Remove signal ID from its row
		for (const rowKey in signalRows) {
			const row = signalRows[rowKey as keyof typeof SIGNAL_ROWS]
			row.signalIds = row.signalIds.filter((id) => id !== signalId)
		}

		// Clear selection if the deleted signal was selected
		if (selectedSignalId === signalId) {
			selectedSignalId = null
		}

		event.stopPropagation() // Prevent triggering row click
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="PatternEditor">
	<div class="signalGridBox">
		<div class="signalGridRowsBox" onmousemove={handleMouseMove} onmouseup={handleMouseUp}>
			{#each SIGNAL_IDS as label, index (label + index)}
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<div class="signalGridRow" onclick={handleSignalGridRowClick} data-tone-id={label}>
					{#each signalRows[label as keyof typeof SIGNAL_ROWS].signalIds as signalId}
						{@const signal = getSignalById(signalId)}
						{@const bg = signal.id === selectedSignalId ? 'var(--foreground)' : 'var(--muted-foreground)'}

						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div
							class="signal"
							onclick={handleSignalClick}
							onmousedown={handleSignalMouseDown}
							ondblclick={handleSignalDoubleClick}
							data-signal-id={signal.id}
							data-signal-startTime={signal.startTime}
							data-signal-duration={signal.duration}
							data-is-dragging={draggedSignalId === signal.id}
							style="
                  position: absolute;
                  background: {bg};
                  left: {(signal.startTime / TICKS_PER_CELL) * CELL_WIDTH}px;
                  width: {(signal.duration / TICKS_PER_CELL) * CELL_WIDTH - 1}px;
                  top: 1px;
                "
						>
							<!-- svelte-ignore a11y_no_static_element_interactions -->
							<div class="resizeHandle resizeHandleLeft" onmousedown={(e) => handleResizeMouseDown(e, 'left')}></div>
							<!-- svelte-ignore a11y_no_static_element_interactions -->
							<div class="resizeHandle resizeHandleRight" onmousedown={(e) => handleResizeMouseDown(e, 'right')}></div>
						</div>
					{/each}
				</div>
			{/each}
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
	/* So dragging a signal makes it appear above other signals. */
	[data-is-dragging='true'] {
		cursor: grabbing;
		z-index: 999;
	}

	.PatternEditor {
		width: 100%;
		display: flex;
		flex-direction: column;
		padding: 8px;
		border: 1px solid var(--border);
		border-radius: 2px;
	}

	.signal {
		/* background: var(--muted-foreground); */
		height: 20px;
		border-radius: 2px;
		cursor: grab;
		position: relative;
	}

	.signal:active {
		cursor: grabbing;
	}

	.resizeHandle {
		position: absolute;
		top: 0;
		width: 2px;
		height: 100%;
		z-index: 10;
		opacity: 0;
	}

	.resizeHandleLeft {
		left: 0;
		cursor: ew-resize;
	}

	.resizeHandleRight {
		right: 0;
		cursor: ew-resize;
	}

	.resizeHandle:hover {
		opacity: 1;
		background: rgba(255, 255, 255, 0.3);
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
		--beatWidth: 48px;
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
</style>
