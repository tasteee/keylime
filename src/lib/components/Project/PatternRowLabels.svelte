<script lang="ts">
	import { onMount } from 'svelte'
	import { SIGNAL_IDS } from '$lib/constants/signalRows'
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

	const MIN_ROW_HEIGHT = 16
	const MAX_ROW_HEIGHT = 48
	const MIN_FONT_SIZE = 11
	const MAX_FONT_SIZE = 14

	let view: ViewT = $state(DEFAULT_VIEW)
	let isPressed = false

	// Labels slide with the grid so they stay level with their rows.
	const offsetY = $derived(-view.scrollRow * view.rowHeight)

	const fontSize = $derived.by(() => {
		const clampedHeight = Math.max(MIN_ROW_HEIGHT, Math.min(MAX_ROW_HEIGHT, view.rowHeight))
		const progress = (clampedHeight - MIN_ROW_HEIGHT) / (MAX_ROW_HEIGHT - MIN_ROW_HEIGHT)
		return MIN_FONT_SIZE + progress * (MAX_FONT_SIZE - MIN_FONT_SIZE)
	})

	const listStyle = $derived(`transform: translateY(${offsetY}px)`)
	const rowStyle = $derived(`height: ${view.rowHeight}px; font-size: ${fontSize}px`)

	const handlePointerDown = (rowId: string) => {
		isPressed = true
		props.onRowPress(rowId)
	}

	const handlePointerEnter = (rowId: string) => {
		if (!isPressed) return
		props.onRowPress(rowId)
	}

	const handlePointerUp = () => {
		if (!isPressed) return
		isPressed = false
		props.onRowRelease()
	}

	onMount(() => {
		view = props.editor.getView()
		const unsubscribe = props.editor.subscribe(() => {
			view = props.editor.getView()
		})
		window.addEventListener('pointerup', handlePointerUp)

		return () => {
			unsubscribe()
			window.removeEventListener('pointerup', handlePointerUp)
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
				onpointerdown={() => handlePointerDown(rowId)}
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

	.pattern-row-label {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		gap: var(--spacing-2);
		flex-shrink: 0;
		padding: 0 var(--spacing-2);
		font-weight: var(--font-weight-semibold);
		color: var(--muted-foreground);
		border-bottom: 1px solid var(--border);
		cursor: pointer;
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
