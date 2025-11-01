<script>
	import * as Select from '$lib/components/ui/select/index.js'
	import mainStore from '../stores/main.svelte.js'

	const handleSelect = (value) => {
		mainStore.selectedKeymap = value
	}
</script>

<Select.Root type="single" onValueChange={handleSelect} value={mainStore.selectedKeymap}>
	<Select.Trigger class="w-[220px]">
		<span>
			<span style="font-weight: 500;">Keymap: </span>
			{mainStore.selectedKeymap}
		</span>
	</Select.Trigger>
	<Select.Content>
		<Select.Item value="rightUp">rightUp</Select.Item>
		<Select.Item value="rightDown">rightDown</Select.Item>
		<Select.Item value="isomorphic">isomorphic</Select.Item>
		<Select.Item value="rightUpTrios">rightUpTrios</Select.Item>
	</Select.Content>
</Select.Root>
