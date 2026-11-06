import { goto } from '$app/navigation'
import { base } from '$app/paths'

// Go to an app path like /dashboard. Adds the base path, which
// is /keylime when the app is hosted on GitHub Pages.
export const goToPath = async (path: string) => {
	await goto(`${base}${path}`)
}

// Turns an app path into a link that works under the base path.
export const buildHref = (path: string): string => `${base}${path}`
