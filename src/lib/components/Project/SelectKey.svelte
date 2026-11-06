<script lang="ts">
	import SelectControl from './SelectControl.svelte'
	import { useProjectEditor } from '$lib/modules/useProjectEditor'

	const projectEditor = useProjectEditor()
	const project = $derived(projectEditor.state.project)

	const keyNames = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#']
	const keyOptions = keyNames.map((keyName) => ({ value: keyName, label: keyName }))

	const handleSelect = (value: string) => {
		projectEditor.updateProject({ key: value })
	}
</script>

<SelectControl label="Key" labelPlacement="top" value={project.key} options={keyOptions} onValueChange={handleSelect} />
