import { browser } from '$app/environment'

export type ThemeT = 'dark' | 'light'

const THEME_STORAGE_KEY = 'keylime-theme'
const DEFAULT_THEME: ThemeT = 'dark'

const readStoredTheme = (): ThemeT => {
	if (!browser) return DEFAULT_THEME
	try {
		const storedTheme = localStorage.getItem(THEME_STORAGE_KEY)
		const isValidTheme = storedTheme === 'dark' || storedTheme === 'light'
		return isValidTheme ? storedTheme : DEFAULT_THEME
	} catch {
		return DEFAULT_THEME
	}
}

const writeStoredTheme = (theme: ThemeT) => {
	try {
		localStorage.setItem(THEME_STORAGE_KEY, theme)
	} catch {
		// Storage can be blocked. The theme still applies for this visit.
	}
}

const applyTheme = (theme: ThemeT) => {
	if (!browser) return
	document.documentElement.dataset.theme = theme
}

const themeState = $state<{ theme: ThemeT }>({ theme: readStoredTheme() })

export const themeStore = {
	get theme(): ThemeT {
		return themeState.theme
	},
	init: () => applyTheme(themeState.theme),
	setTheme: (theme: ThemeT) => {
		themeState.theme = theme
		writeStoredTheme(theme)
		applyTheme(theme)
	}
}
