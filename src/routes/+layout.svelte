<script lang="ts">
	import '../lib/styles/global.css'
	import '../app.css'
	import { ModeWatcher } from 'mode-watcher'
	import favicon from '$lib/assets/favicon.svg'
	import DialogChordModifier from '$lib/components/DialogChordModifier.svelte'

	let { children } = $props()
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<ModeWatcher />
<DialogChordModifier />

{@render children?.()}
