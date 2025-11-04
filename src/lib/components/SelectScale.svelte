<script>
	import * as Select from '$lib/components/ui/select/index.js';
	import mainStore from '../stores/main.svelte.js';

	const handleSelect = (value) => {
		mainStore.selectedScale = value;
	};
</script>

<Select.Root type="single" onValueChange={handleSelect} value={mainStore.selectedScale}>
	<Select.Trigger class="w-[180px]">
		<span>
			<span style="font-weight: 500;">Scale: </span>
			{mainStore.selectedScale}
		</span>
	</Select.Trigger>
	<Select.Content>
		<Select.Item value="Major">Major</Select.Item>
		<Select.Item value="Minor">Minor</Select.Item>
		<Select.Item value="Harmonic Minor">Harmonic Minor</Select.Item>
	</Select.Content>
</Select.Root>
