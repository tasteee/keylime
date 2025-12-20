<script lang="ts">
	import * as Popover from '$lib/components/ui/popover/index.js'
	import SliderBpm from '$lib/components/Project/SliderBpm.svelte'
	import Icon from '@iconify/svelte'
	import projectStore from '$lib/stores/project.svelte'
</script>

<Popover.Root>
	<Popover.Trigger size="small" label="BPM" value={projectStore.bpm.toString()} />
	<Popover.Content class="herPopover p-4 w-[300px]">
		<div class="bpmSliderContainer">
			<SliderBpm />
		</div>
	</Popover.Content>
</Popover.Root>

<style>
	.bpmSliderContainer {
		display: flex;
		flex-direction: column;
		gap: 12px;
		align-items: center;
		width: 100%;
	}
</style>
