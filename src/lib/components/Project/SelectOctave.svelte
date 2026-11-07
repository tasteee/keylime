<script lang="ts">
	import { useProjectEditor } from '$lib/modules/useProjectEditor'

	const projectEditor = useProjectEditor()
	const project = $derived(projectEditor.state.project)

	// z-select has no value-prefix, so each option carries the word
	// itself. The closed select then reads "Octave 3".
	const OCTAVES = [0, 1, 2, 3, 4, 5, 6, 7, 8]

	const octaveOptions = OCTAVES.map((octave) => {
		return { value: String(octave), label: `Octave ${octave}` }
	})

	const octaveValue = $derived(String(project.octave))

	const handleChange = (event: CustomEvent) => {
		const octaveNumber = parseInt(event.detail.value, 10)
		const isValidNumber = !isNaN(octaveNumber)
		if (!isValidNumber) return
		projectEditor.updateProject({ octave: octaveNumber })
	}
</script>

<z-select value={octaveValue} options={octaveOptions} label="Octave" size="sm" isInline onchange={handleChange}></z-select>
