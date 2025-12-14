<script lang="ts">
	import playbackStore from '$lib/stores/playback.svelte'
	import { progressionStore } from '$lib/stores/progression.svelte'
	import { chordModifierStore } from '$lib/stores/chordModifier.svelte'

	type ProgressionChordCardPropsT = {
		item: ProgressionItemT
		index: number
		isDragging: boolean
		pixelsPerBeat: number
		gapSize: number
		selectItem: (event: MouseEvent) => void
		onItemMouseDown: (event: MouseEvent) => void
		onResizeMouseDown: (event: MouseEvent) => void
	}

	const props: ProgressionChordCardPropsT = $props()
	const isRest = $derived(props.item.type === 'rest')
	const isSelected = $derived(props.item.id === progressionStore.selectedItemId)

	// Position and width are now based on pixels - startTime is calculated from item order
	// Add cumulative gap offset based on item index
	const leftPosition = $derived(`${(props.item.startTime ?? 0) * props.pixelsPerBeat + props.index * props.gapSize}px`)
	const width = $derived(`${(props.item.durationBeats ?? 0) * props.pixelsPerBeat}px`)

	// Check if chord is modified from original (only applicable to chords)
	const isModified = $derived.by(() => {
		if (props.item.type !== 'chord') return false
		const chord = props.item as ProgressionChordT
		return chord.octaveOffset !== 0 || chord.inversion !== 0 || chord.voicing !== 'closed'
	})

	const displayText = $derived.by(() => {
		if (props.item.type === 'rest') return 'REST'
		return (props.item as ProgressionChordT).symbol
	})

	const handleContextMenu = (event: MouseEvent) => {
		event.preventDefault()
		event.stopPropagation()

		// Only open chord modifier for chord items, not rests
		if (props.item.type === 'chord') {
			chordModifierStore.openForProgressionChord({
				chordId: props.item.id
			})
		}
	}

	const handleResizeRight = (event: MouseEvent) => {
		props.onResizeMouseDown(event)
	}

	const onMouseDown = (event: MouseEvent) => {
		const target = event.target as HTMLElement
		if (target.closest('.resizeHandle')) return
		if (target.closest('.dragHandle')) return

		// Only play chords, not rests
		if (props.item.type === 'chord') {
			playbackStore.playChord(props.item as ProgressionChordT)
		}
	}

	const onDragHandleMouseDown = (event: MouseEvent) => {
		event.stopPropagation()
		event.preventDefault()
		props.onItemMouseDown(event)
		console.log('onDragHandleMouseDown', event)
	}

	const onMouseUp = (event: MouseEvent) => {
		const isLeftButton = event.button === 0
		if (!isLeftButton) return

		// Stop playback handled by playChord internally
	}

	const onMouseLeave = () => {
		// Stop playback handled by playChord internally
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
	class="progressionItem"
	class:isRest
	class:isSelected
	onclick={props.selectItem}
	onmousedown={onMouseDown}
	onmouseup={onMouseUp}
	onmouseleave={onMouseLeave}
	oncontextmenu={handleContextMenu}
	data-item-id={props.item.id}
	data-item-type={props.item.type}
	data-item-starttime={props.item.startTime}
	data-item-duration={props.item.durationBeats}
	data-is-dragging={props.isDragging}
	style="
    left: {leftPosition};
    width: {width};
  "
>
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="dragHandle" onmousedown={onDragHandleMouseDown}>
		<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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

	<div class="itemContent">
		<span class="itemText">{displayText}</span>
		{#if isModified}
			<span class="modifiedIndicator">●</span>
		{/if}
	</div>

	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="resizeHandle resizeHandleRight" onmousedown={handleResizeRight}>
		<div class="resizeHandleBar"></div>
	</div>
</div>

<style>
	.progressionItem {
		height: calc(100% - 24px);
		top: 24px;
		border-radius: 0px;
		border: var(--border-thick);
		cursor: default;
		position: absolute;
		display: flex;
		align-items: center;
		justify-content: center;
		user-select: none;
		transition: all 0.1s ease-in-out;
		background-color: var(--chord-bg);
		color: var(--chord-fg);
		box-shadow: var(--shadow-hard);
		overflow: visible;
		font-family: var(--font-sans);
	}

	.progressionItem:hover {
		transform: translate(-2px, -2px) rotate(1deg);
		box-shadow: var(--shadow-hard-hover);
		z-index: 10;
		border-color: var(--color-ink);
	}

	.progressionItem.isSelected {
		background-color: var(--chord-selected-bg);
		color: var(--chord-selected-fg);
		border-color: var(--chord-selected-border);
		box-shadow: var(--shadow-hard-active);
		transform: translate(4px, 4px);
		z-index: 20;
	}

	.progressionItem.isRest {
		background-color: var(--color-stipple);
		color: var(--muted-foreground);
		border-style: dashed;
		border-width: 3px;
		opacity: 1;
		box-shadow: none;
	}

	.progressionItem.isRest:hover {
		border-color: var(--color-ink);
		transform: translate(-2px, -2px);
		box-shadow: var(--shadow-hard-hover);
	}

	.progressionItem.isRest.isSelected {
		background-color: var(--color-stipple);
		color: var(--foreground);
		border-color: var(--color-ink);
		border-style: solid;
		box-shadow: var(--shadow-hard-active);
		transform: translate(4px, 4px);
	}

	/* So dragging an item makes it appear above other items. */
	[data-is-dragging='true'] {
		cursor: grabbing;
		z-index: 999;
		opacity: 0.9;
		transform: scale(1.05) rotate(2deg);
		box-shadow: var(--shadow-hard-hover);
	}

	.itemContent {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 15px;
		font-weight: 600;
		pointer-events: none;
		z-index: 2;
	}

	.itemText {
		font-weight: 700;
		letter-spacing: -0.01em;
		font-family: var(--font-display);
		font-size: 18px;
	}

	.isRest .itemText {
		font-size: 14px;
		letter-spacing: 0.1em;
		font-weight: 600;
		text-transform: uppercase;
		font-family: var(--font-mono);
	}

	.modifiedIndicator {
		font-size: 12px;
		color: var(--color-pop-pink);
	}

	.resizeHandle {
		position: absolute;
		top: 0;
		width: 16px;
		height: 100%;
		z-index: 10;
		cursor: col-resize;
		display: flex;
		align-items: center;
		justify-content: center;
		opacity: 0;
		transition: opacity 0.15s ease;
	}

	.resizeHandleRight {
		right: 0;
	}

	.resizeHandleBar {
		width: 6px;
		height: 24px;
		background-color: var(--color-ink);
		border-radius: 99px;
		opacity: 0.5;
		transition: opacity 0.1s;
	}

	.resizeHandle:hover .resizeHandleBar {
		opacity: 1;
		background-color: var(--color-pop-pink);
	}

	.progressionItem:hover .resizeHandle {
		opacity: 1;
	}

	.resizeHandle:hover {
		background: linear-gradient(to left, rgba(0, 0, 0, 0.03), transparent);
	}

	.dragHandle {
		position: absolute;
		top: 0;
		left: 0;
		width: 28px;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: grab;
		opacity: 0;
		transition: opacity 0.2s ease;
		z-index: 11;
		color: var(--color-ink);
	}

	.progressionItem:hover .dragHandle {
		opacity: 0.5;
	}

	.dragHandle:hover {
		opacity: 1 !important;
		color: var(--color-pop-pink);
		background: linear-gradient(to right, rgba(0, 0, 0, 0.03), transparent);
	}

	.dragHandle:active {
		cursor: grabbing;
	}
</style>
