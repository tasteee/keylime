<script lang="ts">
	import { onMount } from 'svelte'
	import { SIGNAL_IDS } from '$lib/constants/signalRows'
	import { MAX_ROW_HEIGHT, MIN_ROW_HEIGHT, DRAG_THRESHOLD_PX } from '$lib/midiGrid/constants'
	import { DEFAULT_VIEW, type PatternEditorT } from '$lib/midiGrid/editor'
	import type { ViewT } from '$lib/midiGrid/types'

	type PatternRowLabelsPropsT = {
		editor: PatternEditorT
		// Row id to the note it plays against the selected chord. "C3", "E3", ...
		rowNoteNames: Map<string, string>
		onRowPress: (rowId: string) => void
		onRowRelease: () => void
	}

	const props: PatternRowLabelsPropsT = $props()

	// Dragging up or down changes the row height by one pixel
	// for every this many pixels moved.
	const RESIZE_DRAG_PX_PER_PX = 3

	const MIN_FONT_SIZE = 11
	const MAX_FONT_SIZE = 14

	let view: ViewT = $state(DEFAULT_VIEW)
	let isPressed = false
	let isResizingRows = false
	let pressStartY = 0
	let pressStartRowHeight = 0
	let pressAnchorRow = 0
	let pressLocalY = 0

	// Labels slide with the grid so they stay level with their rows.
	const offsetY = $derived(-view.scrollRow * view.rowHeight)

	const fontSize = $derived.by(() => {
		const clampedHeight = Math.max(MIN_ROW_HEIGHT, Math.min(MAX_ROW_HEIGHT, view.rowHeight))
		const progress = (clampedHeight - MIN_ROW_HEIGHT) / (MAX_ROW_HEIGHT - MIN_ROW_HEIGHT)
		return MIN_FONT_SIZE + progress * (MAX_FONT_SIZE - MIN_FONT_SIZE)
	})

	const listStyle = $derived(`transform: translateY(${offsetY}px)`)
	const rowStyle = $derived(`height: ${view.rowHeight}px; font-size: ${fontSize}px`)

	// Press plays the row's note. Dragging up or down instead
	// resizes every row, keeping the row under the pointer in place.
	const handlePointerDown = (event: PointerEvent, rowId: string) => {
		isPressed = true
		isResizingRows = false
		pressStartY = event.clientY
		pressStartRowHeight = view.rowHeight
		const labelColumn = (event.currentTarget as HTMLElement).closest('.pattern-row-labels')
		const containerTop = labelColumn?.getBoundingClientRect().top ?? 0
		const localY = event.clientY - containerTop
		pressAnchorRow = view.scrollRow + localY / view.rowHeight
		pressLocalY = localY
		props.onRowPress(rowId)
	}

	const handlePointerEnter = (rowId: string) => {
		if (!isPressed) return
		if (isResizingRows) return
		props.onRowPress(rowId)
	}

	const applyRowResize = (event: PointerEvent) => {
		const dragY = event.clientY - pressStartY
		const rawRowHeight = pressStartRowHeight + dragY / RESIZE_DRAG_PX_PER_PX
		const clampedRowHeight = Math.min(MAX_ROW_HEIGHT, Math.max(MIN_ROW_HEIGHT, rawRowHeight))
		const rowHeight = Math.round(clampedRowHeight)
		const scrollRow = pressAnchorRow - pressLocalY / rowHeight
		props.editor.setView({ rowHeight, scrollRow })
	}

	const handlePointerMove = (event: PointerEvent) => {
		if (!isPressed) return

		const dragDistance = Math.abs(event.clientY - pressStartY)
		const hasMovedEnough = dragDistance >= DRAG_THRESHOLD_PX
		const isStartingResize = hasMovedEnough && !isResizingRows
		if (isStartingResize) {
			isResizingRows = true
			props.onRowRelease()
		}

		if (isResizingRows) applyRowResize(event)
	}

	const handlePointerUp = () => {
		if (!isPressed) return
		isPressed = false
		isResizingRows = false
		props.onRowRelease()
	}

	onMount(() => {
		view = props.editor.getView()
		const unsubscribe = props.editor.subscribe(() => {
			view = props.editor.getView()
		})
		window.addEventListener('pointerup', handlePointerUp)
		window.addEventListener('pointermove', handlePointerMove)

		return () => {
			unsubscribe()
			window.removeEventListener('pointerup', handlePointerUp)
			window.removeEventListener('pointermove', handlePointerMove)
		}
	})
</script>

<div class="pattern-row-labels">
	<div class="pattern-row-labels-list" style={listStyle}>
		{#each SIGNAL_IDS as rowId (rowId)}
			{@const noteName = props.rowNoteNames.get(rowId)}
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="pattern-row-label"
				style={rowStyle}
				onpointerdown={(event) => handlePointerDown(event, rowId)}
				onpointerenter={() => handlePointerEnter(rowId)}
			>
				<span class="pattern-row-label-id">{rowId}</span>
				{#if noteName}
					<span class="pattern-row-label-note">{noteName}</span>
				{/if}
			</div>
		{/each}
	</div>
</div>

<style>
	.pattern-row-labels {
		position: relative;
		overflow: hidden;
		background: var(--card);
		border-right: 1px solid var(--border);
		user-select: none;
	}

	.pattern-row-labels-list {
		display: flex;
		flex-direction: column;
		will-change: transform;
	}

	/* border-box keeps each label exactly one row tall, so the labels
	   stay level with the grid rows drawn at rowHeight spacing. */
	.pattern-row-label {
		box-sizing: border-box;
		display: flex;
		touch-action: none;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		gap: var(--spacing-2);
		flex-shrink: 0;
		padding: 0 var(--spacing-2);
		font-weight: var(--font-weight-semibold);
		color: var(--muted-foreground);
		border-bottom: 1px solid var(--border);
		cursor: ns-resize;
		transition:
			color var(--motion-instant) linear,
			background-color var(--motion-instant) linear;
	}

	.pattern-row-label:hover {
		color: var(--foreground);
		background: var(--background-light);
	}

	.pattern-row-label-note {
		color: var(--foreground);
		font-weight: var(--font-weight-bold);
	}
</style>
