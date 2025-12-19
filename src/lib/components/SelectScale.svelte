<script lang="ts">
	import * as Select from '$lib/components/ui/select/index.js'
	import mainStore from '../stores/main.svelte.js'

	const handleSelect = (value: string) => {
		mainStore.selectedScale = value
	}
</script>

<Select.Root type="single" onValueChange={handleSelect} value={mainStore.selectedScale}>
	<Select.Trigger size="small" label="Scale" value={mainStore.selectedScale} />
	<Select.Content>
		<Select.Item value="Major">Major</Select.Item>
		<Select.Item value="Minor">Minor</Select.Item>
		<Select.Item value="Harmonic Minor">Harmonic Minor</Select.Item>
	</Select.Content>
</Select.Root>
