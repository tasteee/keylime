<script lang="ts">
	import * as Popover from '$lib/components/ui/popover/index.js'
	import SliderVolume from '$lib/components/SliderVolume.svelte'
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
	<Popover.Trigger
		data-slot="select-trigger"
		class="h-8 hover:bg-muted/50 px-2 min-w-[90px] border-none bg-transparent shadow-none focus:ring-0"
		style="max-height: 36px;"
	>
		<span class="herMenuTriggerDisplay">
			<Icon icon="mingcute:volume-line" class="herMenuTriggerLabel" style="scale: 1.5;" />
			<span style="width: 30px; font-weight: 400;">{output.volume}</span>
		</span>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
			class="lucide lucide-chevron-down h-4 w-4 ml-1 opacity-50"
		>
			<path d="m6 9 6 6 6-6" />
		</svg>
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
		border: 2px solid black;
	}
</style>
