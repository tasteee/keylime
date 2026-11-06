<script lang="ts">
	import { SpeakerHigh } from 'phosphor-svelte'
	import output from '$lib/stores/output.svelte'
	import playbackStore from '$lib/stores/playback.svelte'

	const volumeLabel = $derived(String(output.volume))

	$effect(() => {
		const currentVolume = output.volume
		const piano = playbackStore.piano
		const isPianoLoaded = playbackStore.isLoaded && piano
		if (isPianoLoaded) piano.output.setVolume(currentVolume)
	})

	const handleVolumeInput = (event: CustomEvent) => {
		const nextVolume: number = event.detail.value
		output.volume = nextVolume
	}
</script>

<z-popover placement="top-end">
	<z-button slot="trigger" kind="outline" size="sm" aria-label="Volume">
		<SpeakerHigh size={16} />
		{volumeLabel}
	</z-button>
	<z-column gap="sm" class="volumePanel">
		<z-slider label="Volume" min={0} max={100} step={1} value={output.volume} doesShowValue oninput={handleVolumeInput}></z-slider>
	</z-column>
</z-popover>

<style>
	.volumePanel {
		width: 16rem;
	}
</style>
