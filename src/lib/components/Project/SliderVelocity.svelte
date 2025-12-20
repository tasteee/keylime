<script lang="ts">
	import { Slider } from '$lib/components/ui/slider/index.js'
	import output from '$lib/stores/output.svelte'

	const value = $derived([output.minVelocity, output.maxVelocity])

	const handleValueChange = (args: number[]) => {
		const minValue = args[0]
		const maxValue = args[1]

		if (minValue !== undefined) {
			output.minVelocity = minValue
		}

		if (maxValue !== undefined) {
			output.maxVelocity = maxValue
		}
	}
</script>

<div class="gap-3 flex w-full items-center">
	<span class="text-sm text-muted-foreground">0</span>
	<Slider type="multiple" {value} max={127} min={1} step={1} class="flex-1" onValueChange={handleValueChange} />
	<span class="text-sm text-muted-foreground">127</span>
</div>
