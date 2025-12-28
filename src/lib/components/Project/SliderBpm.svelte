<script lang="ts">
	import { Slider } from '$lib/components/ui/slider/index.js'
	import { useProjectEditor } from '$lib/modules/useProjectEditor'

	const projectEditor = useProjectEditor()
	const value = $derived(projectEditor.state.project.bpm)

	const handleValueChange = (bpmValue: number) => {
		if (bpmValue !== undefined) {
			projectEditor.updateProject({ bpm: bpmValue })
		}
	}
</script>

<div class="SliderBpm gap-3 flex w-full items-center">
	<span class="text-sm text-muted-foreground">20</span>
	<Slider type="single" {value} max={300} min={20} step={1} class="flex-1" onValueChange={handleValueChange} />
	<span class="text-sm text-muted-foreground">300</span>
</div>
