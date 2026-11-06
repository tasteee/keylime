import adapter from '@sveltejs/adapter-static'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

// Keylime is a client-only SPA. It has no server rendering.
// The API is a separate Cloudflare Worker (see /worker).
// BASE_PATH is /keylime on GitHub Pages and empty locally.
const basePath = process.env.BASE_PATH ?? ''

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter({ fallback: 'index.html' }),
		paths: { base: basePath }
	}
}

export default config
