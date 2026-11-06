<script lang="ts">
	import SelectControl from './SelectControl.svelte'
	import { useProjectEditor } from '$lib/modules/useProjectEditor'

	const projectEditor = useProjectEditor()
	const project = $derived(projectEditor.state.project)

	const octaveOptions = [0, 1, 2, 3, 4, 5, 6, 7, 8].map((octave) => ({ value: String(octave), label: String(octave) }))

	const handleSelect = (value: string) => {
		const octaveNumber = parseInt(value, 10)
		const isValidNumber = !isNaN(octaveNumber)
		if (!isValidNumber) return
		projectEditor.updateProject({ octave: String(octaveNumber) })
	}
</script>

<SelectControl label="Octave" value={String(project.octave)} options={octaveOptions} onValueChange={handleSelect} />
