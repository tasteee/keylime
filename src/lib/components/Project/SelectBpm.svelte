<script lang="ts">
	import AffixField from '$lib/components/AffixField.svelte'
	import { useProjectEditor } from '$lib/modules/useProjectEditor'

	const MIN_BPM = 20
	const MAX_BPM = 300

	const projectEditor = useProjectEditor()
	const bpm = $derived(projectEditor.state.project.bpm)

	const handleBpmChange = (event: Event) => {
		const input = event.currentTarget as HTMLInputElement
		const nextBpm = input.valueAsNumber
		const isValidNumber = !isNaN(nextBpm)
		if (!isValidNumber) return

		const clampedBpm = Math.min(MAX_BPM, Math.max(MIN_BPM, Math.round(nextBpm)))
		input.value = String(clampedBpm)
		projectEditor.updateProject({ bpm: clampedBpm })
	}
</script>

<AffixField suffix="bpm">
	<input class="bpm-input" type="number" aria-label="BPM" min={MIN_BPM} max={MAX_BPM} step={1} value={bpm} onchange={handleBpmChange} />
</AffixField>

<style>
	.bpm-input {
		width: 3ch;
		text-align: right;
		appearance: textfield;
	}

	.bpm-input::-webkit-inner-spin-button,
	.bpm-input::-webkit-outer-spin-button {
		appearance: none;
		margin: 0;
	}
</style>
