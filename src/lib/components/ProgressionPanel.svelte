<script lang="ts">
	import ProgressionChordCard from './ProgressionChordCard.svelte'
	import ProgressionSelectionControls from './ProgressionSelectionControls.svelte'
	import ProgressionTimingMarkers from './ProgressionTimingMarkers.svelte'
	import { progressionStore } from '$lib/stores/progression.svelte'
	import playbackStore from '$lib/stores/playback.svelte'
	import main from '$lib/stores/main.svelte'
	import Icon from '@iconify/svelte'
	import { exportPerformanceAsMidi } from '$lib/helpers/midiExport'
	import { toFractionString } from '$lib/helpers/numbers'
	import { DownloadSimple, Plus } from 'phosphor-svelte'
	import { Button } from './ui/button'
	import BottomBar from './BottomBar.svelte'
	import ShaDivider from './ShaDivider.svelte'
	import Box from './Box.svelte'

	let isDraggingItem = $state(false)
	let draggedItemId: string | null = $state(null)
	let dragStartX = $state(0)
	let dragStartIndex = $state(0)
	let isMouseDownOnItem = $state(false)
	let isResizingItem = $state(false)
	let resizingItemId: string | null = $state(null)
	let resizeStartX = $state(0)
	let resizeStartDuration = $state(0)
	let middleElement: HTMLElement | null = $state(null)
	let itemAreaElement: HTMLElement | null = $state(null)
	let ghostItemMouseX = $state(0)
	let ghostItemMouseY = $state(0)

	$effect(() => {
		console.log('isDraggingItem:', isDraggingItem, 'draggedItemId:', draggedItemId)
		if (isResizingItem) document.body.style.cursor = 'none !important'
		// else if (isDraggingItem) document.body.style.cursor = 'grabbing'
		else document.body.style.cursor = 'default'
	})

	// Grid layout: 4 beats per bar
	const BEATS_PER_BAR = 4
	const DRAG_THRESHOLD_PIXELS = 24
	const MIN_DURATION_BEATS = 1 // Minimum item duration (1 beat)
	const RESIZE_INCREMENT_BEATS = 0.5 // Snap to 0.5 beats when resizing
	const PIXELS_PER_BEAT = 82 // Fixed width per beat for consistent sizing
	const GAP_BETWEEN_ITEMS = 1 // Gap in pixels between items
	const MAX_MARKER_BARS = 64 // Render markers up to this many bars

	// Derived: total duration is sum of all item durations
	const totalBeats = $derived.by(() => {
		return progressionStore.getTotalDuration()
	})

	// Derived: item area width in pixels (including gaps)
	const itemAreaWidth = $derived.by(() => {
		const numItems = progressionStore.items.length
		const totalGaps = numItems > 0 ? (numItems - 1) * GAP_BETWEEN_ITEMS : 0
		return totalBeats * PIXELS_PER_BEAT + totalGaps
	})

	// Derived: ghost item data when dragging
	const ghostItem = $derived.by(() => {
		if (!isDraggingItem || !draggedItemId) return null
		const item = progressionStore.items.find((i) => i.id === draggedItemId)
		if (!item) return null
		return item
	})

	// Derived: total duration in bars
	const totalBars = $derived.by(() => {
		const beats = progressionStore.getTotalDuration()
		return Math.round((beats / BEATS_PER_BAR) * 1000) / 1000
	})

	const handleKeyDown = (event: KeyboardEvent) => {
		const isDeleteKey = event.key === 'Delete' || event.key === 'Backspace'
		if (isDeleteKey) return progressionStore.deleteSelectedItem()
		const isDuplicateKey = (event.ctrlKey || event.metaKey) && event.key === 'd'

		if (isDuplicateKey) {
			event.preventDefault()
			progressionStore.duplicateSelectedItem()
		}
	}

	const handleItemClick = (event: MouseEvent) => {
		const target = event.target as HTMLElement
		const itemElement = target.closest('.progressionItem') as HTMLElement
		const itemId = itemElement?.dataset.itemId
		event.stopPropagation()
		progressionStore.selectItem(itemId || null)
	}

	const handleItemMouseDown = (event: MouseEvent) => {
		if (isResizingItem) return

		const target = event.target as HTMLElement
		const itemElement = target.closest('.progressionItem') as HTMLElement
		if (!itemElement) return console.log('No item element found')

		const itemId = itemElement.dataset.itemId
		if (!itemId) return console.log('No itemId found on item element')

		const itemIndex = progressionStore.items.findIndex((i) => i.id === itemId)
		if (itemIndex === -1) return

		console.log('Drag started for item:', itemId, 'at index:', itemIndex)

		isMouseDownOnItem = true
		draggedItemId = itemId
		dragStartX = event.clientX
		dragStartIndex = itemIndex
		progressionStore.selectItem(itemId)

		event.stopPropagation()
		event.preventDefault()
	}

	const handleResizeMouseDown = (event: MouseEvent) => {
		const target = event.target as HTMLElement
		const itemElement = target.closest('.progressionItem') as HTMLElement
		const itemId = itemElement?.dataset.itemId
		if (!itemId) return

		const item = progressionStore.getItem(itemId)
		if (!item) return

		isResizingItem = true
		resizingItemId = itemId
		resizeStartX = event.clientX
		resizeStartDuration = item.durationBeats ?? 0
		progressionStore.selectItem(itemId)

		event.stopPropagation()
		event.preventDefault()
	}

	const handleMouseMove = (event: MouseEvent) => {
		if (!itemAreaElement) return

		if (isResizingItem && resizingItemId) {
			const item = progressionStore.getItem(resizingItemId)
			if (!item) return

			const deltaX = event.clientX - resizeStartX
			const deltaBeats = Math.round(deltaX / PIXELS_PER_BEAT / RESIZE_INCREMENT_BEATS) * RESIZE_INCREMENT_BEATS
			const newDuration = Math.max(MIN_DURATION_BEATS, resizeStartDuration + deltaBeats)

			progressionStore.updateItem({
				id: resizingItemId,
				durationBeats: newDuration
			})
			return
		}

		// Check if mouse has moved beyond threshold to start dragging
		if (isMouseDownOnItem && !isDraggingItem && draggedItemId) {
			const deltaX = Math.abs(event.clientX - dragStartX)
			if (deltaX >= DRAG_THRESHOLD_PIXELS) {
				isDraggingItem = true
				console.log('Drag threshold reached, isDraggingItem:', isDraggingItem)
			}
		}

		// Update ghost item position
		if (isDraggingItem) {
			ghostItemMouseX = event.clientX
			ghostItemMouseY = event.clientY
		}

		if (!isDraggingItem || !draggedItemId || !itemAreaElement) return

		console.log('Dragging item:', draggedItemId)

		// Calculate which item position we're hovering over
		const items = progressionStore.items
		const rect = itemAreaElement.getBoundingClientRect()
		const mouseX = event.clientX - rect.left
		const mousePositionBeats = mouseX / PIXELS_PER_BEAT

		// Find the index where the dragged item should be inserted
		let newIndex = 0
		let accumulatedBeats = 0

		for (let i = 0; i < items.length; i++) {
			const item = items[i]
			if (item.id === draggedItemId) continue // Skip the dragged item

			const itemMidpoint = accumulatedBeats + item.durationBeats / 2
			if (mousePositionBeats < itemMidpoint) break

			newIndex++
			accumulatedBeats += item.durationBeats
		}

		console.log('Calculated newIndex:', newIndex, 'dragStartIndex:', dragStartIndex)

		// Reorder the item if needed
		if (newIndex !== dragStartIndex) {
			console.log('Reordering item from', dragStartIndex, 'to', newIndex)
			progressionStore.reorderItem({ itemId: draggedItemId, newIndex })
			dragStartIndex = newIndex
		}
	}

	const handleMouseUp = () => {
		// Timeout prevents click from firing after drag
		setTimeout(() => {
			isDraggingItem = false
			isMouseDownOnItem = false
			draggedItemId = null
			isResizingItem = false
			resizingItemId = null
		}, 100)
	}

	const handleAddRest = () => {
		progressionStore.addRest()
	}

	const handleMiddleClick = (event: MouseEvent) => {
		event.stopPropagation()
	}

	const handleWheel = (event: WheelEvent) => {
		if (!middleElement) return
		event.preventDefault()
		middleElement.scrollLeft += event.deltaY
	}

	const togglePlayback = () => {
		playbackStore.togglePlayback()
	}

	const handleDownloadMidi = () => {
		exportPerformanceAsMidi({
			performance: playbackStore.performance,
			bpm: main.bpm,
			key: main.selectedKey,
			scale: main.selectedScale
		})
	}
</script>

<svelte:window onkeydown={handleKeyDown} onmousemove={handleMouseMove} onmouseup={handleMouseUp} />

<div class="progressionPanelContainer">
	<!-- Toolbar -->
	<div class="progressionToolbar">
		<Box gap="16px" align="center">
			<Button onclick={togglePlayback} size="large" color="neutral" isIcon={true}>
				{#if playbackStore.isPlaying}
					<Icon icon="mingcute:stop-fill" width="20px" height="20px" />
				{:else}
					<Icon icon="mingcute:play-fill" width="20px" height="20px" />
				{/if}
			</Button>

			<div class="titleSection">
				<span class="herPanelTitle">Progression</span>
				<span class="progressionBarCount text-xs font-medium text-foreground/80 whitespace-nowrap uppercase">
					{toFractionString(totalBars)}
					{totalBars === 1 ? 'BAR' : 'BARS'}
				</span>
			</div>
		</Box>
		<ShaDivider margin="24px" />

		<Box gap="16px" align="center">
			<Button size="small" onclick={handleDownloadMidi}>
				<DownloadSimple size={16} weight="bold" />
				<span>Download</span>
			</Button>

			<Button size="small" onclick={handleAddRest}>
				<Plus size={16} weight="bold" />
				<span>Add Rest</span>
			</Button>
		</Box>

		<ShaDivider margin="24px" />

		<ProgressionSelectionControls />
	</div>

	<!-- Main Progression Area -->
	<div class="mainProgressionPanel" data-is-dragging={isDraggingItem || isResizingItem} data-is-resizing={isResizingItem}>
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div class="middle" bind:this={middleElement} onclick={handleMiddleClick} onwheel={handleWheel}>
			<div class="itemArea" bind:this={itemAreaElement} style="width: {itemAreaWidth}px;">
				<ProgressionTimingMarkers
					pixelsPerBeat={PIXELS_PER_BEAT}
					beatsPerBar={BEATS_PER_BAR}
					maxMarkerBars={MAX_MARKER_BARS}
				/>
				{#each progressionStore.items as item, index (item.id)}
					<ProgressionChordCard
						{item}
						{index}
						pixelsPerBeat={PIXELS_PER_BEAT}
						isDragging={isDraggingItem && draggedItemId === item?.id}
						isResizing={isResizingItem && resizingItemId === item?.id}
						selectItem={handleItemClick}
						onItemMouseDown={handleItemMouseDown}
						onResizeMouseDown={handleResizeMouseDown}
					/>
				{/each}
			</div>
		</div>

		{#if ghostItem && isDraggingItem}
			<div
				class="ghostItem"
				style="
					left: {ghostItemMouseX}px;
					top: {ghostItemMouseY}px;
				"
			>
				<span class="ghostItemText">
					{#if ghostItem.type === 'rest'}
						REST
					{:else}
						{ghostItem.symbol}
					{/if}
				</span>
			</div>
		{/if}
	</div>

	<BottomBar />
</div>

<style>
	.progressionPanelContainer {
		width: 100vw;
		position: relative;
		left: 50%;
		right: 50%;
		margin-left: -50vw;
		margin-right: -50vw;
		display: flex;
		flex-direction: column;
	}

	.progressionToolbar {
		display: flex;
		flex-direction: row;
		align-items: center;
		/* gap: 16px; */
		padding: 0px 24px;
		height: 54px;
		background-color: var(--color-panel-bg);
		border-bottom: 1px solid var(--n-03);
		border-top: 1px solid var(--n-03);
	}

	.titleSection {
		display: flex;
		flex-direction: column;
	}

	.mainProgressionPanel {
		width: 100%;
		height: 115px;
		flex-shrink: 0;
		display: flex;
		flex-direction: column;
		z-index: 50;
	}

	.middle {
		flex: 1;
		border-radius: 0px;
		background-color: var(--n-00);
		position: relative;
		display: flex;
		flex-direction: column;
		overflow-x: auto;
		overflow-y: hidden;
		max-height: 115px;
		overflow-y: hidden;
		/* box-shadow: rgba(0, 0, 0, 0.1) 0px 4px 12px; */
	}

	.itemArea {
		position: relative;
		flex: 1;
		min-width: 100%;
		overflow: hidden;
		/* Add a subtle grid pattern */
		/* background-image: linear-gradient(to right, var(--timeline-grid) 1px, transparent 1px); */
		/* background-size: 82px 100%; */
		/* Matches PIXELS_PER_BEAT */
		display: flex;
		flex-direction: row;
		align-items: flex-start;
		padding-top: 24px;
		left: -2px;
	}

	.ghostItem {
		position: fixed;
		transform: translate(-50%, -50%) rotate(5deg);
		pointer-events: none;
		z-index: 1000;
		background: var(--popover);
		color: var(--popover-foreground);
		border: var(--border-thick);
		border-radius: 0px;
		padding: 8px 16px;
		font-size: 14px;
		font-weight: 600;
		opacity: 0.95;
		font-family: var(--font-display);
	}

	.ghostItemText {
		white-space: nowrap;
	}

	.progressionBarCount {
		position: relative;
		top: -5px;
	}
</style>
