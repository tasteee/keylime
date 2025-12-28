<script lang="ts">
	import * as Select from '$lib/components/ui/select/index.js'
	import { useProjectEditor } from '$lib/modules/useProjectEditor'

	const projectEditor = useProjectEditor()
	const project = $derived(projectEditor.state.project)

	const handleSelect = (value: string) => {
		projectEditor.updateProject({ key: value })
	}
</script>

<Select.Root type="single" onValueChange={handleSelect} value={project.key}>
	<Select.Trigger size="small" label="Key" value={project.key} />
	<Select.Content>
		<Select.Item value="A">A</Select.Item>
		<Select.Item value="A#">A#</Select.Item>
		<Select.Item value="B">B</Select.Item>
		<Select.Item value="C">C</Select.Item>
		<Select.Item value="C#">C#</Select.Item>
		<Select.Item value="D">D</Select.Item>
		<Select.Item value="D#">D#</Select.Item>
		<Select.Item value="E">E</Select.Item>
		<Select.Item value="F">F</Select.Item>
		<Select.Item value="F#">F#</Select.Item>
		<Select.Item value="G">G</Select.Item>
		<Select.Item value="G#">G#</Select.Item>
	</Select.Content>
</Select.Root>
