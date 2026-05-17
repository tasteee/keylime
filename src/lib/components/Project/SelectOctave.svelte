<script lang="ts">
	import * as Select from '$lib/components/ui/select/index.js'
	import { useProjectEditor } from '$lib/modules/useProjectEditor'

	const projectEditor = useProjectEditor()
	const project = $derived(projectEditor.state.project)

	const handleSelect = (value: string | undefined) => {
		if (!value) return
		const octaveNumber = parseInt(value, 10)
		projectEditor.updateProject({ octave: String(octaveNumber) })
	}
</script>

<Select.Root type="single" onValueChange={handleSelect} value={project.octave}>
	<Select.Trigger size="small" label="Base Octave" value={project.octave.toString()} />
	<Select.Content>
		<Select.Item value="0">0</Select.Item>
		<Select.Item value="1">1</Select.Item>
		<Select.Item value="2">2</Select.Item>
		<Select.Item value="3">3</Select.Item>
		<Select.Item value="4">4</Select.Item>
		<Select.Item value="5">5</Select.Item>
		<Select.Item value="6">6</Select.Item>
		<Select.Item value="7">7</Select.Item>
		<Select.Item value="8">8</Select.Item>
	</Select.Content>
</Select.Root>
