<script lang="ts">
	import { useProjectEditor } from '$lib/modules/useProjectEditor'

	const projectEditor = useProjectEditor()
	// Zest's generated types do not list value-suffix yet.
	const suffixAttributes = { 'value-suffix': 'bpm' }
	const bpm = $derived(projectEditor.state.project.bpm)

	const handleBpmChange = (event: CustomEvent) => {
		const nextBpm: number = event.detail.value
		projectEditor.updateProject({ bpm: nextBpm })
	}
</script>

<z-number-input value={bpm} min={20} max={300} step={1} size="sm" label="BPM" hasStepperButtons isInline {...suffixAttributes} onchange={handleBpmChange}
></z-number-input>
