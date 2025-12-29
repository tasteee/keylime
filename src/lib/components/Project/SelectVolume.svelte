<script lang="ts">
	import * as Popover from '$lib/components/ui/popover/index.js'
	import SliderVolume from '$lib/components/Project/SliderVolume.svelte'
	import Icon from '@iconify/svelte'
	import output from '$lib/stores/output.svelte'
	import playbackStore from '$lib/stores/playback.svelte'

	$effect(() => {
		const currentVolume = output.volume
		const isPianoLoaded = playbackStore.isLoaded && playbackStore.piano
		if (isPianoLoaded) playbackStore.piano.output.setVolume(currentVolume)
	})
</script>

<Popover.Root>
	<Popover.Trigger color="brand" size="small" value={output.volume.toString()}>
		{#snippet label()}
			<Icon icon="mingcute:volume-line" />
		{/snippet}
	</Popover.Trigger>
	<Popover.Content class="herPopover p-4 w-[300px]">
		<div class="volumeSliderContainer">
			<SliderVolume />
		</div>
	</Popover.Content>
</Popover.Root>

<style>
	.volumeSliderContainer {
		display: flex;
		flex-direction: column;
		gap: 12px;
		align-items: center;
		width: 100%;
	}

	.herPopover {
		border: 1px solid var(--n-03);
	}
</style>
