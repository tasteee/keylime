<script lang="ts">
	import { onMount } from 'svelte'
	import { addNotes, deleteNotes } from '$lib/midiGrid/commands'
	import { createCanvasLayer, type CanvasLayerT, type DrawArgsT } from '$lib/midiGrid/canvasLayer'
	import { ROW_COUNT, TICKS_PER_CELL } from '$lib/midiGrid/constants'
	import type { PatternEditorT } from '$lib/midiGrid/editor'
	import { focusPatternFrame } from '$lib/midiGrid/focus'
	import { getPitchAtY, getTickAtX, hitTestNote, snapTick } from '$lib/midiGrid/geometry'
	import { drawCursorLine, drawLoopEnd, drawNotes, drawPlayhead, drawRows, drawTimeGrid } from '$lib/midiGrid/paint'
	import {
		createMarqueeGesture,
		createMoveGesture,
		createPanGesture,
		createResizeGesture,
		createVelocityGesture,
		type GestureContextT
	} from '$lib/midiGrid/rollGestures'
	import type { GestureT, PointT, RectT } from '$lib/midiGrid/types'
	import { createWheelHandler } from '$lib/midiGrid/wheel'

	type PatternRollPropsT = {
		editor: PatternEditorT
		onZoomStep: (direction: 1 | -1) => void
	}

	const props: PatternRollPropsT = $props()

	const AUTO_SCROLL_EDGE_PX = 28
	const AUTO_SCROLL_MAX_SPEED = 24

	let canvasElement: HTMLCanvasElement
	let frameElement: HTMLDivElement
	let activeGesture: GestureT | null = null
	let lastPointerEvent: PointerEvent | null = null
	let autoScrollFrameId = 0
	let hasCenteredRows = false
	let marqueeRect: RectT | null = $state(null)

	const marqueeStyle = $derived.by(() => {
		if (!marqueeRect) return 'display: none'
		return `left: ${marqueeRect.x}px; top: ${marqueeRect.y}px; width: ${marqueeRect.width}px; height: ${marqueeRect.height}px`
	})

	const getLocalPoint = (event: { clientX: number; clientY: number }): PointT => {
		const bounds = canvasElement.getBoundingClientRect()
		return { x: event.clientX - bounds.left, y: event.clientY - bounds.top }
	}

	const setCursorStyle = (cursor: string) => {
		canvasElement.dataset.cursor = cursor
	}

	const setMarquee = (rect: RectT | null) => {
		marqueeRect = rect
	}

	const gestureContext: GestureContextT = {
		get editor() {
			return props.editor
		},
		getLocalPoint,
		setCursorStyle,
		setMarquee
	}

	const drawRoll = (drawArgs: DrawArgsT) => {
		const editor = props.editor
		const view = editor.getView()
		const baseArgs = { context: drawArgs.context, palette: drawArgs.palette, view, width: drawArgs.width }
		const loopEndTick = editor.getLoopEndTick()
		const playheadTick = editor.getPlayheadTick()

		drawRows({ ...baseArgs, height: drawArgs.height })
		drawTimeGrid({ ...baseArgs, top: 0, height: drawArgs.height, shouldShadeBars: true })

		drawNotes({
			...baseArgs,
			height: drawArgs.height,
			notes: editor.getDisplayNotes(),
			selectedIds: editor.getSelectedIds(),
			hoverId: editor.getHoverId(),
			loopEndTick,
			playheadTick,
			isDragging: activeGesture !== null
		})

		drawLoopEnd({ ...baseArgs, top: 0, height: drawArgs.height, loopEndTick })
		drawCursorLine({ ...baseArgs, height: drawArgs.height, playheadTick, cursorTick: view.cursorTick })
		drawPlayhead({ ...baseArgs, height: drawArgs.height, playheadTick })
	}

	let layer: CanvasLayerT | null = null

	const centerOnMiddleBand = () => {
		const editor = props.editor
		const viewport = editor.getViewport()
		const visibleRows = viewport.height / editor.getView().rowHeight
		const middleBandCenterRow = ROW_COUNT / 2
		const scrollRow = middleBandCenterRow - visibleRows / 2
		editor.setView({ scrollRow })
	}

	const handleResize = (size: { width: number; height: number }) => {
		props.editor.setViewport(size)
		if (hasCenteredRows) return
		const hasSize = size.height > 0
		if (!hasSize) return
		hasCenteredRows = true
		centerOnMiddleBand()
	}

	// ---- Pointer ----

	const hitTestAtPoint = (point: PointT) => {
		const editor = props.editor
		return hitTestNote({
			notes: editor.getDisplayNotes(),
			selectedIds: editor.getSelectedIds(),
			view: editor.getView(),
			point
		})
	}

	const startGesture = (args: { event: PointerEvent; gesture: GestureT }) => {
		activeGesture = args.gesture
		props.editor.setHoverId(null)
		canvasElement.setPointerCapture(args.event.pointerId)
		layer?.requestDraw()
	}

	const handleAutoScroll = () => {
		autoScrollFrameId = 0
		const pointerEvent = lastPointerEvent
		const isIdle = !pointerEvent || !activeGesture
		if (isIdle) return

		const editor = props.editor
		const view = editor.getView()
		const viewport = editor.getViewport()
		const point = getLocalPoint(pointerEvent as PointerEvent)

		const getSpeed = (distance: number): number => {
			const ratio = Math.abs(distance) / AUTO_SCROLL_EDGE_PX
			const speed = Math.min(AUTO_SCROLL_MAX_SPEED, Math.pow(ratio, 1.6) * 10)
			return Math.sign(distance) * speed
		}

		const isNearLeft = point.x < AUTO_SCROLL_EDGE_PX
		const isNearRight = point.x > viewport.width - AUTO_SCROLL_EDGE_PX
		const isNearTop = point.y < AUTO_SCROLL_EDGE_PX
		const isNearBottom = point.y > viewport.height - AUTO_SCROLL_EDGE_PX

		let speedX = 0
		let speedY = 0
		if (isNearLeft) speedX = getSpeed(point.x - AUTO_SCROLL_EDGE_PX)
		if (isNearRight) speedX = getSpeed(point.x - (viewport.width - AUTO_SCROLL_EDGE_PX))
		if (isNearTop) speedY = getSpeed(point.y - AUTO_SCROLL_EDGE_PX)
		if (isNearBottom) speedY = getSpeed(point.y - (viewport.height - AUTO_SCROLL_EDGE_PX))

		const isStill = speedX === 0 && speedY === 0
		if (isStill) return

		editor.setView({
			scrollTick: view.scrollTick + speedX / view.pxPerTick,
			scrollRow: view.scrollRow + speedY / view.rowHeight
		})
		activeGesture?.move(pointerEvent as PointerEvent)
		autoScrollFrameId = requestAnimationFrame(handleAutoScroll)
	}

	const finishGesture = (args: { event: PointerEvent; isCancelled: boolean }) => {
		const gesture = activeGesture
		if (!gesture) return

		activeGesture = null
		lastPointerEvent = null
		cancelAnimationFrame(autoScrollFrameId)
		autoScrollFrameId = 0
		window.removeEventListener('keydown', handleEscapeDuringGesture, true)

		const hasCapture = canvasElement.hasPointerCapture(args.event.pointerId)
		if (hasCapture) canvasElement.releasePointerCapture(args.event.pointerId)

		if (args.isCancelled) gesture.cancel()
		if (!args.isCancelled) gesture.up(args.event)

		setMarquee(null)
		updateHover(args.event)
		layer?.requestDraw()
	}

	// Escape in the middle of a drag puts everything back.
	const handleEscapeDuringGesture = (event: KeyboardEvent) => {
		const isEscape = event.key === 'Escape'
		if (!isEscape) return
		event.stopPropagation()
		event.preventDefault()
		const lastEvent = lastPointerEvent
		if (!lastEvent) return
		finishGesture({ event: lastEvent, isCancelled: true })
	}

	const handlePointerDown = (event: PointerEvent) => {
		const hasGesture = activeGesture !== null
		if (hasGesture) return

		focusPatternFrame(canvasElement)
		lastPointerEvent = event
		const point = getLocalPoint(event)
		const hit = hitTestAtPoint(point)

		const isMiddleButton = event.button === 1
		if (isMiddleButton) {
			event.preventDefault()
			startGesture({ event, gesture: createPanGesture({ context: gestureContext, downEvent: event }) })
			window.addEventListener('keydown', handleEscapeDuringGesture, true)
			return
		}

		const isRightButton = event.button === 2
		if (isRightButton) {
			if (!hit) return
			const gesture = createVelocityGesture({ context: gestureContext, downEvent: event, hitNote: hit.note })
			startGesture({ event, gesture })
			window.addEventListener('keydown', handleEscapeDuringGesture, true)
			return
		}

		const isLeftButton = event.button === 0
		if (!isLeftButton) return

		window.addEventListener('keydown', handleEscapeDuringGesture, true)

		if (hit && hit.zone !== 'body') {
			startGesture({ event, gesture: createResizeGesture({ context: gestureContext, downEvent: event, hit }) })
			return
		}

		if (hit) {
			startGesture({ event, gesture: createMoveGesture({ context: gestureContext, downEvent: event, anchor: hit.note }) })
			return
		}

		startGesture({ event, gesture: createMarqueeGesture({ context: gestureContext, downEvent: event }) })
	}

	const handlePointerMove = (event: PointerEvent) => {
		const gesture = activeGesture
		if (gesture) {
			lastPointerEvent = event
			gesture.move(event)
			if (!autoScrollFrameId) autoScrollFrameId = requestAnimationFrame(handleAutoScroll)
			return
		}

		updateHover(event)
	}

	const handlePointerUp = (event: PointerEvent) => finishGesture({ event, isCancelled: false })
	const handlePointerCancel = (event: PointerEvent) => finishGesture({ event, isCancelled: true })

	const updateHover = (event: { clientX: number; clientY: number }) => {
		const hasGesture = activeGesture !== null
		if (hasGesture) return

		const point = getLocalPoint(event)
		const viewport = props.editor.getViewport()
		const isInside = point.x >= 0 && point.y >= 0 && point.x <= viewport.width && point.y <= viewport.height
		const hit = isInside ? hitTestAtPoint(point) : null

		props.editor.setHoverId(hit ? hit.note.id : null)
		if (!hit) return setCursorStyle('default')
		setCursorStyle(hit.zone === 'body' ? 'grab' : 'ew-resize')
	}

	const handlePointerLeave = () => {
		const hasGesture = activeGesture !== null
		if (hasGesture) return
		props.editor.setHoverId(null)
	}

	const handleDoubleClick = (event: MouseEvent) => {
		const editor = props.editor
		const point = getLocalPoint(event)
		const hit = hitTestAtPoint(point)

		if (hit) {
			deleteNotes({ editor, ids: [hit.note.id] })
			return
		}

		const view = editor.getView()
		const startTick = snapTick({ tick: getTickAtX({ view, x: point.x }), mode: 'floor', isSnapOff: event.altKey })
		const pitch = getPitchAtY({ view, y: point.y })
		const duration = view.noteLength ?? TICKS_PER_CELL
		const drafts = [{ pitch, start: startTick, duration, velocity: view.noteVelocity }]

		const created = addNotes({ editor, drafts })
		const createdNote = created[0]
		if (createdNote) editor.audition({ pitch, velocity: createdNote.velocity })
	}

	const handleContextMenu = (event: MouseEvent) => event.preventDefault()

	onMount(() => {
		layer = createCanvasLayer({ canvas: canvasElement, draw: drawRoll, onResize: handleResize })
		const unsubscribe = props.editor.subscribe(() => layer?.requestDraw())

		const handleWheel = createWheelHandler({
			editor: props.editor,
			onZoomStep: props.onZoomStep,
			canScrollVertically: true
		})
		frameElement.addEventListener('wheel', handleWheel, { passive: false })

		return () => {
			unsubscribe()
			frameElement.removeEventListener('wheel', handleWheel)
			window.removeEventListener('keydown', handleEscapeDuringGesture, true)
			cancelAnimationFrame(autoScrollFrameId)
			layer?.destroy()
		}
	})
</script>

<div class="pattern-roll" bind:this={frameElement}>
	<canvas
		class="pattern-roll-canvas"
		bind:this={canvasElement}
		onpointerdown={handlePointerDown}
		onpointermove={handlePointerMove}
		onpointerup={handlePointerUp}
		onpointercancel={handlePointerCancel}
		onpointerleave={handlePointerLeave}
		ondblclick={handleDoubleClick}
		oncontextmenu={handleContextMenu}
	></canvas>
	<div class="pattern-roll-marquee" style={marqueeStyle}></div>
</div>

<style>
	.pattern-roll {
		position: relative;
		min-width: 0;
		min-height: 0;
		overflow: hidden;
		background: var(--background);
		user-select: none;
		touch-action: none;
	}

	.pattern-roll-canvas {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		display: block;
		cursor: default;
	}

	.pattern-roll-canvas:global([data-cursor='grab']) {
		cursor: grab;
	}

	.pattern-roll-canvas:global([data-cursor='grabbing']) {
		cursor: grabbing;
	}

	.pattern-roll-canvas:global([data-cursor='copy']) {
		cursor: copy;
	}

	.pattern-roll-canvas:global([data-cursor='ew-resize']) {
		cursor: ew-resize;
	}

	.pattern-roll-canvas:global([data-cursor='ns-resize']) {
		cursor: ns-resize;
	}

	.pattern-roll-marquee {
		position: absolute;
		pointer-events: none;
		border: 1px solid var(--active-accent);
		background: color-mix(in oklch, var(--active-accent) 12%, transparent);
		border-radius: var(--radius-sm);
	}
</style>
