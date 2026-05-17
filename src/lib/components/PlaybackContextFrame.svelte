<script lang="ts">
	import { setContext, onMount } from 'svelte'
	import { browser } from '$app/environment'
	import playbackStore from '$lib/stores/playback.svelte'

	const props = $props()

	const context: PlaybackContextT = {
		state: playbackStore as unknown as PlaybackStateT,
		load: playbackStore.load,
		playNote: playbackStore.playNote,
		playChord: playbackStore.playChord,
		stopNote: playbackStore.stopNote,
		stopChord: playbackStore.stopChord,
		perform: playbackStore.perform,
		update: playbackStore.update,
		stop: playbackStore.stop,
		pausePerformance: playbackStore.pausePerformance,
		stopPerformance: playbackStore.stopPerformance
	}

	setContext('playback', context)

	onMount(() => {
		if (!browser) return
		playbackStore.load()
	})
</script>

{@render props.children()}
