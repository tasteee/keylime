// Canvas cannot read CSS variables. The colors are resolved from
// the same tokens the rest of the app uses, so the grid follows the theme.

export type PaletteT = {
	background: string
	surface: string
	border: string
	text: string
	textMuted: string
	textFaint: string
	accent: string
	noteSelected: string
	noteIdle: string
	lineBar: string
	lineBeat: string
	lineCell: string
	lineRow: string
	lineBand: string
	barShade: string
	inactiveShade: string
	fontMono: string
	isDark: boolean
}

let probeElement: HTMLElement | null = null
let normalizerContext: CanvasRenderingContext2D | null = null
let cachedPalette: PaletteT | null = null
let cachedThemeKey = ''

const getProbeElement = (): HTMLElement => {
	if (probeElement) return probeElement
	probeElement = document.createElement('span')
	probeElement.setAttribute('aria-hidden', 'true')
	probeElement.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;visibility:hidden;pointer-events:none'
	document.body.appendChild(probeElement)
	return probeElement
}

// Any CSS color (oklch, color-mix, ...) to rgba(). The canvas does the conversion.
const normalizeColor = (color: string): string => {
	const isAlreadyRgb = /^rgba?\(/.test(color)
	if (isAlreadyRgb) return color

	normalizerContext ??= document.createElement('canvas').getContext('2d', { willReadFrequently: true })
	if (!normalizerContext) return color

	normalizerContext.clearRect(0, 0, 1, 1)
	normalizerContext.fillStyle = color
	normalizerContext.fillRect(0, 0, 1, 1)
	const pixel = normalizerContext.getImageData(0, 0, 1, 1).data
	const alpha = Math.round((pixel[3] / 255) * 1000) / 1000
	return `rgba(${pixel[0]},${pixel[1]},${pixel[2]},${alpha})`
}

const resolveColor = (expression: string): string => {
	const probe = getProbeElement()
	probe.style.color = expression
	const computedColor = getComputedStyle(probe).color
	return normalizeColor(computedColor)
}

// rgb(...) to rgba(..., alpha). Keeps any alpha the color already has.
export const withAlpha = (color: string, alpha: number): string => {
	const match = /rgba?\(([^)]+)\)/.exec(color)
	if (!match) return color

	const parts = match[1].split(/[\s,/]+/).filter(Boolean)
	const baseAlpha = parts.length > 3 ? Number(parts[3]) : 1
	const nextAlpha = (Number.isFinite(baseAlpha) ? baseAlpha : 1) * alpha
	return `rgba(${parts[0]},${parts[1]},${parts[2]},${nextAlpha})`
}

const getLuminance = (color: string): number => {
	const match = /rgba?\(([^)]+)\)/.exec(color)
	if (!match) return 0
	const parts = match[1].split(/[\s,/]+/).filter(Boolean).map(Number)
	return (0.2126 * parts[0] + 0.7152 * parts[1] + 0.0722 * parts[2]) / 255
}

const getThemeKey = (): string => {
	const root = document.documentElement
	const theme = root.dataset.theme ?? ''
	const isDarkPreferred = window.matchMedia('(prefers-color-scheme: dark)').matches
	return `${theme}:${root.className}:${isDarkPreferred}`
}

const buildPalette = (): PaletteT => {
	const background = resolveColor('var(--background)')
	const surface = resolveColor('var(--card)')
	const border = resolveColor('var(--border)')
	const text = resolveColor('var(--foreground)')
	const textMuted = resolveColor('var(--muted-foreground)')
	const textFaint = resolveColor('var(--secondary, var(--muted-foreground))')
	const accent = resolveColor('var(--active-accent, var(--foreground))')
	const noteSelected = resolveColor('var(--note-selected, var(--active-accent))')
	const isDark = getLuminance(background) < 0.4
	const fontMonoValue = getComputedStyle(document.documentElement).getPropertyValue('--font-mono').trim()

	return {
		background,
		surface,
		border,
		text,
		textMuted,
		textFaint,
		accent,
		noteSelected,
		// A shade or two below full contrast.
		noteIdle: withAlpha(text, 0.62),
		lineBar: withAlpha(text, 0.22),
		lineBeat: withAlpha(text, 0.11),
		lineCell: withAlpha(text, 0.05),
		lineRow: withAlpha(text, 0.06),
		lineBand: withAlpha(text, 0.16),
		barShade: withAlpha(text, isDark ? 0.03 : 0.025),
		inactiveShade: withAlpha(background, 0.62),
		fontMono: fontMonoValue || 'ui-monospace, monospace',
		isDark
	}
}

export const invalidatePalette = () => {
	cachedPalette = null
	cachedThemeKey = ''
}

export const getPalette = (): PaletteT => {
	const themeKey = getThemeKey()
	const isFresh = cachedPalette !== null && themeKey === cachedThemeKey
	if (isFresh) return cachedPalette as PaletteT

	cachedPalette = buildPalette()
	cachedThemeKey = themeKey
	return cachedPalette
}
