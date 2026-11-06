import adapter from '@sveltejs/adapter-static'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

// Keylime is a client-only SPA. It has no server rendering.
// The API is a separate Cloudflare Worker (see /worker).
// BASE_PATH is /keylime on GitHub Pages and empty locally.
const basePath = process.env.BASE_PATH ?? ''

// Zest elements (<z-button>, <z-card>, ...) handle their own keyboard
// and role semantics inside their shadow DOM. The a11y checks below
// only see the host tag, so they are noise for those elements.
const zestElementIgnoredCodes = ['a11y_click_events_have_key_events', 'a11y_no_static_element_interactions']

const isZestElementWarning = (warning) => {
	const isIgnoredCode = zestElementIgnoredCodes.includes(warning.code)
	if (!isIgnoredCode) return false
	const sourceFrame = String(warning.frame ?? '')
	return sourceFrame.includes('<z-')
}

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	compilerOptions: {
		warningFilter: (warning) => !isZestElementWarning(warning)
	},
	kit: {
		adapter: adapter({ fallback: 'index.html' }),
		paths: { base: basePath }
	}
}

export default config
