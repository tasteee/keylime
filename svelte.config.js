import adapter from '@sveltejs/adapter-netlify';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter(),
		alias: {
			// Convex functions live under src/convex (see convex.json). This alias
			// lets app code import the generated API as `$convex/_generated/api`.
			$convex: './src/convex'
		}
	}
};

export default config;
