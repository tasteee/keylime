// The grid listens for keys on one focusable frame. Clicking any part
// of the grid (roll, ruler, velocity lane) moves focus there.
export const PATTERN_FRAME_SELECTOR = '[data-pattern-frame]'

export const focusPatternFrame = (element: HTMLElement) => {
	const frame = element.closest(PATTERN_FRAME_SELECTOR) as HTMLElement | null
	frame?.focus({ preventScroll: true })
}
