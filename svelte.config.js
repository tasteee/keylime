import cloudflareAdapter from '@sveltejs/adapter-cloudflare'
import staticAdapter from '@sveltejs/adapter-static'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

// GitHub Pages builds set GITHUB_PAGES=true.
// They need a static SPA build served from /keylime.
const isGithubPagesBuild = process.env.GITHUB_PAGES === 'true'
const pagesBasePath = '/keylime'

const cloudflareConfig = cloudflareAdapter({
	platformProxy: { configPath: 'wrangler.toml', persist: true }
})
const staticConfig = staticAdapter({ fallback: 'index.html' })

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: isGithubPagesBuild ? staticConfig : cloudflareConfig,
		paths: { base: isGithubPagesBuild ? pagesBasePath : '' }
	}
}

export default config
