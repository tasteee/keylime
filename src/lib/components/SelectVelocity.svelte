<script lang="ts">
	import * as Popover from '$lib/components/ui/popover/index.js'
	import SliderVelocity from '$lib/components/SliderVelocity.svelte'
	import output from '$lib/stores/output.svelte'
</script>

<Popover.Root>
	<Popover.Trigger size="small" label="Velocity" value={`${output.minVelocity}-${output.maxVelocity}`} />
	<Popover.Content class="herPopover p-4 w-[300px]">
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
