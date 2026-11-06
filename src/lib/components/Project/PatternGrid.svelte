<script lang="ts">
	import PatternRoll from './PatternRoll.svelte'
	import PatternRowLabels from './PatternRowLabels.svelte'
	import PatternRuler from './PatternRuler.svelte'
	import PatternVelocityLane from './PatternVelocityLane.svelte'
	import { handlePatternKey } from '$lib/midiGrid/keymap'
	import type { PatternEditorT } from '$lib/midiGrid/editor'
	import { RULER_HEIGHT, ROW_LABELS_WIDTH } from '$lib/midiGrid/constants'

	type PatternGridPropsT = {
		editor: PatternEditorT
		rowNoteNames: Map<string, string>
		onRowPress: (rowId: string) => void
		onRowRelease: () => void
		onZoomStep: (direction: 1 | -1) => void
	}

	const props: PatternGridPropsT = $props()

	const gridStyle = $derived(
		`--labels-width: ${ROW_LABELS_WIDTH}px; --ruler-height: ${RULER_HEIGHT}px`
	)

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
		<PatternRuler editor={props.editor} onZoomStep={props.onZoomStep} />
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

	<div class="pattern-grid-lane-label">Velocity</div>
	<div class="pattern-grid-lane">
		<PatternVelocityLane editor={props.editor} onZoomStep={props.onZoomStep} />
	</div>
</div>

<style>
	.pattern-grid {
		flex: 1;
		min-height: 0;
		display: grid;
		grid-template-columns: var(--labels-width) minmax(0, 1fr);
		grid-template-rows: var(--ruler-height) minmax(0, 1fr) var(--lane-height);
		outline: none;
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

	.pattern-grid-lane-label {
		padding: var(--spacing-2);
		background: var(--card);
		border-top: 1px solid var(--border);
		border-right: 1px solid var(--border);
		color: var(--muted-foreground);
		font-weight: var(--font-weight-semibold);
		font-size: var(--font-size-caption, 11px);
		user-select: none;
	}
</style>
