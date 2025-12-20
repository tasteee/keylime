<script lang="ts">
	import { Slider } from '$lib/components/ui/slider/index.js'
	import output from '$lib/stores/output.svelte'

	const value = $derived(output.volume)

	const handleValueChange = (volumeValue: number) => {
		if (volumeValue !== undefined) output.volume = volumeValue
	}
</script>

<div class="SliderVolume gap-3 flex w-full items-center">
	<span class="text-sm text-muted-foreground">0</span>
	<Slider type="single" {value} max={100} min={0} step={1} class="flex-1" onValueChange={handleValueChange} />
	<span class="text-sm text-muted-foreground">100</span>
</div>

<style>
	.SliderVolume {
		/* border: 2px solid black; */
	}
</style>
