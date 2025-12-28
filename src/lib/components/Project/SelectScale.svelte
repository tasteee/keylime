<script lang="ts">
	import * as Select from '$lib/components/ui/select/index.js'
	import { useProjectEditor } from '$lib/modules/useProjectEditor'

	const projectEditor = useProjectEditor()
	const scale = $derived(projectEditor.state.project.scale)

	const handleSelect = (value: string) => {
		projectEditor.updateProject({ scale: value })
	}
</script>

<Select.Root type="single" onValueChange={handleSelect} value={scale}>
	<Select.Trigger size="small" label="Scale" value={scale} />
	<Select.Content>
		<Select.Item value="Major">Major</Select.Item>
		<Select.Item value="Minor">Minor</Select.Item>
		<Select.Item value="Harmonic Minor">Harmonic Minor</Select.Item>
	</Select.Content>
</Select.Root>
