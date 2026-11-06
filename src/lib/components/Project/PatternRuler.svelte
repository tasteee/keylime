<script lang="ts">
	import { onMount } from 'svelte'
	import { createCanvasLayer, type CanvasLayerT, type DrawArgsT } from '$lib/midiGrid/canvasLayer'
	import {
		BEATS_PER_BAR,
		DRAG_THRESHOLD_PX,
		MAX_CELL_PIXELS,
		MIN_CELL_PIXELS,
		TICKS_PER_BAR,
		TICKS_PER_BEAT,
		TICKS_PER_CELL
	} from '$lib/midiGrid/constants'
	import type { PatternEditorT } from '$lib/midiGrid/editor'
	import { focusPatternFrame } from '$lib/midiGrid/focus'
	import { getTickAtX, getXAtTick, snapTick } from '$lib/midiGrid/geometry'
	import { drawRoundedRect, getCrispPosition } from '$lib/midiGrid/paint'
	import { withAlpha } from '$lib/midiGrid/palette'
	import { snapTickToCell } from '$lib/midiGrid/time'
	import { createWheelHandler } from '$lib/midiGrid/wheel'

	type PatternRulerPropsT = {
		editor: PatternEditorT
		onZoomStep: (direction: 1 | -1) => void
		// Called while dragging the ruler. Cell width in pixels.
		onCellPixelsChange: (cellPixels: number) => void
	}

	const props: PatternRulerPropsT = $props()

	// The strip along the top that holds the loop bar.
	const LOOP_STRIP_HEIGHT = 14
	const HANDLE_REACH_PX = 8

	// Dragging the ruler sideways doubles or halves the zoom
	// for every this many pixels.
	const ZOOM_DRAG_PX_PER_DOUBLE = 160

	let canvasElement: HTMLCanvasElement
	let layer: CanvasLayerT | null = null
	let hoverX: number | null = null
	let isDraggingLoop = false
	let isPressingRuler = false
	let isZoomDragging = false
	let pressStartX = 0
	let pressStartCellPixels = 0
	let pressAnchorTick = 0

	const getLocalX = (event: { clientX: number }): number => {
		return event.clientX - canvasElement.getBoundingClientRect().left
	}

	const getLocalY = (event: { clientY: number }): number => {
		return event.clientY - canvasElement.getBoundingClientRect().top
	}

	const checkIsOnLoopHandle = (event: PointerEvent): boolean => {
		const editor = props.editor
		const loopEndX = getXAtTick({ view: editor.getView(), tick: editor.getLoopEndTick() })
		const isNearHandle = Math.abs(getLocalX(event) - loopEndX) <= HANDLE_REACH_PX
		const isInStrip = getLocalY(event) <= LOOP_STRIP_HEIGHT + 6
		return isNearHandle && isInStrip
	}

	const draw = (drawArgs: DrawArgsT) => {
		const context = drawArgs.context
		const palette = drawArgs.palette
		const editor = props.editor
		const view = editor.getView()
		const width = drawArgs.width
		const height = drawArgs.height

		context.fillStyle = palette.surface
		context.fillRect(0, 0, width, height)

		// The loop bar: the length of the pattern.
		const loopEndX = getXAtTick({ view, tick: editor.getLoopEndTick() })
		const loopStartX = getXAtTick({ view, tick: 0 })
		context.fillStyle = withAlpha(palette.accent, 0.1)
		context.fillRect(loopStartX, 0, loopEndX - loopStartX, height)
		context.fillStyle = palette.accent
		drawRoundedRect({ context, x: loopStartX + 1, y: 3, width: loopEndX - loopStartX - 2, height: 6, radius: 3 })
		context.fill()
		context.fillStyle = palette.surface
		context.fillRect(Math.round(loopEndX) - 5, 4, 1, 4)

		// Bar numbers and beat ticks.
		const lastTick = view.scrollTick + width / view.pxPerTick
		const firstBar = Math.max(0, Math.floor(view.scrollTick / TICKS_PER_BAR))
		const lastBar = Math.ceil(lastTick / TICKS_PER_BAR)
		const barPixels = TICKS_PER_BAR * view.pxPerTick
		const beatPixels = TICKS_PER_BEAT * view.pxPerTick
		const labelEvery = barPixels >= 34 ? 1 : Math.pow(2, Math.ceil(Math.log2(34 / barPixels)))

		context.font = `500 10.5px ${palette.fontMono}`
		context.textBaseline = 'middle'

		for (let bar = firstBar; bar < lastBar; bar++) {
			const barX = getXAtTick({ view, tick: bar * TICKS_PER_BAR })

			const canShowBeats = beatPixels > 8
			if (canShowBeats) {
				context.fillStyle = withAlpha(palette.textFaint, 0.8)
				for (let beat = 1; beat < BEATS_PER_BAR; beat++) {
					context.fillRect(getCrispPosition(barX + beat * beatPixels) - 0.5, height - 6, 1, 4)
				}
			}

			const isLabelled = bar % labelEvery === 0
			if (!isLabelled) continue

			context.fillStyle = palette.textFaint
			context.fillRect(getCrispPosition(barX) - 0.5, height - 10, 1, 8)
			context.fillStyle = palette.textMuted
			context.fillText(String(bar + 1), barX + 5, height / 2 + 4)
		}

		const hasHover = hoverX !== null
		if (hasHover) {
			context.fillStyle = withAlpha(palette.text, 0.18)
			context.fillRect(Math.round(hoverX as number), LOOP_STRIP_HEIGHT, 1, height - LOOP_STRIP_HEIGHT)
		}

		const playheadTick = editor.getPlayheadTick()
		const hasPlayhead = playheadTick !== null
		if (hasPlayhead) {
			const playheadX = Math.round(getXAtTick({ view, tick: playheadTick as number }))
			context.fillStyle = palette.text
			context.beginPath()
			context.moveTo(playheadX - 5, height - 9)
			context.lineTo(playheadX + 5, height - 9)
			context.lineTo(playheadX, height - 3)
			context.closePath()
			context.fill()
		}

		const cursorTick = view.cursorTick
		const hasCursor = cursorTick > 0 && !hasPlayhead
		if (hasCursor) {
			const cursorX = Math.round(getXAtTick({ view, tick: cursorTick }))
			context.fillStyle = palette.textMuted
			context.fillRect(cursorX - 0.5, height - 5, 1.5, 5)
		}

		context.fillStyle = palette.border
		context.fillRect(0, height - 1, width, 1)
	}

	const getLoopEndFromPointer = (args: { event: PointerEvent; mode: 'round' | 'ceil' }): number => {
		const view = props.editor.getView()
		const pointerTick = getTickAtX({ view, x: getLocalX(args.event) })
		return snapTickToCell({ tick: pointerTick, mode: args.mode })
	}

	// Drag the end of the loop bar, or click in the strip to end the
	// pattern at that cell. Below it, click to move the paste cursor
	// and drag sideways to zoom.
	const handlePointerDown = (event: PointerEvent) => {
		if (event.button !== 0) return
		focusPatternFrame(canvasElement)
		canvasElement.setPointerCapture(event.pointerId)

		const isInStrip = getLocalY(event) <= LOOP_STRIP_HEIGHT
		const isOnHandle = checkIsOnLoopHandle(event)
		const isLoopEdit = isInStrip || isOnHandle
		isDraggingLoop = isLoopEdit

		if (isLoopEdit) {
			const mode = isOnHandle ? 'round' : 'ceil'
			props.editor.requestLoopEndTick(getLoopEndFromPointer({ event, mode }))
			return
		}

		// Below the strip, a click moves the paste cursor and a drag zooms.
		const view = props.editor.getView()
		isPressingRuler = true
		isZoomDragging = false
		pressStartX = getLocalX(event)
		pressStartCellPixels = view.pxPerTick * TICKS_PER_CELL
		pressAnchorTick = getTickAtX({ view, x: pressStartX })
	}

	const applyZoomDrag = (event: PointerEvent) => {
		const dragX = getLocalX(event) - pressStartX
		const doublings = dragX / ZOOM_DRAG_PX_PER_DOUBLE
		const rawCellPixels = pressStartCellPixels * Math.pow(2, doublings)
		const clampedCellPixels = Math.min(MAX_CELL_PIXELS, Math.max(MIN_CELL_PIXELS, rawCellPixels))
		const cellPixels = Math.round(clampedCellPixels)
		const pxPerTick = cellPixels / TICKS_PER_CELL

		// Keep the tick under the pointer where it was.
		const scrollTick = pressAnchorTick - pressStartX / pxPerTick
		props.editor.setView({ pxPerTick, scrollTick })
		props.onCellPixelsChange(cellPixels)
	}

	const finishRulerPress = (event: PointerEvent) => {
		const wasClick = isPressingRuler && !isZoomDragging
		isPressingRuler = false
		isZoomDragging = false
		if (!wasClick) return

		const view = props.editor.getView()
		const pointerTick = getTickAtX({ view, x: getLocalX(event) })
		const cursorTick = snapTick({
			tick: pointerTick,
			mode: 'round',
			isSnapOff: event.altKey,
			stepTicks: view.gridStepTicks
		})
		props.editor.setView({ cursorTick })
	}

	const handlePointerMove = (event: PointerEvent) => {
		hoverX = getLocalX(event)
		layer?.requestDraw()

		if (isDraggingLoop) {
			props.editor.requestLoopEndTick(getLoopEndFromPointer({ event, mode: 'round' }))
			return
		}

		if (isPressingRuler) {
			const dragDistance = Math.abs(getLocalX(event) - pressStartX)
			const hasMovedEnough = dragDistance >= DRAG_THRESHOLD_PX
			if (hasMovedEnough) isZoomDragging = true
			if (isZoomDragging) canvasElement.dataset.cursor = 'ew-resize'
			if (isZoomDragging) applyZoomDrag(event)
			return
		}

		const isEditingLoopHere = checkIsOnLoopHandle(event) || getLocalY(event) <= LOOP_STRIP_HEIGHT
		canvasElement.dataset.cursor = isEditingLoopHere ? 'ew-resize' : 'text'
	}

	const handlePointerUp = (event: PointerEvent) => {
		finishRulerPress(event)
		isDraggingLoop = false
		const hasCapture = canvasElement.hasPointerCapture(event.pointerId)
		if (hasCapture) canvasElement.releasePointerCapture(event.pointerId)
	}

	const handlePointerLeave = () => {
		hoverX = null
		layer?.requestDraw()
	}

	onMount(() => {
		layer = createCanvasLayer({ canvas: canvasElement, draw })
		const unsubscribe = props.editor.subscribe(() => layer?.requestDraw())

		const handleWheel = createWheelHandler({
			editor: props.editor,
			onZoomStep: props.onZoomStep,
			canScrollVertically: false
		})
		canvasElement.addEventListener('wheel', handleWheel, { passive: false })

		return () => {
			unsubscribe()
			canvasElement.removeEventListener('wheel', handleWheel)
			layer?.destroy()
		}
	})
</script>

<canvas
	class="pattern-ruler"
	bind:this={canvasElement}
	data-cursor="text"
	onpointerdown={handlePointerDown}
	onpointermove={handlePointerMove}
	onpointerup={handlePointerUp}
	onpointercancel={handlePointerUp}
	onpointerleave={handlePointerLeave}
></canvas>

<style>
	.pattern-ruler {
		display: block;
		width: 100%;
		height: 100%;
		min-width: 0;
		background: var(--card);
		user-select: none;
		touch-action: none;
	}

	.pattern-ruler[data-cursor='text'] {
		cursor: text;
	}

	.pattern-ruler:global([data-cursor='ew-resize']) {
		cursor: ew-resize;
	}
</style>
