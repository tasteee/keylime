<script lang="ts">
	import SelectControl from './SelectControl.svelte'
	import { useProjectEditor } from '$lib/modules/useProjectEditor'

	const projectEditor = useProjectEditor()
	const scale = $derived(projectEditor.state.project.scale)

	const scaleOptions = [
		{ value: 'Major', label: 'Major' },
		{ value: 'Minor', label: 'Minor' }
	]

	const handleSelect = (value: string) => {
		projectEditor.updateProject({ scale: value })
	}
</script>

<SelectControl label="Scale" value={scale} options={scaleOptions} onValueChange={handleSelect} />
