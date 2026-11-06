<script lang="ts">
	import playbackStore from '$lib/stores/playback.svelte'
	import { HandGrabbing, DotsSixVertical } from 'phosphor-svelte'
	import { getChordColor } from '$lib/helpers/chordColors'
	import ChordSymbolDisplay from './ChordSymbolDisplay.svelte'
	import DialogChordModifier from './DialogChordModifier.svelte'
	import { getContext } from 'svelte'

	type ProjectEditorContextT = {
		state: {
			project: ProjectT
			isLoading: boolean
			isSaving: boolean
			isDirty: boolean
			cleanProjectSnapshot: string
			activeView: 'chords' | 'pattern'
			selectedProgressionItemId: string | null
		}
		updateProject: (updates: Partial<ProjectT>) => void
		updateProgressionItem: (updatedItem: Partial<ProgressionItemT>) => void
		addProgressionChord: (chord: ChordT) => void
		addProgressionRest: () => void
		removeProgressionItem: (id: string) => void
		duplicateProgressionItem: (id: string) => void
		reorderProgressionItem: (args: { itemId: string; newIndex: number }) => void
		selectProgressionItem: (id: string | null) => void
		addPatternSignal: (signal: SignalT) => void
		updatePatternSignal: (signalId: string, updates: Partial<SignalT>) => void
		removePatternSignal: (signalId: string) => void
		movePatternSignalToRow: (args: MoveSignalToRowOptionsT) => void
		save: () => Promise<{ didSucceed: boolean }>
		saveClone: () => Promise<{ didSucceed: boolean; newProjectId: string }>
		checkIsDirty: () => boolean
	}

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

	const context = getContext<ProjectEditorContextT>('projectEditor')
	const props: ProgressionChordCardPropsT = $props()
	let isModifierDialogOpen = $state(false)
	const isRest = $derived(props.item.type === 'rest')
	const chordColor = $derived.by(() => {
		return getChordColor({ symbol: props.item.symbol })
	})
	const isSelected = $derived(props.item.id === context.state.selectedProgressionItemId)
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

	// Right-click opens the chord modifier directly. Rests have no modifiers.
	const handleContextMenu = (event: MouseEvent) => {
		event.preventDefault()
		event.stopPropagation()
		if (isRest) return
		isModifierDialogOpen = true
	}

	const handleModifierClose = () => {
		isModifierDialogOpen = false
	}

	const handleModifierSave = (args: { octaveOffset: number; inversion: number; voicing: VoicingT }) => {
		context.updateProgressionItem({
			id: props.item.id,
			octaveOffset: args.octaveOffset,
			inversion: args.inversion,
			voicing: args.voicing
		})
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
			playbackStore.previewChord(props.item as ProgressionChordT, context.state.project)
			window.addEventListener('mouseup', playbackStore.stopChordPreview, { once: true })
		}
	}

	const onDragHandleMouseDown = (event: MouseEvent) => {
		event.stopPropagation()
		event.preventDefault()
		props.onItemMouseDown(event)
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
	data-chord-color={chordColor}
	onclick={props.selectItem}
	onmousedown={onMouseDown}
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
			<HandGrabbing size={40} weight="fill" />
		{:else}
			<DotsSixVertical size={20} weight="bold" />
		{/if}
	</div>

	<div class="itemContent">
		<ChordSymbolDisplay symbol={props.item.symbol} />
		{#if isModified}
			<span class="modifiedIndicator">*</span>
		{/if}
	</div>

	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="resizeHandle resizeHandleRight" onmousedown={handleResizeRight}>
		{#if props.isResizing}
			<HandGrabbing size={40} weight="fill" />
		{:else}
			<div class="resizeHandleBar"></div>
		{/if}
	</div>
</div>

{#if props.item.type === 'chord' && isModifierDialogOpen}
	<DialogChordModifier
		isOpen={isModifierDialogOpen}
		chord={props.item as ProgressionChordT}
		projectOctave={context.state.project.octave}
		onClose={handleModifierClose}
		onSave={handleModifierSave}
	/>
{/if}

<style>
	.progressionItem {
		position: relative;
		display: flex;
		box-sizing: border-box;
		flex-shrink: 0;
		align-items: center;
		justify-content: center;
		height: auto;
		--chord-tint: 22%;
		background: color-mix(in oklch, var(--chord-hue, var(--foreground)) var(--chord-tint), var(--card));
		border: 1px solid color-mix(in oklch, var(--chord-hue, var(--foreground)) 70%, var(--card));
		border-radius: var(--radius-sm);
		color: var(--foreground);
		cursor: default;
		user-select: none;
		z-index: 10;
		transition:
			background var(--motion-fast) var(--ease-enter),
			border-color var(--motion-fast) var(--ease-enter);
	}

	.progressionItem:hover {
		--chord-tint: 32%;
	}

	/* Selected is one step up in tone: deeper tint, stronger border. */
	.progressionItem.isSelected {
		--chord-tint: 42%;
		border-color: var(--chord-hue, var(--foreground));
		z-index: 20;
	}

	.progressionItem.isRest {
		background: var(--color-neutral-2);
		border-style: dashed;
		color: var(--muted-foreground);
	}

	.progressionItem.isRest.isSelected {
		border-color: var(--color-neutral-5);
		background: var(--color-neutral-3);
		color: var(--foreground);
	}

	.itemContent {
		position: relative;
		display: flex;
		align-items: center;
		gap: var(--spacing-1);
		pointer-events: none;
		z-index: 2;
	}

	.modifiedIndicator {
		font-size: var(--font-size-4);
		font-weight: var(--font-weight-bold);
		color: var(--foreground);
		position: relative;
		top: -4px;
	}

	.dragHandle {
		position: absolute;
		top: 0;
		left: 0;
		width: var(--spacing-7);
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: grab;
		opacity: 0;
		transition: opacity var(--motion-fast) var(--ease-enter);
		z-index: 11;
		color: var(--muted-foreground);
	}

	.progressionItem:hover .dragHandle {
		opacity: 0.6;
	}

	.dragHandle:hover {
		opacity: 1 !important;
		color: var(--foreground);
	}

	.dragHandle:active {
		cursor: grabbing;
	}

	.resizeHandle {
		position: absolute;
		top: 0;
		width: var(--spacing-6);
		height: 100%;
		z-index: 10;
		cursor: col-resize;
		display: flex;
		align-items: center;
		justify-content: center;
		opacity: 0;
		transition: opacity var(--motion-fast) var(--ease-enter);
	}

	.resizeHandleRight {
		right: 0;
	}

	.resizeHandleBar {
		width: 6px;
		height: var(--spacing-6);
		background-color: var(--muted-foreground);
		border-radius: 99px;
		opacity: 0.5;
		transition:
			opacity var(--motion-instant) linear,
			background-color var(--motion-instant) linear;
	}

	.resizeHandle:hover .resizeHandleBar {
		opacity: 1;
		background-color: var(--foreground);
	}

	.progressionItem:hover .resizeHandle {
		opacity: 1;
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

	/* Disable hover effects on every card while one is dragged or resized. */
	:global([data-is-dragging='true']) .progressionItem:not(.isSelected):hover,
	:global([data-is-resizing='true']) .progressionItem:not(.isSelected):hover {
		--chord-tint: 22%;
	}

	:global([data-is-dragging='true']) .progressionItem.isRest:hover,
	:global([data-is-resizing='true']) .progressionItem.isRest:hover {
		background: var(--color-neutral-2);
	}

	:global([data-is-dragging='true']) .progressionItem:hover .dragHandle,
	:global([data-is-resizing='true']) .progressionItem:hover .dragHandle,
	:global([data-is-dragging='true']) .progressionItem:hover .resizeHandle,
	:global([data-is-resizing='true']) .progressionItem:hover .resizeHandle,
	:global([data-is-dragging='true']) .dragHandle:hover,
	:global([data-is-resizing='true']) .dragHandle:hover,
	:global([data-is-dragging='true']) .resizeHandle:hover,
	:global([data-is-resizing='true']) .resizeHandle:hover {
		opacity: 0;
	}

	/* Hide all cursors while dragging or resizing. */
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

	/* The card being dragged or resized still receives pointer events. */
	[data-is-dragging='true'],
	[data-is-resizing='true'] {
		pointer-events: auto;
	}
</style>
