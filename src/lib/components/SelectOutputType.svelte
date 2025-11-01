<script lang="ts">
	import * as Select from '$lib/components/ui/select/index.js'
	import mainStore from '../stores/main.svelte'
  import output from '../stores/output.svelte'

	const handleSelect = (value: string) => {
		output.type = value
	}
</script>

<Select.Root type="single" onValueChange={handleSelect} value={output.type}>
	<Select.Trigger class="w-[180px]">
		<span>
			<span style="font-weight: 500;">Output: </span>
			{output.type}
		</span>
	</Select.Trigger>
	<Select.Content>
		<Select.Item value="Instrument">Instrument</Select.Item>
		<Select.Item value="MIDI">MIDI</Select.Item>
	</Select.Content>
</Select.Root>
