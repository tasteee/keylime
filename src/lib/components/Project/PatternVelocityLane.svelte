<script lang="ts">
	import { onMount } from 'svelte'
	import { updateNotes } from '$lib/midiGrid/commands'
	import { createCanvasLayer, type CanvasLayerT, type DrawArgsT } from '$lib/midiGrid/canvasLayer'
	import type { PatternEditorT } from '$lib/midiGrid/editor'
	import { focusPatternFrame } from '$lib/midiGrid/focus'
	import { getTickAtX, getXAtTick } from '$lib/midiGrid/geometry'
	import { checkIsNotePlaying, drawOverscrollFade, drawTimeGrid } from '$lib/midiGrid/paint'
	import { withAlpha } from '$lib/midiGrid/palette'
	import { clampNumber } from '$lib/midiGrid/time'
	import type { NoteT } from '$lib/midiGrid/types'
	import { createWheelHandler } from '$lib/midiGrid/wheel'

	type PatternVelocityLanePropsT = {
		editor: PatternEditorT
		onZoomStep: (direction: 1 | -1) => void
	}

	const props: PatternVelocityLanePropsT = $props()

	const PADDING_TOP = 10
	const PADDING_BOTTOM = 4
	const HIT_REACH_PX = 7
	const GUIDE_LEVELS = [0.25, 0.5, 0.75, 1]

	let canvasElement: HTMLCanvasElement
	let layer: CanvasLayerT | null = null
	let activePointerId: number | null = null
	let changedNotes = new Map<string, NoteT>()
	let updatePointer: ((event: PointerEvent) => void) | null = null

	const getLocalPoint = (event: { clientX: number; clientY: number }) => {
		const bounds = canvasElement.getBoundingClientRect()
		return { x: event.clientX - bounds.left, y: event.clientY - bounds.top }
	}

	const getLaneHeight = (): number => canvasElement.getBoundingClientRect().height

	const getVelocityAtY = (y: number): number => {
		const span = getLaneHeight() - PADDING_TOP - PADDING_BOTTOM
		return clampNumber({ value: 1 - (y - PADDING_TOP) / span, min: 0, max: 1 })
	}

	// The stem closest to the pointer, if it is close enough to grab.
	const findStemAtX = (x: number): NoteT | null => {
		const editor = props.editor
		const view = editor.getView()
		const selectedIds = editor.getSelectedIds()
		let closest: NoteT | null = null
		let closestDistance = HIT_REACH_PX

		for (const note of editor.getDisplayNotes()) {
			const stemX = getXAtTick({ view, tick: note.start })
			const selectedBonus = selectedIds.has(note.id) ? 0.5 : 0
			const distance = Math.abs(stemX - x) - selectedBonus
			if (distance >= closestDistance) continue
			closestDistance = distance
			closest = note
		}

		return closest
	}

	const draw = (drawArgs: DrawArgsT) => {
		const context = drawArgs.context
		const palette = drawArgs.palette
		const editor = props.editor
		const view = editor.getView()
		const width = drawArgs.width
		const height = drawArgs.height
		const span = height - PADDING_TOP - PADDING_BOTTOM

		context.fillStyle = palette.background
		context.fillRect(0, 0, width, height)

		drawTimeGrid({ context, palette, view, width, top: 0, height, shouldShadeBars: true })

		for (const level of GUIDE_LEVELS) {
			context.fillStyle = level === 1 ? palette.lineBeat : palette.lineRow
			context.fillRect(0, Math.round(PADDING_TOP + span * (1 - level)), width, 1)
		}

		const loopEndTick = editor.getLoopEndTick()
		const selectedIds = editor.getSelectedIds()
		const hoverId = editor.getHoverId()
		const playheadTick = editor.getPlayheadTick()
		const notes = [...editor.getDisplayNotes()].sort((noteA, noteB) => {
			return Number(selectedIds.has(noteA.id)) - Number(selectedIds.has(noteB.id))
		})

		for (const note of notes) {
			const stemX = Math.round(getXAtTick({ view, tick: note.start })) + 0.5
			const isOffscreen = stemX < -4 || stemX > width + 4
			if (isOffscreen) continue

			const isSelected = selectedIds.has(note.id) || note.id.startsWith('copy:')
			const isHovered = hoverId === note.id
			const isInactive = note.start >= loopEndTick
			const isPlaying = checkIsNotePlaying({ note, playheadTick })
			const top = PADDING_TOP + span * (1 - note.velocity)

			const mutedOpacity = note.isMuted ? 0.3 : 1
			const inactiveOpacity = isInactive ? 0.35 : 1
			context.globalAlpha = mutedOpacity * inactiveOpacity

			const strokeAlpha = isSelected || isHovered ? 1 : 0.55
			const idleColor = isSelected ? palette.noteSelected : palette.noteIdle
			const stemColor = isPlaying ? palette.accent : idleColor
			context.strokeStyle = withAlpha(stemColor, strokeAlpha)
			context.lineWidth = isSelected || isHovered ? 2 : 1.5
			context.beginPath()
			context.moveTo(stemX, height - PADDING_BOTTOM)
			context.lineTo(stemX, top)
			context.stroke()

			context.fillStyle = stemColor
			context.beginPath()
			context.arc(stemX, top, isHovered ? 5 : 3.5, 0, Math.PI * 2)
			context.fill()

			if (isSelected) {
				context.lineWidth = 1.5
				context.strokeStyle = palette.noteSelected
				context.stroke()
			}

			context.globalAlpha = 1
		}

		drawOverscrollFade({ context, palette, view, width, top: 0, height })

		context.fillStyle = palette.border
		context.fillRect(0, 0, width, 1)
	}

	// Drag a stem to set its velocity. If it is selected the whole
	// selection moves together. Drag across empty space to paint velocities.
	const handlePointerDown = (event: PointerEvent) => {
		if (event.button !== 0) return
		focusPatternFrame(canvasElement)

		const editor = props.editor
		const point = getLocalPoint(event)
		const hit = findStemAtX(point.x)
		changedNotes = new Map()
		activePointerId = event.pointerId
		canvasElement.setPointerCapture(event.pointerId)

		if (hit) {
			const isHitSelected = editor.getSelectedIds().has(hit.id)
			const group = isHitSelected ? editor.getSelectedNotes() : [hit]
			const grabOffset = getVelocityAtY(point.y) - hit.velocity

			updatePointer = (moveEvent: PointerEvent) => {
				const pointerVelocity = getVelocityAtY(getLocalPoint(moveEvent).y)
				const shift = pointerVelocity - hit.velocity - grabOffset
				for (const note of group) {
					const velocity = clampNumber({ value: note.velocity + shift, min: 0, max: 1 })
					changedNotes.set(note.id, { ...note, velocity })
				}
				editor.setPreview({ overrides: new Map(changedNotes), added: [] })
			}
		}

		if (!hit) {
			let lastX = point.x
			updatePointer = (moveEvent: PointerEvent) => {
				const movePoint = getLocalPoint(moveEvent)
				const view = editor.getView()
				const leftX = Math.min(lastX, movePoint.x) - 2
				const rightX = Math.max(lastX, movePoint.x) + 2
				const velocity = getVelocityAtY(movePoint.y)
				const leftTick = getTickAtX({ view, x: leftX })
				const rightTick = getTickAtX({ view, x: rightX })

				for (const note of editor.getNotes()) {
					const isInside = note.start >= leftTick && note.start <= rightTick
					if (isInside) changedNotes.set(note.id, { ...note, velocity })
				}

				lastX = movePoint.x
				editor.setPreview({ overrides: new Map(changedNotes), added: [] })
			}
		}

		updatePointer?.(event)
	}

	const handlePointerMove = (event: PointerEvent) => {
		const isDragging = activePointerId !== null
		if (isDragging) {
			updatePointer?.(event)
			return
		}

		const hit = findStemAtX(getLocalPoint(event).x)
		props.editor.setHoverId(hit ? hit.id : null)
	}

	const handlePointerUp = (event: PointerEvent) => {
		const isDragging = activePointerId !== null
		if (!isDragging) return

		activePointerId = null
		updatePointer = null
		const hasCapture = canvasElement.hasPointerCapture(event.pointerId)
		if (hasCapture) canvasElement.releasePointerCapture(event.pointerId)

		const editor = props.editor
		editor.setPreview(null)

		const updated = [...changedNotes.values()]
		const hasChanges = updated.length > 0
		if (hasChanges) updateNotes({ editor, updated })
		changedNotes = new Map()
	}

	const handlePointerLeave = () => {
		const isDragging = activePointerId !== null
		if (isDragging) return
		props.editor.setHoverId(null)
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
	class="pattern-velocity-lane"
	bind:this={canvasElement}
	onpointerdown={handlePointerDown}
	onpointermove={handlePointerMove}
	onpointerup={handlePointerUp}
	onpointercancel={handlePointerUp}
	onpointerleave={handlePointerLeave}
></canvas>

<style>
	.pattern-velocity-lane {
		display: block;
		width: 100%;
		height: 100%;
		min-width: 0;
		cursor: ns-resize;
		user-select: none;
		touch-action: none;
	}
</style>
