<script lang="ts">
	import * as Popover from '$lib/components/ui/popover/index.js';
	import SliderVelocity from '$lib/components/SliderVelocity.svelte';
	import output from '$lib/stores/output.svelte';
</script>

<Popover.Root>
	<Popover.Trigger
		data-slot="select-trigger"
		class="inline-flex h-9 w-[180px] items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1"
	>
		<span>
			<span style="font-weight: 500;">Velocity: </span>
			{output.minVelocity}-{output.maxVelocity}
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
			class="lucide lucide-chevron-down h-4 w-4"
		>
			<path d="m6 9 6 6 6-6" />
		</svg>
	</Popover.Trigger>
	<Popover.Content class="w-[300px] p-4">
		<div class="velocitySliderContainer">
			<SliderVelocity />
		</div>
	</Popover.Content>
</Popover.Root>

<style>
	.velocitySliderContainer {
		display: flex;
		flex-direction: column;
		gap: 12px;
		align-items: center;
		width: 100%;
	}
</style>
