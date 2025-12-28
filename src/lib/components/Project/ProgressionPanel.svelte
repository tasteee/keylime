<script lang="ts">
	import ProgressionChordCard from './ProgressionChordCard.svelte'
	import ProgressionSelectionControls from './ProgressionSelectionControls.svelte'
	import ProgressionTimingMarkers from './ProgressionTimingMarkers.svelte'
	import projectStore from '$lib/stores/project.svelte'
	import playbackStore from '$lib/stores/playback.svelte'
	import Icon from '@iconify/svelte'
	import { exportPerformanceAsMidi, exportChordsAsMidi } from '$lib/helpers/midiExport'
	import { toFractionString } from '$lib/helpers/numbers'
	import { DownloadSimple, Plus, MagnifyingGlassPlus, MagnifyingGlassMinus } from 'phosphor-svelte'
	import { Button } from '../ui/button'
	import BottomBar from './BottomBar.svelte'
	import Divider from '../ui/divider.svelte'
	import Box from '$lib/components/ui/box.svelte'
	import mainStore from '$lib/stores/main.svelte'
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu'

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
	let isDownloadPopoverOpen = $state(false)

	let cursorElement: HTMLElement | null = $state(null)
	let animationFrameId: number
	let isFollowEnabled = $state(true)
	let previousLoopedBeat = $state(0)
	let previousItemCount = $state(0)

	$effect(() => {
		const currentItemCount = projectStore.progressionItems.length
		const hasItemsAdded = currentItemCount > previousItemCount

		if (hasItemsAdded && middleElement) {
			const selectedItemId = projectStore.selectedProgressionItemId
			const items = projectStore.progressionItems

			let targetItemIndex = items.length - 1

			if (selectedItemId) {
				const selectedIndex = items.findIndex((item) => item.id === selectedItemId)
				if (selectedIndex !== -1 && selectedIndex < items.length - 1) {
					targetItemIndex = selectedIndex + 1
				}
			}

			let accumulatedBeats = 0
			for (let i = 0; i < targetItemIndex; i++) {
				accumulatedBeats += items[i].durationBeats
			}

			const targetItem = items[targetItemIndex]
			const itemStartPosition = accumulatedBeats * PIXELS_PER_BEAT
			const itemWidth = targetItem.durationBeats * PIXELS_PER_BEAT
			const itemEndPosition = itemStartPosition + itemWidth

			const scrollLeft = middleElement.scrollLeft
			const viewportWidth = middleElement.clientWidth
			const viewportEnd = scrollLeft + viewportWidth

			const margin = 100

			const isItemBeforeViewport = itemStartPosition < scrollLeft + margin
			const isItemAfterViewport = itemEndPosition > viewportEnd - margin

			if (isItemBeforeViewport) {
				middleElement.scrollLeft = Math.max(0, itemStartPosition - margin)
			} else if (isItemAfterViewport) {
				middleElement.scrollLeft = itemEndPosition - viewportWidth + margin
			}
		}

		previousItemCount = currentItemCount
	})

	const updateCursor = () => {
		if (!playbackStore.isPlaying || !cursorElement) return

		const now = performance.now()
		const elapsedMs = now - playbackStore.loopStartTime
		const bpm = projectStore.bpm
		const msPerBeat = 60000 / bpm
		const currentBeat = elapsedMs / msPerBeat

		const totalDurationBeats = projectStore.getProgressionTotalDuration()
		if (totalDurationBeats === 0) return

		const loopedBeat = currentBeat % totalDurationBeats
		const x = loopedBeat * PIXELS_PER_BEAT
		cursorElement.style.transform = `translateX(${x}px)`

		if (isFollowEnabled && middleElement) {
			const scrollLeft = middleElement.scrollLeft
			const containerWidth = middleElement.clientWidth
			const scrollRight = scrollLeft + containerWidth
			const cursorPosition = x
			const marginRight = 100

			const hasLoopedBack = loopedBeat < previousLoopedBeat
			const isCursorBeforeViewport = cursorPosition < scrollLeft

			if (hasLoopedBack && isCursorBeforeViewport) {
				middleElement.scrollLeft = 0
			} else if (cursorPosition > scrollRight - marginRight) {
				middleElement.scrollLeft = cursorPosition - containerWidth + marginRight
			}
		}

		previousLoopedBeat = loopedBeat
		animationFrameId = requestAnimationFrame(updateCursor)
	}

	$effect(() => {
		if (playbackStore.isPlaying) {
			animationFrameId = requestAnimationFrame(updateCursor)
		} else {
			cancelAnimationFrame(animationFrameId)
		}
		return () => cancelAnimationFrame(animationFrameId)
	})

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
	const GAP_BETWEEN_ITEMS = 1 // Gap in pixels between items
	const MAX_MARKER_BARS = 64 // Render markers up to this many bars

	// Derived: PIXELS_PER_BEAT from store
	const PIXELS_PER_BEAT = $derived(projectStore.progressionZoomLevel)

	// Derived: total duration is sum of all item durations
	const totalBeats = $derived.by(() => {
		return projectStore.getProgressionTotalDuration()
	})

	// Derived: item area width in pixels (including gaps)
	const itemAreaWidth = $derived.by(() => {
		const numItems = projectStore.progressionItems.length
		const totalGaps = numItems > 0 ? (numItems - 1) * GAP_BETWEEN_ITEMS : 0
		return totalBeats * PIXELS_PER_BEAT + totalGaps
	})

	// Derived: ghost item data when dragging
	const ghostItem = $derived.by(() => {
		if (!isDraggingItem || !draggedItemId) return null
		const item = projectStore.progressionItems.find((i) => i.id === draggedItemId)
		if (!item) return null
		return item
	})

	// Derived: total duration in bars
	const totalBars = $derived.by(() => {
		const beats = projectStore.getProgressionTotalDuration()
		return Math.round((beats / BEATS_PER_BAR) * 1000) / 1000
	})

	const handleKeyDown = (event: KeyboardEvent) => {
		// If an input is focused, dont handle keydown for progression items.
		if (mainStore.isInputFocused) return
		const isDeleteKey = event.key === 'Delete' || event.key === 'Backspace'
		if (isDeleteKey) return projectStore.deleteSelectedProgressionItem()
		const isDuplicateKey = (event.ctrlKey || event.metaKey) && event.key === 'd'

		if (isDuplicateKey) {
			event.preventDefault()
			projectStore.duplicateSelectedProgressionItem()
		}
	}

	const handleItemClick = (event: MouseEvent) => {
		const target = event.target as HTMLElement
		const itemElement = target.closest('.progressionItem') as HTMLElement
		const itemId = itemElement?.dataset.itemId
		event.stopPropagation()
		projectStore.selectProgressionItem(itemId || null)
	}

	const handleItemMouseDown = (event: MouseEvent) => {
		if (isResizingItem) return

		const target = event.target as HTMLElement
		const itemElement = target.closest('.progressionItem') as HTMLElement
		if (!itemElement) return console.log('No item element found')

		const itemId = itemElement.dataset.itemId
		if (!itemId) return console.log('No itemId found on item element')

		const itemIndex = projectStore.progressionItems.findIndex((i) => i.id === itemId)
		if (itemIndex === -1) return

		console.log('Drag started for item:', itemId, 'at index:', itemIndex)

		isMouseDownOnItem = true
		draggedItemId = itemId
		dragStartX = event.clientX
		dragStartIndex = itemIndex
		projectStore.selectProgressionItem(itemId)

		event.stopPropagation()
		event.preventDefault()
	}

	const handleResizeMouseDown = (event: MouseEvent) => {
		const target = event.target as HTMLElement
		const itemElement = target.closest('.progressionItem') as HTMLElement
		const itemId = itemElement?.dataset.itemId
		if (!itemId) return

		const item = projectStore.getProgressionItem(itemId)
		if (!item) return

		isResizingItem = true
		resizingItemId = itemId
		resizeStartX = event.clientX
		resizeStartDuration = item.durationBeats ?? 0
		projectStore.selectProgressionItem(itemId)

		event.stopPropagation()
		event.preventDefault()
	}

	const handleMouseMove = (event: MouseEvent) => {
		if (!itemAreaElement) return

		if (isResizingItem && resizingItemId) {
			const item = projectStore.getProgressionItem(resizingItemId)
			if (!item) return

			const deltaX = event.clientX - resizeStartX
			const deltaBeats = Math.round(deltaX / PIXELS_PER_BEAT / RESIZE_INCREMENT_BEATS) * RESIZE_INCREMENT_BEATS
			const newDuration = Math.max(MIN_DURATION_BEATS, resizeStartDuration + deltaBeats)

			projectStore.updateProgressionItem({
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
		const items = projectStore.progressionItems
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
			projectStore.reorderProgressionItem({ itemId: draggedItemId, newIndex })
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
		projectStore.addProgressionRest()
	}

	const handleMiddleClick = (event: MouseEvent) => {
		event.stopPropagation()
	}

	const handleWheel = (event: WheelEvent) => {
		if (!middleElement) return
		event.preventDefault()
		middleElement.scrollLeft += event.deltaY
	}

	const togglePlayback = async () => {
		const isCurrentlyPlaying = playbackStore.isPlaying
		if (isCurrentlyPlaying) {
			playbackStore.stop()
			return
		}

		await playbackStore.perform({
			id: projectStore.id,
			bpm: projectStore.bpm,
			octave: projectStore.octave,
			progressionChords: projectStore.progressionChords,
			patternSignals: projectStore.patternActiveSignals,
			patternSignalRows: projectStore.patternSignalRows,
			patternDurationBars: projectStore.patternActiveDurationBeats / 4
		})
	}

	const handleDownloadMidi = () => {
		const project = projectStore.getProjectDocumentData()
		// Use derived progressionChords with calculated startTimes
		const projectWithStartTimes = {
			...project,
			progressionChords: projectStore.progressionChords
		}
		exportPerformanceAsMidi(projectWithStartTimes)
		isDownloadPopoverOpen = false
	}

	const handleDownloadChords = () => {
		const project = projectStore.getProjectDocumentData()
		// Use derived progressionChords with calculated startTimes
		const projectWithStartTimes = {
			...project,
			progressionChords: projectStore.progressionChords
		}
		exportChordsAsMidi(projectWithStartTimes)
		isDownloadPopoverOpen = false
	}

	const toggleFollow = () => {
		isFollowEnabled = !isFollowEnabled
	}

	const zoomIn = () => {
		const MIN_PIXELS_PER_BEAT = 40
		const MAX_PIXELS_PER_BEAT = 160
		const ZOOM_INCREMENT = 12
		const newValue = Math.min(MAX_PIXELS_PER_BEAT, projectStore.progressionZoomLevel + ZOOM_INCREMENT)
		projectStore.progressionZoomLevel = newValue
		projectStore.markDirty()
	}

	const zoomOut = () => {
		const MIN_PIXELS_PER_BEAT = 40
		const MAX_PIXELS_PER_BEAT = 160
		const ZOOM_INCREMENT = 12
		const newValue = Math.max(MIN_PIXELS_PER_BEAT, projectStore.progressionZoomLevel - ZOOM_INCREMENT)
		projectStore.progressionZoomLevel = newValue
		projectStore.markDirty()
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
		<Divider margin="24px" />

		<Box gap="16px" align="center">
			<DropdownMenu.Root bind:open={isDownloadPopoverOpen}>
				<DropdownMenu.Trigger>
					<Button size="small">
						<DownloadSimple size={16} weight="bold" />
						<span>Download</span>
					</Button>
				</DropdownMenu.Trigger>
				<DropdownMenu.Content class="w-48">
					<DropdownMenu.Item onclick={handleDownloadChords}>
						<span>Chords</span>
					</DropdownMenu.Item>
					<DropdownMenu.Item onclick={handleDownloadMidi}>
						<span>Performance</span>
					</DropdownMenu.Item>
				</DropdownMenu.Content>
			</DropdownMenu.Root>

			<Button size="small" onclick={handleAddRest}>
				<Plus size={16} weight="bold" />
				<span>Add Rest</span>
			</Button>

			<Button
				size="small"
				onclick={toggleFollow}
				kind={isFollowEnabled ? 'outline' : 'solid'}
				color={isFollowEnabled ? 'brand' : 'neutral'}
			>
				<Icon icon="mingcute:arrow-right-line" width="16px" height="16px" />
				<span>Follow</span>
			</Button>
		</Box>

		<Divider margin="24px" />

		<Box gap="8px" align="center">
			<Button size="small" isIcon={true} onclick={zoomOut}>
				<MagnifyingGlassMinus size={16} weight="bold" />
			</Button>
			<Button size="small" isIcon={true} onclick={zoomIn}>
				<MagnifyingGlassPlus size={16} weight="bold" />
			</Button>
		</Box>

		<Divider margin="24px" />

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
				{#if playbackStore.isPlaying}
					<div class="playbackCursor" bind:this={cursorElement}></div>
				{/if}
				{#each projectStore.progressionItems as item, index (item.id)}
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
	}

	.ghostItemText {
		white-space: nowrap;
	}

	.playbackCursor {
		position: absolute;
		top: 0;
		bottom: 0;
		width: 1px;
		background-color: var(--n-09);
		z-index: 100;
		pointer-events: none;
		will-change: transform;
	}

	.progressionBarCount {
		position: relative;
		top: -5px;
	}
</style>
