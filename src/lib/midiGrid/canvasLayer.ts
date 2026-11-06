import { getPalette, invalidatePalette, type PaletteT } from './palette'

export type DrawArgsT = {
	context: CanvasRenderingContext2D
	width: number
	height: number
	palette: PaletteT
}

export type CanvasLayerArgsT = {
	canvas: HTMLCanvasElement
	draw: (args: DrawArgsT) => void
	onResize?: (size: { width: number; height: number }) => void
}

export type CanvasLayerT = {
	requestDraw: () => void
	getSize: () => { width: number; height: number }
	destroy: () => void
}

// One canvas that redraws at most once per frame.
// It follows its CSS size and the screen's pixel density.
export const createCanvasLayer = (args: CanvasLayerArgsT): CanvasLayerT => {
	const context = args.canvas.getContext('2d')
	let width = 0
	let height = 0
	let frameId = 0
	let isDestroyed = false

	const drawNow = () => {
		frameId = 0
		const hasNoSurface = !context || width === 0 || height === 0
		if (isDestroyed || hasNoSurface) return

		const pixelRatio = window.devicePixelRatio || 1
		const pixelWidth = Math.round(width * pixelRatio)
		const pixelHeight = Math.round(height * pixelRatio)
		const isResized = args.canvas.width !== pixelWidth || args.canvas.height !== pixelHeight
		if (isResized) {
			args.canvas.width = pixelWidth
			args.canvas.height = pixelHeight
		}

		context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
		context.clearRect(0, 0, width, height)
		args.draw({ context, width, height, palette: getPalette() })
	}

	const requestDraw = () => {
		if (frameId) return
		frameId = requestAnimationFrame(drawNow)
	}

	const resizeObserver = new ResizeObserver((entries) => {
		const entry = entries[0]
		width = entry.contentRect.width
		height = entry.contentRect.height
		args.onResize?.({ width, height })
		requestDraw()
	})
	resizeObserver.observe(args.canvas)

	const handleThemeChange = () => {
		invalidatePalette()
		requestDraw()
	}

	const themeObserver = new MutationObserver(handleThemeChange)
	themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class', 'style'] })

	const colorSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)')
	colorSchemeQuery.addEventListener('change', handleThemeChange)

	// Canvas text uses whatever font is loaded at draw time.
	document.fonts?.addEventListener('loadingdone', requestDraw)

	const destroy = () => {
		isDestroyed = true
		cancelAnimationFrame(frameId)
		resizeObserver.disconnect()
		themeObserver.disconnect()
		colorSchemeQuery.removeEventListener('change', handleThemeChange)
		document.fonts?.removeEventListener('loadingdone', requestDraw)
	}

	return { requestDraw, getSize: () => ({ width, height }), destroy }
}
