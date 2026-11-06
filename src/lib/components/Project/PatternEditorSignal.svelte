<script lang="ts">
	type PatternEditorSignalPropsT = {
		signal: SignalT
		isSelected: boolean
		isDragging: boolean
		beatsPerCell: number
		cellWidth: number
		cellHeight: number
		opacity?: number
		onSignalClick: (event: MouseEvent) => void
		onSignalMouseDown: (event: MouseEvent) => void
		onSignalDoubleClick: (event: MouseEvent) => void
		onResizeMouseDown: (event: MouseEvent, handle: 'left' | 'right') => void
	}

	const props: PatternEditorSignalPropsT = $props()

	const backgroundColor = $derived('var(--purple)')
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
	height: {props.cellHeight - 2}px;
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
		outline: 2px solid var(--foreground);
	}

	.signal {
		border-radius: var(--radius-sm);
		cursor: grab;
		position: relative;
		transition: filter var(--motion-instant) linear;
	}

	.signal:hover {
		filter: brightness(1.1);
	}

	.signal.selected {
		outline: 2px solid var(--foreground);
		outline-offset: 1px;
		z-index: 10;
	}

	.signal:active {
		cursor: grabbing;
	}

	.resizeHandle {
		position: absolute;
		top: 0;
		width: 6px;
		height: 100%;
		z-index: 10;
		opacity: 0;
		transition: opacity var(--motion-instant) linear;
	}

	.resizeHandleLeft {
		left: 0;
		cursor: ew-resize;
		border-top-left-radius: var(--radius-sm);
		border-bottom-left-radius: var(--radius-sm);
	}

	.resizeHandleRight {
		right: 0;
		cursor: ew-resize;
		border-top-right-radius: var(--radius-sm);
		border-bottom-right-radius: var(--radius-sm);
	}

	.signal:hover .resizeHandle {
		opacity: 1;
		background: color-mix(in oklch, var(--background) 25%, transparent);
	}

	.resizeHandle:hover {
		background: color-mix(in oklch, var(--background) 55%, transparent) !important;
	}
</style>
