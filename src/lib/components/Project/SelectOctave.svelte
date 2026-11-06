<script lang="ts">
	import AffixField from '$lib/components/AffixField.svelte'
	import { useProjectEditor } from '$lib/modules/useProjectEditor'

	const projectEditor = useProjectEditor()
	const project = $derived(projectEditor.state.project)

	const octaves = [0, 1, 2, 3, 4, 5, 6, 7, 8]

	const handleSelect = (event: Event) => {
		const select = event.currentTarget as HTMLSelectElement
		const octaveNumber = parseInt(select.value, 10)
		const isValidNumber = !isNaN(octaveNumber)
		if (!isValidNumber) return
		projectEditor.updateProject({ octave: octaveNumber })
	}
</script>

<AffixField prefix="Octave">
	<select aria-label="Octave" value={String(project.octave)} onchange={handleSelect}>
		{#each octaves as octave}
			<option value={String(octave)}>{octave}</option>
		{/each}
	</select>
</AffixField>
