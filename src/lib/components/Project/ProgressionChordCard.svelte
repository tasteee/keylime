<script lang="ts">
	import playbackStore from '$lib/stores/playback.svelte'
	import projectStore from '$lib/stores/project.svelte'
	import { chordModifierStore } from '$lib/stores/chordModifier.svelte'
	import Icon from '@iconify/svelte'
	import ChordSymbolDisplay from './ChordSymbolDisplay.svelte'

	type ProgressionChordCardPropsT = {
		item: ProgressionItemT
		index: number
		isDragging: boolean
		isResizing: boolean
		pixelsPerBeat: number
		selectItem: (event: MouseEvent) => void
		onItemMouseDown: (event: MouseEvent) => void
		onResizeMouseDown: (event: MouseEvent) => void
	}

	const props: ProgressionChordCardPropsT = $props()
	const isRest = $derived(props.item.type === 'rest')
	const isSelected = $derived(props.item.id === projectStore.selectedProgressionItemId)

	const width = $derived(`${(props.item.durationBeats ?? 0) * props.pixelsPerBeat + (props.index === 0 ? 0 : 0)}px`)

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
			playbackStore.playChord(props.item as ProgressionChordT, projectStore.octave)
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
	data-is-dragging={props.isDragging}
	data-is-resizing={props.isResizing}
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
	style="width: {width};"
>
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="dragHandle" onmousedown={onDragHandleMouseDown}>
		{#if props.isDragging}
			<Icon icon="mingcute:hand-grab-line" width="55" height="55" class="resizingIcon" style="color: black;" />
		{:else}
			<Icon icon="mingcute:selector-horizontal-fill" width="24" height="24" />
		{/if}
	</div>

	<div class="itemContent">
		<ChordSymbolDisplay symbol={props.item.symbol} />
		{#if isModified}
			<span class="modifiedIndicator">●</span>
		{/if}
	</div>

	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="resizeHandle resizeHandleRight" onmousedown={handleResizeRight}>
		{#if props.isResizing}
			<Icon icon="mingcute:hand-grab-line" width="55" height="55" class="resizingIcon" style="color: black;" />
		{:else}
			<div class="resizeHandleBar"></div>
		{/if}
	</div>
</div>

<style>
	.progressionItem {
		align-items: center;
		background-color: var(--n-01);
		border-radius: 5px;
		border: 1px solid var(--n-04);
		color: var(--chord-fg);
		cursor: default;
		display: flex;
		flex-shrink: 0;
		font-family: var(--font-sans);
		height: -webkit-fill-available;
		justify-content: center;
		overflow: visible;
		position: relative;
		user-select: none;
		z-index: 10;
		opacity: 0.8;
	}

	.progressionItem:hover {
		background: var(--colorWhite);
	}

	.progressionItem.isSelected {
		background-color: var(--a-01);
		color: var(--chord-selected-fg);
		border-color: var(--a);
		z-index: 20;
	}

	/* Rest State Styles */
	.progressionItem.isRest {
		background-color: var(--n-02);
		color: var(--muted-foreground);
		border-style: dashed;
		border-width: 1px;
		border-color: var(--n-04);
		opacity: 0.75;
		box-shadow: none;
	}

	.progressionItem.isRest:hover {
		background: var(--n-01);
	}

	.progressionItem.isRest.isSelected {
		color: var(--foreground);
		background: var(--a-01);
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

	.modifiedIndicator {
		font-size: 12px;
		color: var(--color-pop-pink);
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

	.resizeHandle {
		position: absolute;
		top: 0;
		width: 24px;
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

	[data-is-dragging='true'] {
		cursor: none !important;
		z-index: 999;
		opacity: 0.9;
		transform: scale(1.05) rotate(1deg);
	}

	[data-is-dragging='true'] .dragHandle {
		opacity: 1;
	}

	/* Active Resizing State */
	[data-is-resizing='true'] {
		cursor: none !important;
	}

	[data-is-resizing='true'] .resizeHandle {
		opacity: 1;
		cursor: none !important;
	}

	[data-is-resizing='true'] .resizeHandleBar {
		display: none;
	}

	/* Disable all hover effects during drag or resize on ANY card */
	:global([data-is-dragging='true']) .progressionItem:hover,
	:global([data-is-resizing='true']) .progressionItem:hover {
		background-color: var(--n-01);
	}

	:global([data-is-dragging='true']) .progressionItem.isRest:hover,
	:global([data-is-resizing='true']) .progressionItem.isRest:hover {
		background-color: var(--color-stipple);
		border-color: var(--border-thick);
	}

	:global([data-is-dragging='true']) .progressionItem:hover .dragHandle,
	:global([data-is-resizing='true']) .progressionItem:hover .dragHandle {
		opacity: 0;
	}

	:global([data-is-dragging='true']) .progressionItem:hover .resizeHandle,
	:global([data-is-resizing='true']) .progressionItem:hover .resizeHandle {
		opacity: 0;
	}

	:global([data-is-dragging='true']) .dragHandle:hover,
	:global([data-is-resizing='true']) .dragHandle:hover {
		opacity: 0;
		background: none;
	}

	:global([data-is-dragging='true']) .resizeHandle:hover,
	:global([data-is-resizing='true']) .resizeHandle:hover {
		opacity: 0;
		background: none;
	}

	/* Disable all cursors during drag/resize operations */
	:global([data-is-dragging='true']) .progressionItem,
	:global([data-is-dragging='true']) .dragHandle,
	:global([data-is-dragging='true']) .resizeHandle,
	:global([data-is-dragging='true']) .itemContent,
	:global([data-is-resizing='true']) .progressionItem,
	:global([data-is-resizing='true']) .dragHandle,
	:global([data-is-resizing='true']) .resizeHandle,
	:global([data-is-resizing='true']) .itemContent {
		cursor: none !important;
		pointer-events: none;
	}

	/* Allow the active dragging/resizing card to receive pointer events */
	[data-is-dragging='true'],
	[data-is-resizing='true'] {
		pointer-events: auto;
	}
</style>
