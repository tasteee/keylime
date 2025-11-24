<script lang="ts">
	import ProgressionDockChord from './ProgressionDockChord.svelte'
	import { progressionStore } from '$lib/stores/progression.svelte'

	let isDraggingChord = $state(false)
	let draggedChordId: string | null = $state(null)
	let dragStartX = $state(0)
	let dragStartTime = $state(0)
	let isResizingChord = $state(false)
	let resizingChordId: string | null = $state(null)
	let resizeHandle: 'left' | 'right' | null = $state(null)
	let resizeStartX = $state(0)
	let resizeStartTime = $state(0)
	let resizeStartDuration = $state(0)
	let middleElement: HTMLElement | null = $state(null)

	// Total progression grid is divided into 64 units
	// Each unit = 1/64 of the progression width
	const TOTAL_UNITS = 64

	const handleClickOutside = (event: MouseEvent) => {
		const target = event.target as HTMLElement
		const isInsideProgressionPanel = target.closest('.ProgressionPanel')

		const shouldDeselect = !isInsideProgressionPanel
		if (shouldDeselect) {
			progressionStore.selectChord(null)
		}
	}

	const handleKeyDown = (event: KeyboardEvent) => {
		const isEscapeKey = event.key === 'Escape'
		if (isEscapeKey) {
			progressionStore.selectChord(null)
			return
		}

		const isDeleteKey = event.key === 'Delete' || event.key === 'Backspace'
		if (isDeleteKey) {
			progressionStore.deleteSelectedChord()
			return
		}

		const isDuplicateKey = (event.ctrlKey || event.metaKey) && event.key === 'd'
		if (isDuplicateKey) {
			event.preventDefault()
			progressionStore.duplicateSelectedChord()
		}
	}

	const handleChordClick = (event: MouseEvent) => {
		const target = event.target as HTMLElement
		const chordId = target.dataset.chordId
		event.stopPropagation()
		progressionStore.selectChord(chordId || null)
	}

	const handleChordMouseDown = (event: MouseEvent) => {
		if (isResizingChord) return

		const target = event.target as HTMLElement
		const chordId = target.dataset.chordId
		if (!chordId) return

		const chord = progressionStore.getChord(chordId)
		if (!chord) return

		isDraggingChord = true
		draggedChordId = chordId
		dragStartX = event.clientX
		dragStartTime = chord.startTime ?? 0
		progressionStore.selectChord(chordId)

		event.stopPropagation()
		event.preventDefault()
	}

	const handleResizeMouseDown = (event: MouseEvent, handle: 'left' | 'right') => {
		const target = event.target as HTMLElement
		const chordElement = target.parentElement as HTMLElement
		const chordId = chordElement.dataset.chordId
		if (!chordId) return

		const chord = progressionStore.getChord(chordId)
		if (!chord) return

		isResizingChord = true
		resizingChordId = chordId
		resizeHandle = handle
		resizeStartX = event.clientX
		resizeStartTime = chord.startTime ?? 0
		resizeStartDuration = chord.duration ?? 0
		progressionStore.selectChord(chordId)

		event.stopPropagation()
		event.preventDefault()
	}

	const handleMouseMove = (event: MouseEvent) => {
		if (!middleElement) return

		const containerWidth = middleElement.offsetWidth
		const unitWidth = containerWidth / TOTAL_UNITS

		if (isResizingChord && resizingChordId) {
			const chord = progressionStore.getChord(resizingChordId)
			if (!chord) return

			const deltaX = event.clientX - resizeStartX
			const deltaUnits = Math.round(deltaX / unitWidth)

			if (resizeHandle === 'left') {
				const newStartTime = Math.max(0, resizeStartTime + deltaUnits)
				const endTime = resizeStartTime + resizeStartDuration
				const newDuration = Math.max(1, endTime - newStartTime)

				progressionStore.updateChord({
					id: resizingChordId,
					startTime: newStartTime,
					duration: newDuration,
					modifiedTime: Date.now()
				})
			} else if (resizeHandle === 'right') {
				const newDuration = Math.max(1, resizeStartDuration + deltaUnits)
				progressionStore.updateChord({
					id: resizingChordId,
					duration: newDuration,
					modifiedTime: Date.now()
				})
			}
			return
		}

		if (!isDraggingChord || !draggedChordId) return

		const chord = progressionStore.getChord(draggedChordId)
		if (!chord) return

		const deltaX = event.clientX - dragStartX
		const deltaUnits = Math.round(deltaX / unitWidth)
		const newStartTime = Math.max(0, dragStartTime + deltaUnits)

		progressionStore.updateChord({
			id: draggedChordId,
			startTime: newStartTime,
			modifiedTime: Date.now()
		})
	}

	const handleMouseUp = () => {
		if (isResizingChord && resizingChordId) {
			progressionStore.resolveConflictsForChord(resizingChordId)
		}

		if (isDraggingChord && draggedChordId) {
			progressionStore.resolveConflictsForChord(draggedChordId)
		}

		// Timeout prevents click from firing after drag
		setTimeout(() => {
			resizeHandle = null
			isDraggingChord = false
			draggedChordId = null
			isResizingChord = false
			resizingChordId = null
		}, 100)
	}

	const handleMiddleClick = (event: MouseEvent) => {
		event.stopPropagation()
	}
</script>

<svelte:window onclick={handleClickOutside} onkeydown={handleKeyDown} />

<div class="ProgressionPanel">
	<div class="top">
		<p>Progression</p>
	</div>

	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div
		class="middle"
		bind:this={middleElement}
		onclick={handleMiddleClick}
		onmousemove={handleMouseMove}
		onmouseup={handleMouseUp}
	>
		<div class="timingMarkers">
			{#each [1, 2, 3, 4] as beat}
				<div class="timingMarker" style="left: {(beat - 1) * 25}%">
					{beat}
				</div>
			{/each}
		</div>

		<div class="chordArea">
			{#each progressionStore.chords as chord (chord.id)}
				<ProgressionDockChord
					{chord}
					isSelected={chord.id === progressionStore.selectedChordId}
					isDragging={draggedChordId === chord.id}
					selectChord={handleChordClick}
					onChordMouseDown={handleChordMouseDown}
					onResizeMouseDown={handleResizeMouseDown}
				/>
			{/each}
		</div>
	</div>

	<div class="bottom">
		<p></p>
	</div>
</div>

<style>
	.ProgressionPanel {
		position: fixed;
		bottom: 0;
		left: 0;
		width: 100%;
		height: 160px;
		padding: 6px 12px 12px;
		display: flex;
		flex-direction: column;
		background-color: var(--background);
		border-top: 1px solid var(--muted);
	}

	.top {
		display: flex;
		flex-direction: row;
		align-items: center;
		padding: 4px 0 12px;
	}

	.top p {
		margin: 0;
		font-weight: 600;
		font-size: 14px;
	}

	.middle {
		flex: 1;
		border-radius: 2px;
		border: 1px solid var(--muted);
		position: relative;
		display: flex;
		flex-direction: column;

		background:
			repeating-linear-gradient(
				to right,
				hsl(0, 0%, 20%) 0px,
				hsl(0, 0%, 20%) 1px,
				transparent 1px,
				transparent calc(100% / 16)
			),
			repeating-linear-gradient(to right, hsl(0, 0%, 8%) 0%, hsl(0, 0%, 8%) 25%, hsl(0, 0%, 12%) 25%, hsl(0, 0%, 12%) 50%);
	}

	.timingMarkers {
		position: relative;
		height: 18px;
		width: 100%;
		border-bottom: 1px solid var(--muted);
		background: hsl(var(--background));
		pointer-events: none;
	}

	.timingMarker {
		position: absolute;
		top: 0px;
		font-size: 11px;
		font-weight: 600;
		color: var(--muted-foreground);
		opacity: 0.7;
		padding-left: 4px;
	}

	.chordArea {
		position: relative;
		flex: 1;
		width: 100%;
	}

	.bottom {
		display: flex;
		flex-direction: row;
		align-items: center;
		padding: 4px 0;
	}

	.bottom p {
		margin: 0;
	}
</style>
