<script lang="ts">
	import '@fontsource-variable/saira/wdth-italic.css'
	import '../lib/styles/theme.css'
	import '../lib/styles/global.css'
	import 'overlayscrollbars/overlayscrollbars.css'
	import '../app.css'

	import { OverlayScrollbars, ClickScrollPlugin } from 'overlayscrollbars'
	import { ModeWatcher } from 'mode-watcher'
	import favicon from '$lib/assets/favicon.svg'
	import DialogChordModifier from '$lib/components/Project/DialogChordModifier.svelte'

	let { children } = $props()

	OverlayScrollbars.plugin(ClickScrollPlugin)
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<ModeWatcher />
<DialogChordModifier />

{@render children?.()}
