<script lang="ts">
	import ProgressionDockChord from './ProgressionDockChord.svelte'
	import { progressionStore } from '$lib/stores/progression.svelte'
	import playbackStore from '$lib/stores/playback.svelte'
	import main from '$lib/stores/main.svelte'
	import Icon from '@iconify/svelte'
	import { Button } from '$lib/components/ui/button'
	import { exportPerformanceAsMidi } from '$lib/helpers/midiExport'
	import SelectPatternLength from './SelectPatternLength.svelte'
	import SelectProgressionLength from './SelectProgressionLength.svelte'

	let isDraggingChord = $state(false)
	let draggedChordId: string | null = $state(null)
	let dragStartX = $state(0)
	let dragStartTime = $state(0)
	let isMouseDownOnChord = $state(false)
	let isResizingChord = $state(false)
	let resizingChordId: string | null = $state(null)
	let resizeHandle: 'left' | 'right' | null = $state(null)
	let resizeStartX = $state(0)
	let resizeStartTime = $state(0)
	let resizeStartDuration = $state(0)
	let middleElement: HTMLElement | null = $state(null)

	// Grid layout: 4 beats per bar, chords positioned/sized in beats
	const BEATS_PER_BAR = 4
	const DRAG_THRESHOLD_PIXELS = 24
	const MIN_DURATION_BEATS = 0.25 // Minimum chord duration (1/4 beat)

	// Derived: total beats based on progression length
	const totalBeats = $derived(main.progressionLengthBars * BEATS_PER_BAR)

	// Derived: timing markers array based on progression length (1 marker per beat)
	const timingMarkers = $derived.by(() => {
		const totalBeatCount = main.progressionLengthBars * BEATS_PER_BAR
		const markers = []
		for (let beat = 1; beat <= totalBeatCount; beat++) {
			markers.push(beat)
		}
		return markers
	})

	const handleKeyDown = (event: KeyboardEvent) => {
		const isDeleteKey = event.key === 'Delete' || event.key === 'Backspace'
		if (isDeleteKey) return progressionStore.deleteSelectedChord()
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
		const chordElement = target.closest('.chord') as HTMLElement
		if (!chordElement) return console.log('No chord element found')

		const chordId = chordElement.dataset.chordId
		if (!chordId) return console.log('No chordId found on chord element')

		const chord = progressionStore.getChord(chordId)
		if (!chord) return

		isMouseDownOnChord = true
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
		const beatWidth = containerWidth / totalBeats

		if (isResizingChord && resizingChordId) {
			const chord = progressionStore.getChord(resizingChordId)
			if (!chord) return

			const deltaX = event.clientX - resizeStartX
			const deltaBeats = Math.round((deltaX / beatWidth) * 4) / 4 // Snap to quarter beats

			if (resizeHandle === 'left') {
				const newStartTime = Math.max(0, resizeStartTime + deltaBeats)
				const endTime = resizeStartTime + resizeStartDuration
				const newDuration = Math.max(MIN_DURATION_BEATS, endTime - newStartTime)

				progressionStore.updateChord({
					id: resizingChordId,
					startTime: newStartTime,
					duration: newDuration,
					modifiedTime: Date.now()
				})
			} else if (resizeHandle === 'right') {
				const newDuration = Math.max(MIN_DURATION_BEATS, resizeStartDuration + deltaBeats)
				progressionStore.updateChord({
					id: resizingChordId,
					duration: newDuration,
					modifiedTime: Date.now()
				})
			}
			return
		}

		// Check if mouse has moved beyond threshold to start dragging
		if (isMouseDownOnChord && !isDraggingChord && draggedChordId) {
			const deltaX = Math.abs(event.clientX - dragStartX)
			if (deltaX >= DRAG_THRESHOLD_PIXELS) {
				isDraggingChord = true
			}
		}

		if (!isDraggingChord || !draggedChordId) return

		const chord = progressionStore.getChord(draggedChordId)
		if (!chord) return

		const deltaX = event.clientX - dragStartX
		const deltaBeats = Math.round((deltaX / beatWidth) * 4) / 4 // Snap to quarter beats
		const newStartTime = Math.max(0, dragStartTime + deltaBeats)

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
			isMouseDownOnChord = false
			draggedChordId = null
			isResizingChord = false
			resizingChordId = null
		}, 100)
	}

	const handleMiddleClick = (event: MouseEvent) => {
		event.stopPropagation()
	}

	const togglePlayback = () => {
		playbackStore.togglePlayback()
	}

	const handleDownloadMidi = () => {
		exportPerformanceAsMidi({
			performance: playbackStore.performance,
			bpm: main.bpm,
			key: main.selectedKey,
			scale: main.selectedScale
		})
	}
</script>

<svelte:window onkeydown={handleKeyDown} />

<div class="ProgressionPanel">
	<div class="top">
		<p>Progression</p>
		<SelectProgressionLength />
		<SelectPatternLength />
		<Button variant="ghost" size="icon" onclick={togglePlayback} class="playButton">
			{#if playbackStore.isPlaying}
				<Icon icon="mingcute:pause-fill" class="size-5" />
			{:else}
				<Icon icon="mingcute:play-fill" class="size-5" />
			{/if}
		</Button>
		<Button variant="ghost" size="icon" onclick={handleDownloadMidi} class="downloadButton">
			<Icon icon="mingcute:download-2-fill" class="size-5" />
		</Button>
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
			{#each timingMarkers as beat, index (beat)}
				{@const beatPercent = (index / timingMarkers.length) * 100}
				<div class="timingMarker" style="left: {beatPercent}%">
					{beat}
				</div>
			{/each}
		</div>

		<div class="chordArea">
			{#each progressionStore.chords as chord (chord.id)}
				<ProgressionDockChord
					{chord}
					{totalBeats}
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
		gap: 8px;
		padding: 4px 0 12px;
	}

	.top p {
		margin: 0;
		font-weight: 600;
		font-size: 14px;
	}

	:global(.playButton) {
		height: 32px;
		width: 32px;
	}

	:global(.downloadButton) {
		height: 32px;
		width: 32px;
	}

	.middle {
		flex: 1;
		border-radius: 2px;
		border: 1px solid var(--muted);
		position: relative;
		display: flex;
		flex-direction: column;
		overflow-x: auto;

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
