<script lang="ts">
	type PatternEditorSignalPropsT = {
		signal: SignalT
		isSelected: boolean
		isDragging: boolean
		beatsPerCell: number
		cellWidth: number
		opacity?: number
		onSignalClick: (event: MouseEvent) => void
		onSignalMouseDown: (event: MouseEvent) => void
		onSignalDoubleClick: (event: MouseEvent) => void
		onResizeMouseDown: (event: MouseEvent, handle: 'left' | 'right') => void
	}

	const props: PatternEditorSignalPropsT = $props()

	const backgroundColor = $derived(props.isSelected ? 'var(--primary)' : 'var(--secondary-foreground)')
	// Convert beat-based timing to pixel positions
	// startTime is in beats, beatsPerCell tells us how many beats per cell
	const leftPosition = $derived((props.signal.startTime / props.beatsPerCell) * props.cellWidth)
	const width = $derived((props.signal.duration / props.beatsPerCell) * props.cellWidth - 1)
	const signalOpacity = $derived(props.opacity ?? 1)

	const handleResizeLeft = (event: MouseEvent) => {
		props.onResizeMouseDown(event, 'left')
	}

	const handleResizeRight = (event: MouseEvent) => {
		props.onResizeMouseDown(event, 'right')
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
	class="signal"
	class:selected={props.isSelected}
	onclick={props.onSignalClick}
	onmousedown={props.onSignalMouseDown}
	ondblclick={props.onSignalDoubleClick}
	data-signal-id={props.signal.id}
	data-signal-startTime={props.signal.startTime}
	data-signal-duration={props.signal.duration}
	data-is-dragging={props.isDragging}
	style="
    position: absolute;
    background: {backgroundColor};
    left: {leftPosition}px;
    width: {width}px;
    top: 1px;
	height: 30px;
    opacity: {signalOpacity};
  "
>
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="resizeHandle resizeHandleLeft" onmousedown={handleResizeLeft}></div>
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="resizeHandle resizeHandleRight" onmousedown={handleResizeRight}></div>
</div>

<style>
	/* So dragging a signal makes it appear above other signals. */
	[data-is-dragging='true'] {
		cursor: grabbing;
		z-index: 999;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
		transform: scale(1.02);
	}

	.signal {
		border-radius: 3px;
		cursor: grab;
		position: relative;
		transition:
			background-color 0.1s,
			transform 0.1s,
			box-shadow 0.1s;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
	}

	.signal:hover {
		filter: brightness(1.1);
	}

	.signal.selected {
		box-shadow:
			0 0 0 1px var(--background),
			0 0 0 2px var(--primary);
		z-index: 10;
	}

	.signal:active {
		cursor: grabbing;
	}

	.resizeHandle {
		position: absolute;
		top: 0;
		width: 6px; /* Wider handle for easier grabbing */
		height: 100%;
		z-index: 10;
		opacity: 0;
		transition: opacity 0.1s;
	}

	.resizeHandleLeft {
		left: 0;
		cursor: ew-resize;
		border-top-left-radius: 3px;
		border-bottom-left-radius: 3px;
	}

	.resizeHandleRight {
		right: 0;
		cursor: ew-resize;
		border-top-right-radius: 3px;
		border-bottom-right-radius: 3px;
	}

	.signal:hover .resizeHandle {
		opacity: 1;
		background: rgba(255, 255, 255, 0.2);
	}

	.resizeHandle:hover {
		background: rgba(255, 255, 255, 0.5) !important;
	}
</style>
