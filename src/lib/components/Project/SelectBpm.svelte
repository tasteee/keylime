<script lang="ts">
	import { useProjectEditor } from '$lib/modules/useProjectEditor'

	const projectEditor = useProjectEditor()
	const bpm = $derived(projectEditor.state.project.bpm)

	const handleBpmChange = (event: CustomEvent) => {
		const nextBpm: number = event.detail.value
		projectEditor.updateProject({ bpm: nextBpm })
	}
</script>

<z-number-input value={bpm} min={20} max={300} step={1} size="sm" label="BPM" value-suffix="bpm" hasStepperButtons isInline onchange={handleBpmChange}
></z-number-input>
