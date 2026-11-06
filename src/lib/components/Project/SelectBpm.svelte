<script lang="ts">
	import { useProjectEditor } from '$lib/modules/useProjectEditor'

	const projectEditor = useProjectEditor()
	const bpm = $derived(projectEditor.state.project.bpm)

	const handleBpmChange = (event: CustomEvent) => {
		const nextBpm: number = event.detail.value
		projectEditor.updateProject({ bpm: nextBpm })
	}
</script>

<z-row gap="xs" alignsY="center">
	<z-text size="xs" color="muted" weight={600} class="controlLabel">BPM</z-text>
	<z-number-input value={bpm} min={20} max={300} step={1} size="sm" label="BPM" hasStepperButtons isInline onchange={handleBpmChange}
	></z-number-input>
</z-row>

<style>
	.controlLabel {
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}
</style>
