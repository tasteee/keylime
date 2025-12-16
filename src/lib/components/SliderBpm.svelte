<script lang="ts">
	import { Slider } from '$lib/components/ui/slider/index.js'
	import projectStore from '$lib/stores/project.svelte'

	const value = $derived(projectStore.bpm)

	const handleValueChange = (bpmValue: number) => {
		if (bpmValue !== undefined) {
			projectStore.bpm = bpmValue
			projectStore.markDirty()
		}
	}
</script>

<div class="SliderBpm gap-3 flex w-full items-center">
	<span class="text-sm text-muted-foreground">20</span>
	<Slider type="single" {value} max={300} min={20} step={1} class="flex-1" onValueChange={handleValueChange} />
	<span class="text-sm text-muted-foreground">300</span>
</div>
