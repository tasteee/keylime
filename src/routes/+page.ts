import { redirect } from '@sveltejs/kit'
import { base } from '$app/paths'

// The GitHub Pages build has no server hooks, so redirect here.
export const load = () => {
	const isPagesBuild = import.meta.env.VITE_GITHUB_PAGES === 'true'
	if (isPagesBuild) redirect(307, `${base}/auth/login`)
}
