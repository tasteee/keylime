<script lang="ts">
	import PatternRoll from './PatternRoll.svelte'
	import PatternRowLabels from './PatternRowLabels.svelte'
	import PatternRuler from './PatternRuler.svelte'
	import PatternVelocityLane from './PatternVelocityLane.svelte'
	import { handlePatternKey } from '$lib/midiGrid/keymap'
	import type { PatternEditorT } from '$lib/midiGrid/editor'
	import { CaretDown, CaretUp } from 'phosphor-svelte'
	import {
		RULER_HEIGHT,
		ROW_LABELS_WIDTH,
		VELOCITY_LANE_COLLAPSED_HEIGHT,
		VELOCITY_LANE_MAX_HEIGHT,
		VELOCITY_LANE_SNAP_HEIGHT
	} from '$lib/midiGrid/constants'
	import { clampNumber } from '$lib/midiGrid/time'

	type PatternGridPropsT = {
		editor: PatternEditorT
		rowNoteNames: Map<string, string>
		onRowPress: (rowId: string) => void
		onRowRelease: () => void
		onZoomStep: (direction: 1 | -1) => void
		onCellPixelsChange: (cellPixels: number) => void
		laneHeight: number
		isLaneCollapsed: boolean
		onLaneHeightChange: (height: number) => void
		onLaneCollapsedChange: (isCollapsed: boolean) => void
	}

	const props: PatternGridPropsT = $props()

	const gridStyle = $derived(
		`--labels-width: ${ROW_LABELS_WIDTH}px; --ruler-height: ${RULER_HEIGHT}px`
	)

	// ---- Resizing the velocity lane ----

	let dragStartY = 0
	let dragStartHeight = 0
	let isResizing = $state(false)

	const getHeightAtDrag = (clientY: number): number => {
		const distanceUp = dragStartY - clientY
		return dragStartHeight + distanceUp
	}

	const handleResizePointerDown = (event: PointerEvent) => {
		if (event.button !== 0) return
		const handle = event.currentTarget as HTMLElement
		handle.setPointerCapture(event.pointerId)
		dragStartY = event.clientY
		dragStartHeight = props.isLaneCollapsed ? VELOCITY_LANE_COLLAPSED_HEIGHT : props.laneHeight
		isResizing = true
	}

	// Past the snap height the lane closes. Pulling it back up reopens it.
	const handleResizePointerMove = (event: PointerEvent) => {
		if (!isResizing) return
		const draggedHeight = getHeightAtDrag(event.clientY)
		const shouldCollapse = draggedHeight < VELOCITY_LANE_SNAP_HEIGHT
		props.onLaneCollapsedChange(shouldCollapse)
		if (shouldCollapse) return

		const nextHeight = clampNumber({
			value: draggedHeight,
			min: VELOCITY_LANE_SNAP_HEIGHT,
			max: VELOCITY_LANE_MAX_HEIGHT
		})
		props.onLaneHeightChange(nextHeight)
	}

	const handleResizePointerUp = (event: PointerEvent) => {
		if (!isResizing) return
		isResizing = false
		const handle = event.currentTarget as HTMLElement
		if (handle.hasPointerCapture(event.pointerId)) handle.releasePointerCapture(event.pointerId)
	}

	const handleToggleLane = () => {
		props.onLaneCollapsedChange(!props.isLaneCollapsed)
	}

	const toggleLabel = $derived(props.isLaneCollapsed ? 'Open velocity lane' : 'Close velocity lane')
	const ToggleIcon = $derived(props.isLaneCollapsed ? CaretUp : CaretDown)

	// Keys only count while the grid has focus, so typing in other
	// fields and the page's own shortcuts are left alone.
	const handleKeyDown = (event: KeyboardEvent) => {
		const didHandle = handlePatternKey({ editor: props.editor, event })
		if (didHandle) event.preventDefault()
	}
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
<div
	class="pattern-grid"
	style={gridStyle}
	tabindex="0"
	role="application"
	aria-label="Pattern editor"
	data-pattern-frame
	onkeydown={handleKeyDown}
>
	<div class="pattern-grid-corner"></div>
	<div class="pattern-grid-ruler">
		<PatternRuler
				editor={props.editor}
				onZoomStep={props.onZoomStep}
				onCellPixelsChange={props.onCellPixelsChange}
			/>
	</div>

	<div class="pattern-grid-labels">
		<PatternRowLabels
			editor={props.editor}
			rowNoteNames={props.rowNoteNames}
			onRowPress={props.onRowPress}
			onRowRelease={props.onRowRelease}
		/>
	</div>
	<PatternRoll editor={props.editor} onZoomStep={props.onZoomStep} />

	<div class="pattern-grid-lane-label">
		<div class="pattern-grid-lane-label-row">
			<span>Velocity</span>
			<button
				type="button"
				class="pattern-grid-lane-toggle"
				aria-label={toggleLabel}
				aria-expanded={!props.isLaneCollapsed}
				onclick={handleToggleLane}
			>
				<ToggleIcon size={12} weight="bold" />
			</button>
		</div>
	</div>
	<div class="pattern-grid-lane">
		{#if !props.isLaneCollapsed}
			<PatternVelocityLane editor={props.editor} onZoomStep={props.onZoomStep} />
		{/if}
	</div>

	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div
		class="pattern-grid-resize-handle"
		class:isResizing
		role="separator"
		aria-orientation="horizontal"
		aria-label="Resize velocity lane"
		onpointerdown={handleResizePointerDown}
		onpointermove={handleResizePointerMove}
		onpointerup={handleResizePointerUp}
		onpointercancel={handleResizePointerUp}
	></div>
</div>

<style>
	.pattern-grid {
		position: relative;
		flex: 1;
		min-height: 0;
		display: grid;
		grid-template-columns: var(--labels-width) minmax(0, 1fr);
		grid-template-rows: var(--ruler-height) minmax(0, 1fr) var(--lane-height);
		outline: none;
		/* The header sits above, so only the bottom corners follow the
		   editor frame, inside its 1px border. */
		border-radius: 0 0 calc(var(--radius-lg) - 1px) calc(var(--radius-lg) - 1px);
		overflow: hidden;
	}

	.pattern-grid:focus-visible {
		outline: 1px solid var(--active-accent);
		outline-offset: -1px;
	}

	.pattern-grid-corner {
		background: var(--card);
		border-right: 1px solid var(--border);
		border-bottom: 1px solid var(--border);
	}

	.pattern-grid-ruler,
	.pattern-grid-lane {
		min-width: 0;
		min-height: 0;
	}

	.pattern-grid-labels {
		min-height: 0;
		display: flex;
		flex-direction: column;
	}

	.pattern-grid-labels > :global(*) {
		flex: 1;
	}

	/* The label sits at the top. Its padding centers it in the
	   collapsed lane, so it stays put when the lane opens. */
	.pattern-grid-lane-label {
		padding: calc(var(--spacing-1) * 1.5) var(--spacing-2) 0;
		background: var(--card);
		border-top: 1px solid var(--border);
		border-right: 1px solid var(--border);
		color: var(--muted-foreground);
		font-weight: var(--font-weight-semibold);
		font-size: var(--font-size-caption, 11px);
		user-select: none;
	}

	.pattern-grid-lane-label-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		min-height: var(--spacing-5);
	}
	.pattern-grid-lane-toggle {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--spacing-1);
		border: none;
		border-radius: var(--radius-sm);
		background: transparent;
		color: var(--muted-foreground);
		cursor: pointer;
	}

	.pattern-grid-lane-toggle:hover {
		background: var(--muted);
		color: var(--foreground);
	}

	/* A strip over the lane's top border. A pill shows on hover. */
	.pattern-grid-resize-handle {
		position: absolute;
		left: 0;
		right: 0;
		bottom: calc(var(--lane-height) - 4px);
		z-index: 5;
		height: 8px;
		cursor: ns-resize;
		touch-action: none;
	}

	.pattern-grid-resize-handle::after {
		content: '';
		position: absolute;
		top: 2px;
		left: 50%;
		width: 32px;
		height: 4px;
		border-radius: var(--radius-full, 999px);
		background: var(--border);
		opacity: 0;
		transform: translateX(-50%);
		transition: opacity 120ms ease;
	}

	.pattern-grid-resize-handle:hover::after,
	.pattern-grid-resize-handle.isResizing::after {
		opacity: 1;
	}

	.pattern-grid-resize-handle.isResizing::after {
		background: var(--active-accent);
	}
</style>
