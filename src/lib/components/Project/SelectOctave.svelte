<script lang="ts">
	import { useProjectEditor } from '$lib/modules/useProjectEditor'

	const projectEditor = useProjectEditor()
	const project = $derived(projectEditor.state.project)

	const octaveOptions = [0, 1, 2, 3, 4, 5, 6, 7, 8].map((octave) => ({ value: String(octave), label: String(octave) }))

	const handleChange = (event: CustomEvent) => {
		const octaveNumber = parseInt(event.detail.value, 10)
		const isValidNumber = !isNaN(octaveNumber)
		if (!isValidNumber) return
		projectEditor.updateProject({ octave: octaveNumber })
	}
</script>

<z-select
	value={String(project.octave)}
	options={octaveOptions}
	label="Octave"
	value-prefix="Octave"
	size="sm"
	isInline
	onchange={handleChange}
></z-select>
