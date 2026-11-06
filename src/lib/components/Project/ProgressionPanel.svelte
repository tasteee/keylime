<script lang="ts">
	import ProgressionChordCard from './ProgressionChordCard.svelte'
	import ProgressionSelectionControls from './ProgressionSelectionControls.svelte'
	import ProgressionTimingMarkers from './ProgressionTimingMarkers.svelte'
	import { exportPerformanceAsMidi, exportChordsAsMidi } from '$lib/helpers/midiExport'
	import { toFractionString } from '$lib/helpers/numbers'
	import {
		DownloadSimple,
		Plus,
		MagnifyingGlassPlus,
		MagnifyingGlassMinus,
		Play,
		Stop,
		ArrowRight
	} from 'phosphor-svelte'
	import { isTypingInTextField } from '$lib/helpers/typing'
	import { getContext } from 'svelte'
	import GENERAL_CONFIG from '$lib/constants/general.json'

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

	const MIN_PIXELS_PER_BEAT = GENERAL_CONFIG.MIN_PROGRESSION_PIXELS_PER_BEAT
	const MAX_PIXELS_PER_BEAT = GENERAL_CONFIG.MAX_PROGRESSION_PIXELS_PER_BEAT
	const ZOOM_INCREMENT = GENERAL_CONFIG.PROGRESSION_ZOOM_INCREMENT

	const context = getContext<ProjectEditorContextT>('projectEditor')
	const playbackContext = getContext<PlaybackContextT>('playback')

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

	let cursorElement: HTMLElement | null = $state(null)
	let animationFrameId: number
	let isFollowEnabled = $state(true)
	let previousLoopedBeat = $state(0)
	let previousItemCount = $state(0)

	// Derive progressionItems with calculated startTime from context progressionChords
	const progressionItems = $derived.by(() => {
		let accumulatedStartTime = 0
		return context.state.project.progressionChords.map((item) => {
			const startTime = accumulatedStartTime
			accumulatedStartTime += item.durationBeats
			return { ...item, startTime } as ProgressionItemT
		})
	})

	// Derive total duration
	const getProgressionTotalDuration = (): number => {
		if (!context.state.project.progressionChords.length) return 0
		return context.state.project.progressionChords.reduce((total, item) => total + item.durationBeats, 0)
	}

	// Derive active pattern signals
	const patternActiveDurationBeats = $derived(context.state.project.patternDurationBars * 4)
	const patternActiveSignals = $derived.by(() => {
		return context.state.project.patternSignals.filter((signal) => {
			return signal.startTime < patternActiveDurationBeats
		})
	})

	$effect(() => {
		const currentItemCount = progressionItems.length
		const hasItemsAdded = currentItemCount > previousItemCount

		if (hasItemsAdded && middleElement) {
			const selectedItemId = context.state.selectedProgressionItemId
			const items = progressionItems

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
		if (!playbackContext.state.isPlaying || !cursorElement) return

		const now = performance.now()
		const elapsedMs = now - playbackContext.state.loopStartTime
		const bpm = context.state.project.bpm
		const msPerBeat = 60000 / bpm
		const currentBeat = elapsedMs / msPerBeat

		const totalDurationBeats = getProgressionTotalDuration()
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
		if (playbackContext.state.isPlaying) {
			animationFrameId = requestAnimationFrame(updateCursor)
		} else {
			cancelAnimationFrame(animationFrameId)
		}
		return () => cancelAnimationFrame(animationFrameId)
	})

	$effect(() => {
		// console.log('isDraggingItem:', isDraggingItem, 'draggedItemId:', draggedItemId)
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
	const PIXELS_PER_BEAT = $derived(context.state.project.progressionZoomLevel)

	// Derived: total duration is sum of all item durations
	const totalBeats = $derived.by(() => {
		return getProgressionTotalDuration()
	})

	// Derived: item area width in pixels (including gaps)
	const itemAreaWidth = $derived.by(() => {
		const numItems = progressionItems.length
		const totalGaps = numItems > 0 ? (numItems - 1) * GAP_BETWEEN_ITEMS : 0
		return totalBeats * PIXELS_PER_BEAT + totalGaps
	})

	// Derived: ghost item data when dragging
	const ghostItem = $derived.by(() => {
		if (!isDraggingItem || !draggedItemId) return null
		const item = progressionItems.find((i) => i.id === draggedItemId)
		if (!item) return null
		return item
	})

	// Derived: total duration in bars
	const totalBars = $derived.by(() => {
		const beats = getProgressionTotalDuration()
		return Math.round((beats / BEATS_PER_BAR) * 1000) / 1000
	})

	const handleKeyDown = (event: KeyboardEvent) => {
		// While typing in a field, keys belong to the field.
		if (isTypingInTextField(event)) return
		const isDeleteKey = event.key === 'Delete' || event.key === 'Backspace'
		if (isDeleteKey && context.state.selectedProgressionItemId) {
			context.removeProgressionItem(context.state.selectedProgressionItemId)
			return
		}
		const isDuplicateKey = (event.ctrlKey || event.metaKey) && event.key === 'd'

		if (isDuplicateKey && context.state.selectedProgressionItemId) {
			event.preventDefault()
			context.duplicateProgressionItem(context.state.selectedProgressionItemId)
		}
	}

	const handleItemClick = (event: MouseEvent) => {
		const target = event.target as HTMLElement
		const itemElement = target.closest('.progressionItem') as HTMLElement
		const itemId = itemElement?.dataset.itemId
		event.stopPropagation()
		context.selectProgressionItem(itemId || null)
	}

	const handleItemMouseDown = (event: MouseEvent) => {
		if (isResizingItem) return

		const target = event.target as HTMLElement
		const itemElement = target.closest('.progressionItem') as HTMLElement
		if (!itemElement) return console.log('No item element found')

		const itemId = itemElement.dataset.itemId
		if (!itemId) return console.log('No itemId found on item element')

		const itemIndex = progressionItems.findIndex((i) => i.id === itemId)
		if (itemIndex === -1) return

		// console.log('Drag started for item:', itemId, 'at index:', itemIndex)

		isMouseDownOnItem = true
		draggedItemId = itemId
		dragStartX = event.clientX
		dragStartIndex = itemIndex
		context.selectProgressionItem(itemId)

		event.stopPropagation()
		event.preventDefault()
	}

	const handleResizeMouseDown = (event: MouseEvent) => {
		const target = event.target as HTMLElement
		const itemElement = target.closest('.progressionItem') as HTMLElement
		const itemId = itemElement?.dataset.itemId
		if (!itemId) return

		const item = context.state.project.progressionChords.find((i) => i.id === itemId)
		if (!item) return

		isResizingItem = true
		resizingItemId = itemId
		resizeStartX = event.clientX
		resizeStartDuration = item.durationBeats ?? 0
		context.selectProgressionItem(itemId)

		event.stopPropagation()
		event.preventDefault()
	}

	const handleMouseMove = (event: MouseEvent) => {
		if (!itemAreaElement) return

		if (isResizingItem && resizingItemId) {
			const item = context.state.project.progressionChords.find((i) => i.id === resizingItemId)
			if (!item) return

			const deltaX = event.clientX - resizeStartX
			const deltaBeats = Math.round(deltaX / PIXELS_PER_BEAT / RESIZE_INCREMENT_BEATS) * RESIZE_INCREMENT_BEATS
			const newDuration = Math.max(MIN_DURATION_BEATS, resizeStartDuration + deltaBeats)

			context.updateProgressionItem({
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
				// console.log('Drag threshold reached, isDraggingItem:', isDraggingItem)
			}
		}

		// Update ghost item position
		if (isDraggingItem) {
			ghostItemMouseX = event.clientX
			ghostItemMouseY = event.clientY
		}

		if (!isDraggingItem || !draggedItemId || !itemAreaElement) return

		// console.log('Dragging item:', draggedItemId)

		// Calculate which item position we're hovering over
		const items = progressionItems
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

		// console.log('Calculated newIndex:', newIndex, 'dragStartIndex:', dragStartIndex)

		// Reorder the item if needed
		if (newIndex !== dragStartIndex) {
			// console.log('Reordering item from', dragStartIndex, 'to', newIndex)
			context.reorderProgressionItem({ itemId: draggedItemId, newIndex })
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
		context.addProgressionRest()
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
		const isCurrentlyPlaying = playbackContext.state.isPlaying

		if (isCurrentlyPlaying) {
			playbackContext.stop()
			return
		}

		playbackContext.perform({
			id: context.state.project.id,
			bpm: context.state.project.bpm,
			octave: context.state.project.octave,
			progressionChords: progressionItems,
			patternSignals: patternActiveSignals,
			patternSignalRows: context.state.project.patternSignalRows,
			patternDurationBars: patternActiveDurationBeats / 4,
			doesPatternResetOnChordChange: context.state.project.doesPatternResetOnChordChange,
			minVelocity: context.state.project.minVelocity,
			maxVelocity: context.state.project.maxVelocity
		})
	}

	const handleDownloadMidi = () => {
		const project = context.state.project
		// Use derived progressionChords with calculated startTimes
		const projectWithStartTimes = {
			...project,
			progressionChords: progressionItems
		}
		exportPerformanceAsMidi(projectWithStartTimes)
	}

	const handleDownloadChords = () => {
		const project = context.state.project
		// Use derived progressionChords with calculated startTimes
		const projectWithStartTimes = {
			...project,
			progressionChords: progressionItems
		}
		exportChordsAsMidi(projectWithStartTimes)
	}

	const toggleFollow = () => {
		isFollowEnabled = !isFollowEnabled
	}

	const downloadMenuItems = [
		{ value: 'chords', label: 'Chords' },
		{ value: 'performance', label: 'Performance' }
	]

	const handleDownloadSelect = (event: CustomEvent) => {
		const selectedValue: string = event.detail.value
		if (selectedValue === 'chords') handleDownloadChords()
		if (selectedValue === 'performance') handleDownloadMidi()
	}

	const zoomIn = () => {
		const newValue = Math.min(MAX_PIXELS_PER_BEAT, context.state.project.progressionZoomLevel + ZOOM_INCREMENT)
		context.updateProject({ progressionZoomLevel: newValue })
	}

	const zoomOut = () => {
		const newValue = Math.max(MIN_PIXELS_PER_BEAT, context.state.project.progressionZoomLevel - ZOOM_INCREMENT)
		context.updateProject({ progressionZoomLevel: newValue })
	}
</script>

<svelte:window onkeydown={handleKeyDown} onmousemove={handleMouseMove} onmouseup={handleMouseUp} />

<z-column class="progressionPanelContainer">
	<z-separator></z-separator>
	<z-row insetX="lg" insetY="sm" gap="lg" alignsY="center" isFullWidth>
		<z-row gap="md" alignsY="center">
			<z-button
				tone="primary"
				onclick={togglePlayback}
				aria-label={playbackContext.state.isPlaying ? 'Stop' : 'Play'}
			>
				{#if playbackContext.state.isPlaying}
					<Stop size={18} weight="fill" />
				{:else}
					<Play size={18} weight="fill" />
				{/if}
			</z-button>

			<z-column>
				<z-subheading size="md">Progression</z-subheading>
				<z-text size="xs" color="muted" class="progressionBarCount">
					{toFractionString(totalBars)}
					{totalBars === 1 ? 'bar' : 'bars'}
				</z-text>
			</z-column>
		</z-row>

		<z-separator isVertical></z-separator>

		<z-row gap="sm" alignsY="center">
			<z-menu items={downloadMenuItems} onselect={handleDownloadSelect}>
				<z-button slot="trigger" kind="outline" size="sm">
					<DownloadSimple size={16} weight="bold" />
					Download
				</z-button>
			</z-menu>

			<z-button kind="outline" size="sm" onclick={handleAddRest}>
				<Plus size={16} weight="bold" />
				Add rest
			</z-button>

			<z-toggle-button kind="outline" tone="primary" size="sm" isPressed={isFollowEnabled} onpress={toggleFollow}>
				<ArrowRight size={16} />
				Follow
			</z-toggle-button>
		</z-row>

		<z-separator isVertical></z-separator>

		<z-button-group>
			<z-button kind="outline" size="sm" onclick={zoomOut} aria-label="Zoom out">
				<MagnifyingGlassMinus size={16} weight="bold" />
			</z-button>
			<z-button kind="outline" size="sm" onclick={zoomIn} aria-label="Zoom in">
				<MagnifyingGlassPlus size={16} weight="bold" />
			</z-button>
		</z-button-group>

		<ProgressionSelectionControls />
	</z-row>
	<z-separator></z-separator>

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
				{#if playbackContext.state.isPlaying}
					<div class="playbackCursor" bind:this={cursorElement}></div>
				{/if}
				{#each progressionItems as item, index (item.id)}
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

</z-column>

<style>
	.progressionPanelContainer {
		width: 100%;
		flex-shrink: 0;
		background: var(--card);
	}

	.mainProgressionPanel {
		width: 100%;
		height: 7.5rem;
		flex-shrink: 0;
		display: flex;
		flex-direction: column;
		z-index: 50;
	}

	.middle {
		flex: 1;
		background-color: var(--background);
		position: relative;
		display: flex;
		flex-direction: column;
		overflow-x: auto;
		overflow-y: hidden;
		max-height: 7.5rem;
	}

	.itemArea {
		position: relative;
		flex: 1;
		min-width: 100%;
		overflow: hidden;
		display: flex;
		flex-direction: row;
		align-items: flex-start;
		padding-top: var(--spacing-6);
		left: -2px;
	}

	.ghostItem {
		position: fixed;
		transform: translate(-50%, -50%) rotate(5deg);
		pointer-events: none;
		z-index: 1000;
		background: var(--popover);
		color: var(--popover-foreground);
		border: 1px solid var(--purple);
		border-radius: var(--radius-md);
		padding: var(--spacing-2) var(--spacing-4);
		font-size: var(--font-size-2);
		font-weight: var(--font-weight-semibold);
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
		background-color: var(--purple);
		z-index: 100;
		pointer-events: none;
		will-change: transform;
	}

	.progressionBarCount {
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}
</style>
