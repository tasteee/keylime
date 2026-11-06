<script lang="ts">
	import '@tasteee/zest'
	import '@tasteee/zest/ink.css'
	import '@tasteee/zest/fonts.css'
	import '@fontsource-variable/saira/wdth-italic.css'
	import '../app.css'

	import { page } from '$app/stores'
	import { base } from '$app/paths'
	import favicon from '$lib/assets/favicon.svg'
	import PlaybackContextFrame from '$lib/components/PlaybackContextFrame.svelte'
	import BottomBar from '$lib/components/Project/BottomBar.svelte'
	import { setContext } from 'svelte'

	let { children, data } = $props()

	setContext('activeUser', () => data.activeUser)
	setContext('authUser', () => data.authUser)

	const currentPath = $derived($page.url.pathname.replace(base, '') || '/')
	const isRootPath = $derived(currentPath === '/')
	const isAuthPath = $derived(currentPath.startsWith('/auth'))
	const shouldShowBottomBar = $derived(data.isAuthenticated && !isRootPath && !isAuthPath)
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{#if shouldShowBottomBar}
	<z-column class="authLayout">
		<div class="authLayoutContent">
			<PlaybackContextFrame>
				{@render children?.()}
			</PlaybackContextFrame>
		</div>
		<BottomBar />
	</z-column>
{:else}
	<PlaybackContextFrame>
		{@render children?.()}
	</PlaybackContextFrame>
{/if}

<style>
	.authLayout {
		height: 100vh;
		width: 100%;
		overflow: hidden;
	}

	.authLayoutContent {
		flex: 1;
		min-height: 0;
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}
</style>
