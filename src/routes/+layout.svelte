<script lang="ts">
	import '../styles/variables.css'
	import '@fontsource-variable/saira/wdth-italic.css'
	import '../lib/styles/theme.css'
	import '../lib/styles/global.css'
	import 'overlayscrollbars/overlayscrollbars.css'
	import '../app.css'
	import '../lib/styles/shared.css'
	import '../lib/styles/animations.css'

	import { OverlayScrollbars, ClickScrollPlugin } from 'overlayscrollbars'
	import { ModeWatcher } from 'mode-watcher'
	import { page } from '$app/stores'
	import favicon from '$lib/assets/favicon.svg'
	import DialogChordModifier from '$lib/components/Project/DialogChordModifier.svelte'
	import PlaybackContextFrame from '$lib/components/PlaybackContextFrame.svelte'
	import BottomBar from '$lib/components/Project/BottomBar.svelte'

	let { children, data } = $props()

	OverlayScrollbars.plugin(ClickScrollPlugin)

	const currentPath = $derived($page.url.pathname)
	const isRootPath = $derived(currentPath === '/')
	const isAuthPath = $derived(currentPath.startsWith('/auth'))
	const shouldShowBottomBar = $derived(data.isAuthenticated && !isRootPath && !isAuthPath)
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<ModeWatcher />

{#if shouldShowBottomBar}
	<div class="authLayoutContainer">
		<div class="authLayoutContent">
			<PlaybackContextFrame>
				{@render children?.()}
			</PlaybackContextFrame>
		</div>
		<BottomBar />
	</div>
{:else}
	<PlaybackContextFrame>
		{@render children?.()}
	</PlaybackContextFrame>
{/if}

<style>
	.authLayoutContainer {
		display: flex;
		flex-direction: column;
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
