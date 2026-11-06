import type { PatternEditorT } from './editor'

export type WheelHandlerArgsT = {
	editor: PatternEditorT
	// Ctrl or Cmd with the wheel zooms. One step per this many wheel units.
	onZoomStep: (direction: 1 | -1) => void
	canScrollVertically: boolean
}

const ZOOM_WHEEL_UNITS_PER_STEP = 60
const LINE_HEIGHT_PX = 16
const PAGE_HEIGHT_PX = 400

const getWheelUnit = (event: WheelEvent): number => {
	if (event.deltaMode === 1) return LINE_HEIGHT_PX
	if (event.deltaMode === 2) return PAGE_HEIGHT_PX
	return 1
}

// Wheel and trackpad: scroll the grid. Shift swaps the direction.
// Ctrl or Cmd with the wheel (or a pinch) zooms.
export const createWheelHandler = (args: WheelHandlerArgsT) => {
	let zoomUnits = 0

	return (event: WheelEvent) => {
		event.preventDefault()
		const editor = args.editor
		const view = editor.getView()
		const unit = getWheelUnit(event)

		const isZooming = event.ctrlKey || event.metaKey
		if (isZooming) {
			zoomUnits += event.deltaY * unit
			const stepCount = Math.trunc(Math.abs(zoomUnits) / ZOOM_WHEEL_UNITS_PER_STEP)
			if (stepCount === 0) return

			const direction = zoomUnits < 0 ? 1 : -1
			for (let step = 0; step < stepCount; step++) args.onZoomStep(direction)
			zoomUnits = 0
			return
		}

		const isSwappingAxes = event.shiftKey && event.deltaX === 0
		const deltaX = (isSwappingAxes ? event.deltaY : event.deltaX) * unit
		const deltaY = (isSwappingAxes ? 0 : event.deltaY) * unit

		const scrollTick = view.scrollTick + deltaX / view.pxPerTick
		const scrollRow = args.canScrollVertically ? view.scrollRow + deltaY / view.rowHeight : view.scrollRow
		editor.setView({ scrollTick, scrollRow })
	}
}
