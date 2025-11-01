<script>
	import * as Select from '$lib/components/ui/select/index.js'
	import mainStore from '../stores/main.svelte.js'

	const handleSelect = (value) => {
		mainStore.selectedOctave = value
	}
</script>

<Select.Root type="single" onValueChange={handleSelect} value={mainStore.selectedOctave}>
	<Select.Trigger class="w-[120px]">
		<span>
			<span style="font-weight: 500;">Octave: </span>
			{mainStore.selectedOctave}
		</span>
	</Select.Trigger>
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
