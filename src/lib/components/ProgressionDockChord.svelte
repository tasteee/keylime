<script lang="ts">
	import playbackStore from '$lib/stores/playback.svelte'
	import { progressionStore } from '$lib/stores/progression.svelte'
	import { chordModifierStore } from '$lib/stores/chordModifier.svelte'

	type ProgressionDockChordPropsT = {
		chord: ChordT
		isDragging: boolean
		totalBeats: number
		selectChord: (event: MouseEvent) => void
		onChordMouseDown: (event: MouseEvent) => void
		onResizeMouseDown: (event: MouseEvent, handle: 'left' | 'right') => void
	}

	const props: ProgressionDockChordPropsT = $props()
	const isSelected = $derived(props.chord.id === progressionStore.selectedChordId)
	const backgroundColor = $derived(isSelected ? 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0.5)')
	const textColor = $derived(isSelected ? 'var(--foreground)' : 'var(--muted-foreground)')
	const borderColor = $derived(isSelected ? 'var(--foreground)' : 'var(--border)')
	// Position and width are now based on beats
	const leftPosition = $derived(`${((props.chord.startTime ?? 0) / props.totalBeats) * 100}%`)
	const width = $derived(`${((props.chord.duration ?? 0) / props.totalBeats) * 100}%`)

	// Check if chord is modified from original
	const isModified = $derived(
		props.chord.octaveOffset !== 0 || props.chord.inversion !== 0 || props.chord.voicing !== 'closed'
	)

	const handleContextMenu = (event: MouseEvent) => {
		event.preventDefault()
		event.stopPropagation()
		chordModifierStore.openForProgressionChord({
			chordId: props.chord.id
		})
	}

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
		if (target.closest('.dragHandle')) return
		playbackStore.playChord(props.chord.notes)
	}

	const onDragHandleMouseDown = (event: MouseEvent) => {
		props.selectChord(event)
		props.onChordMouseDown(event)
		console.log('onDragHandleMouseDown', event)
	}

	const onMouseUp = (event: MouseEvent) => {
		const isLeftButton = event.button === 0
		if (!isLeftButton) return

		// Stop each note in the chord
		props.chord.notes.forEach((note) => {
			playbackStore.stopNote({ note })
		})
	}

	const onMouseLeave = () => {
		// Stop all notes when mouse leaves while pressed
		props.chord.notes.forEach((note) => {
			playbackStore.stopNote({ note })
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
	oncontextmenu={handleContextMenu}
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

	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="dragHandle" onmousedown={onDragHandleMouseDown}>
		<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path
				d="M8 6L12 10L16 6M8 18L12 14L16 18"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				transform="rotate(90 12 12)"
			/>
		</svg>
	</div>

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
		cursor: default;
		position: absolute;
		display: flex;
		align-items: center;
		justify-content: center;
		user-select: none;
		transition: background-color 0.1s ease;
		background-color: rgba(0, 0, 0, 0.3);
		top: 0;
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

	.dragHandle {
		position: absolute;
		top: 0;
		left: 0;
		width: 24px;
		height: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: grab;
		opacity: 0.5;
		transition: opacity 0.2s ease;
		z-index: 11;
	}

	.dragHandle:hover {
		opacity: 1;
	}

	.dragHandle:active {
		cursor: grabbing;
	}

	.dragHandle svg {
		width: 16px;
		height: 16px;
		color: currentColor;
	}
</style>
