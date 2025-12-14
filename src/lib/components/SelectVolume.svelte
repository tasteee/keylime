<script lang="ts">
	import * as Popover from '$lib/components/ui/popover/index.js'
	import SliderVolume from '$lib/components/SliderVolume.svelte'
	import Icon from '@iconify/svelte'
	import output from '$lib/stores/output.svelte'
</script>

<Popover.Root>
	<Popover.Trigger
		data-slot="select-trigger"
		class="h-8 hover:bg-muted/50 px-2 rounded-md text-sm inline-flex min-w-[100px] items-center justify-between border-none bg-transparent whitespace-nowrap shadow-none transition-colors focus:ring-0"
	>
		<Icon icon="mingcute:volume-line" class="size-4 mr-2 text-muted-foreground" />
		<span class="text-xs">
			<span class="text-muted-foreground mr-1">Volume</span>
			<span class="font-medium text-foreground">{output.volume}</span>
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
	<Popover.Content class="p-4 w-[300px]">
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
</style>
