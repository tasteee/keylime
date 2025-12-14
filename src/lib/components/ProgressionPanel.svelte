<script lang="ts">
	import ProgressionChordCard from './ProgressionChordCard.svelte'
	import { progressionStore } from '$lib/stores/progression.svelte'
	import playbackStore from '$lib/stores/playback.svelte'
	import main from '$lib/stores/main.svelte'
	import Icon from '@iconify/svelte'
	import { Button } from '$lib/components/ui/button'
	import { exportPerformanceAsMidi } from '$lib/helpers/midiExport'
	import SelectPatternLength from './SelectPatternLength.svelte'

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

	// Grid layout: 4 beats per bar
	const BEATS_PER_BAR = 4
	const DRAG_THRESHOLD_PIXELS = 24
	const MIN_DURATION_BEATS = 1 // Minimum item duration (1 beat)
	const RESIZE_INCREMENT_BEATS = 0.5 // Snap to 0.5 beats when resizing
	const PIXELS_PER_BEAT = 80 // Fixed width per beat for consistent sizing
	const GAP_BETWEEN_ITEMS = 2 // Gap in pixels between items
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

	// Derived: marker positions accounting for gaps
	const markers = $derived.by(() => {
		const markersList: { beat: number; pixel: number; label: string }[] = []
		let currentBeat = 0
		let currentPixel = 0
		const items = progressionStore.items

		// Iterate through items
		for (let i = 0; i < items.length; i++) {
			const item = items[i]
			const itemDuration = item.durationBeats ?? 0
			const itemWidth = itemDuration * PIXELS_PER_BEAT

			// Find next bar boundary
			let nextBarBeat = Math.ceil(currentBeat / BEATS_PER_BAR) * BEATS_PER_BAR
			if (nextBarBeat < currentBeat) nextBarBeat += BEATS_PER_BAR

			// If currentBeat is exactly a bar start, add it
			if (currentBeat % BEATS_PER_BAR === 0) {
				// Avoid duplicates if we already added this beat (shouldn't happen with this logic but good to be safe)
				if (!markersList.find((m) => m.beat === currentBeat)) {
					markersList.push({
						beat: currentBeat,
						pixel: currentPixel,
						label: `${currentBeat / BEATS_PER_BAR + 1} ${currentBeat / BEATS_PER_BAR === 0 ? 'bar' : 'bars'}`
					})
				}
			}

			// Add markers inside the item
			while (nextBarBeat < currentBeat + itemDuration) {
				if (nextBarBeat > currentBeat) {
					const offset = nextBarBeat - currentBeat
					const pixel = currentPixel + offset * PIXELS_PER_BEAT
					markersList.push({
						beat: nextBarBeat,
						pixel,
						label: `${nextBarBeat / BEATS_PER_BAR + 1} bars`
					})
				}
				nextBarBeat += BEATS_PER_BAR
			}

			currentBeat += itemDuration
			currentPixel += itemWidth
			if (i < items.length - 1) {
				currentPixel += GAP_BETWEEN_ITEMS
			}
		}

		// Fill remaining space
		const maxBeat = MAX_MARKER_BARS * BEATS_PER_BAR
		let nextBarBeat = Math.ceil(currentBeat / BEATS_PER_BAR) * BEATS_PER_BAR
		if (nextBarBeat < currentBeat) nextBarBeat += BEATS_PER_BAR

		// If we ended exactly on a bar, add it
		if (currentBeat % BEATS_PER_BAR === 0 && currentBeat <= maxBeat) {
			if (!markersList.find((m) => m.beat === currentBeat)) {
				markersList.push({
					beat: currentBeat,
					pixel: currentPixel,
					label: `${currentBeat / BEATS_PER_BAR + 1} ${currentBeat / BEATS_PER_BAR === 0 ? 'bar' : 'bars'}`
				})
			}
		}

		while (nextBarBeat <= maxBeat) {
			if (nextBarBeat > currentBeat) {
				const offset = nextBarBeat - currentBeat
				const pixel = currentPixel + offset * PIXELS_PER_BEAT
				markersList.push({
					beat: nextBarBeat,
					pixel,
					label: `${nextBarBeat / BEATS_PER_BAR + 1} bars`
				})
			}
			nextBarBeat += BEATS_PER_BAR
		}

		return markersList
	})

	// Derived: currently selected item
	const selectedItem = $derived.by(() => {
		if (!progressionStore.selectedItemId) return null
		return progressionStore.getItem(progressionStore.selectedItemId)
	})

	const adjustDuration = (delta: number) => {
		if (!selectedItem) return
		const newDuration = Math.max(MIN_DURATION_BEATS, selectedItem.durationBeats + delta)
		progressionStore.updateItem({
			id: selectedItem.id,
			durationBeats: newDuration
		})
	}

	const moveItem = (direction: number) => {
		if (!selectedItem) return
		const currentIndex = progressionStore.items.findIndex((i) => i.id === selectedItem.id)
		if (currentIndex === -1) return

		const newIndex = currentIndex + direction
		if (newIndex < 0 || newIndex >= progressionStore.items.length) return

		progressionStore.reorderItem({
			itemId: selectedItem.id,
			newIndex
		})
	}

	const handleDelete = () => {
		progressionStore.deleteSelectedItem()
	}

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

<div class="ProgressionPanel">
	<div class="top">
		<div class="gap-3 flex items-center">
			<p>Progression</p>
			<span
				class="font-bold text-muted-foreground tracking-wider bg-secondary px-2 py-1 border-border/50 rounded-full border text-[10px] uppercase"
			>
				{totalBars}
				{totalBars === 1 ? 'BAR' : 'BARS'}
			</span>

			<div class="gap-1 ml-2 flex items-center">
				<Button
					variant="ghost"
					size="icon"
					onclick={togglePlayback}
					class="playButton h-7 w-7 rounded-sm hover:bg-background/80"
				>
					{#if playbackStore.isPlaying}
						<Icon icon="mingcute:stop-fill" class="size-4 text-primary" />
					{:else}
						<Icon icon="mingcute:play-fill" class="size-4 text-primary" />
					{/if}
				</Button>
				<Button
					variant="ghost"
					size="icon"
					onclick={handleDownloadMidi}
					class="downloadButton h-7 w-7 rounded-sm hover:bg-background/80"
				>
					<Icon icon="mingcute:download-2-fill" class="size-4 text-muted-foreground" />
				</Button>
			</div>
		</div>

		<div class="flex-1"></div>

		<div class="gap-3 flex items-center">
			{#if selectedItem}
				<div class="controls-group">
					<div class="px-3 border-border/50 flex items-center border-r">
						<span class="text-xs font-medium text-foreground/80 whitespace-nowrap">
							{selectedItem.durationBeats / BEATS_PER_BAR}
							{selectedItem.durationBeats / BEATS_PER_BAR === 1 ? 'bar' : 'bars'}
						</span>
					</div>

					<Button
						variant="ghost"
						size="icon"
						class="h-8 w-8 rounded-sm hover:bg-background/80"
						onclick={() => adjustDuration(-1)}
						title="Decrease duration"
					>
						<Icon icon="mingcute:minimize-line" class="size-4" />
					</Button>
					<Button
						variant="ghost"
						size="icon"
						class="h-8 w-8 rounded-sm hover:bg-background/80"
						onclick={() => adjustDuration(1)}
						title="Increase duration"
					>
						<Icon icon="mingcute:add-line" class="size-4" />
					</Button>

					<div class="divider"></div>

					<Button
						variant="ghost"
						size="icon"
						class="h-8 w-8 rounded-sm hover:bg-background/80"
						onclick={() => moveItem(-1)}
						title="Move left"
					>
						<Icon icon="mingcute:arrow-left-line" class="size-4" />
					</Button>
					<Button
						variant="ghost"
						size="icon"
						class="h-8 w-8 rounded-sm hover:bg-background/80"
						onclick={() => moveItem(1)}
						title="Move right"
					>
						<Icon icon="mingcute:arrow-right-line" class="size-4" />
					</Button>

					<div class="divider"></div>

					<Button
						variant="ghost"
						size="icon"
						class="h-8 w-8 rounded-sm text-destructive hover:text-destructive hover:bg-destructive/10"
						onclick={handleDelete}
						title="Delete"
					>
						<Icon icon="mingcute:delete-2-line" class="size-4" />
					</Button>
				</div>
			{/if}

			<div class="controls-group">
				<SelectPatternLength />
			</div>

			<div class="controls-group">
				<Button variant="ghost" size="sm" class="h-8 px-3 rounded-sm hover:bg-background/80" onclick={handleAddRest}>
					<Icon icon="mingcute:time-fill" class="size-4 mr-2 text-muted-foreground" />
					Rest
				</Button>
			</div>
		</div>
	</div>

	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div class="middle" bind:this={middleElement} onclick={handleMiddleClick} onwheel={handleWheel}>
		<div class="itemArea" bind:this={itemAreaElement} style="width: {itemAreaWidth}px;">
			{#each markers as marker}
				<div class="barMarker" style="left: {marker.pixel}px;">
					<div class="barMarkerLine"></div>
					<span class="barMarkerText">{marker.label}</span>
					<!-- Render 3 beat lines within this bar (the 4th is the first line of next bar) -->
					{#each [1, 2, 3] as beatOffset}
						<div class="beatLine" style="left: {beatOffset * PIXELS_PER_BEAT}px;"></div>
					{/each}
				</div>
			{/each}
			{#each progressionStore.items as item, index (item.id)}
				<ProgressionChordCard
					{item}
					{index}
					pixelsPerBeat={PIXELS_PER_BEAT}
					gapSize={GAP_BETWEEN_ITEMS}
					isDragging={draggedItemId === item.id}
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

<style>
	.ProgressionPanel {
		position: fixed;
		bottom: var(--bottombar-height);
		left: 0;
		width: 100%;
		height: var(--progression-height);
		padding: 16px 32px;
		display: flex;
		flex-direction: column;
		background-color: var(--background);
		border-top: var(--border-thick);
		box-shadow: 0 -4px 0px var(--color-ink);
		z-index: 50;
	}

	.top {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 24px;
		padding-bottom: 16px;
		height: 56px;
	}

	.top p {
		margin: 0;
		font-weight: 700;
		font-size: 16px;
		color: var(--foreground);
		letter-spacing: -0.02em;
		font-family: var(--font-display);
	}

	.controls-group {
		display: flex;
		align-items: center;
		gap: 6px;
		background-color: var(--color-paper);
		padding: 4px;
		border-radius: 0px;
		border: var(--border-thick);
		box-shadow: var(--shadow-hard);
	}

	.divider {
		width: 3px;
		height: 20px;
		background-color: var(--color-ink);
		margin: 0 8px;
		opacity: 1;
	}

	.middle {
		flex: 1;
		border-radius: 0px;
		background-color: var(--timeline-bg);
		border: var(--border-thick);
		position: relative;
		display: flex;
		flex-direction: column;
		overflow-x: auto;
		overflow-y: hidden;
		box-shadow: inset 4px 4px 0px rgba(0, 0, 0, 0.1);
	}

	.itemArea {
		position: relative;
		flex: 1;
		min-width: 100%;
		overflow: hidden;
		/* Add a subtle grid pattern */
		background-image: linear-gradient(to right, var(--timeline-grid) 1px, transparent 1px);
		background-size: 80px 100%; /* Matches PIXELS_PER_BEAT */
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
		box-shadow: var(--shadow-hard);
		opacity: 0.95;
		font-family: var(--font-display);
	}

	.ghostItemText {
		white-space: nowrap;
	}

	.barMarker {
		position: absolute;
		top: 0;
		z-index: 10;
		display: flex;
		flex-direction: row;
		align-items: flex-start;
		pointer-events: none;
		height: 100%;
	}

	.barMarkerLine {
		width: 2px;
		height: 100%;
		background-color: var(--color-ink);
		opacity: 0.5;
	}

	.beatLine {
		position: absolute;
		top: 0;
		width: 1px;
		height: 100%;
		background-color: var(--color-ink);
		opacity: 0.2;
	}

	.barMarkerText {
		font-size: 11px;
		font-weight: 600;
		color: var(--color-ink);
		margin-left: 8px;
		margin-top: 8px;
		white-space: nowrap;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		font-family: var(--font-mono);
	}
</style>
