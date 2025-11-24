<script lang="ts">
	import playbackStore from '$lib/stores/playback.svelte'

	type ProgressionDockChordPropsT = {
		chord: ChordT
		isSelected: boolean
		isDragging: boolean
		selectChord: (event: MouseEvent) => void
		onChordMouseDown: (event: MouseEvent) => void
		onResizeMouseDown: (event: MouseEvent, handle: 'left' | 'right') => void
	}

	const props: ProgressionDockChordPropsT = $props()

	// Total progression grid is divided into 64 units
	// duration of 1 = 1/64 width, duration of 4 = 4/64 = 1/16 width, etc.
	const TOTAL_UNITS = 64

	const backgroundColor = $derived(props.isSelected ? 'var(--background)' : 'hsl(var(--muted) / 0.5)')
	const textColor = $derived(props.isSelected ? 'var(--foreground)' : 'var(--muted-foreground)')
	const borderColor = $derived(props.isSelected ? 'var(--foreground)' : 'var(--border)')
	const leftPosition = $derived(`${((props.chord.startTime ?? 0) / TOTAL_UNITS) * 100}%`)
	const width = $derived(`${((props.chord.duration ?? 0) / TOTAL_UNITS) * 100}%`)

	// Check if chord is modified from original
	const isModified = $derived(
		props.chord.octaveOffset !== 0 || props.chord.inversion !== 0 || props.chord.voicing !== 'closed'
	)

	const handleResizeLeft = (event: MouseEvent) => {
		props.selectChord(event)
		props.onResizeMouseDown(event, 'left')
	}

	const handleResizeRight = (event: MouseEvent) => {
		props.selectChord(event)
		props.onResizeMouseDown(event, 'right')
	}

	const onMouseDown = (event: MouseEvent) => {
		const target = event.target as HTMLElement
		if (target.closest('.resizeHandle')) return

		props.onChordMouseDown(event)

		// Play each note in the chord
		props.chord.notes.forEach((note) => {
			playbackStore.play({ note })
		})
	}

	const onMouseUp = (event: MouseEvent) => {
		const isLeftButton = event.button === 0
		if (!isLeftButton) return

		// Stop each note in the chord
		props.chord.notes.forEach((note) => {
			playbackStore.stop({ note })
		})
	}

	const onMouseLeave = () => {
		// Stop all notes when mouse leaves while pressed
		props.chord.notes.forEach((note) => {
			playbackStore.stop({ note })
		})
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
	class="chord"
	onclick={props.selectChord}
	onmousedown={onMouseDown}
	onmouseup={onMouseUp}
	onmouseleave={onMouseLeave}
	data-chord-id={props.chord.id}
	data-chord-starttime={props.chord.startTime}
	data-chord-duration={props.chord.duration}
	data-is-dragging={props.isDragging}
	style="
    position: absolute;
    background: {backgroundColor};
    color: {textColor};
    border-color: {borderColor};
    left: {leftPosition};
    width: {width};
  "
>
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="resizeHandle resizeHandleLeft" onmousedown={handleResizeLeft}></div>

	<div class="chordContent">
		<span class="chordSymbol">{props.chord.symbol}</span>
		{#if isModified}
			<span class="modifiedIndicator">●</span>
		{/if}
	</div>

	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="resizeHandle resizeHandleRight" onmousedown={handleResizeRight}></div>
</div>

<style>
	/* So dragging a chord makes it appear above other chords. */
	[data-is-dragging='true'] {
		cursor: grabbing;
		z-index: 999;
	}

	.chord {
		height: 100%;
		border-radius: 4px;
		border: 1px solid;
		cursor: grab;
		position: absolute;
		display: flex;
		align-items: center;
		justify-content: center;
		user-select: none;
		transition: background-color 0.1s ease;
		top: 0;
	}

	.chord:active {
		cursor: grabbing;
	}

	.chordContent {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 14px;
		font-weight: 600;
		pointer-events: none;
	}

	.chordSymbol {
		font-weight: 600;
	}

	.modifiedIndicator {
		font-size: 8px;
		opacity: 0.7;
	}

	.resizeHandle {
		position: absolute;
		top: 0;
		width: 8px;
		height: 100%;
		z-index: 10;
		cursor: ew-resize;
		opacity: 0;
	}

	.resizeHandleLeft {
		left: 0;
	}

	.resizeHandleRight {
		right: 0;
	}

	.resizeHandle:hover {
		opacity: 1;
		background: rgba(255, 255, 255, 0.2);
	}
</style>
