<script lang="ts">
	import * as Select from '$lib/components/ui/select/index.js'
	import mainStore from '../stores/main.svelte.js'

	const handleSelect = (value: string) => {
		mainStore.selectedKey = value
	}
</script>

<Select.Root type="single" onValueChange={handleSelect} value={mainStore.selectedKey}>
	<Select.Trigger>
		<span>
			<span style="font-weight: 500;">Key: </span>
			{mainStore.selectedKey}
		</span>
	</Select.Trigger>
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
