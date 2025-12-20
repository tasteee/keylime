<script lang="ts">
	import * as Select from '$lib/components/ui/select/index.js'
	import projectStore from '$lib/stores/project.svelte'

	const handleSelect = (value: string) => {
		projectStore.scale = value
		projectStore.markDirty()
	}
</script>

<Select.Root type="single" onValueChange={handleSelect} value={projectStore.scale}>
	<Select.Trigger size="small" label="Scale" value={projectStore.scale} />
	<Select.Content>
		<Select.Item value="Major">Major</Select.Item>
		<Select.Item value="Minor">Minor</Select.Item>
		<Select.Item value="Harmonic Minor">Harmonic Minor</Select.Item>
	</Select.Content>
</Select.Root>
