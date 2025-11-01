<script lang="ts">
	import INSTRUMENTS_CONFIG from '../constants/instruments.json'
	import * as Select from '$lib/components/ui/select/index.js'
  import output from '../stores/output.svelte'

	const handleSelect = (value: string) => {
		output.instrument = value
	}
</script>

<Select.Root type="single" onValueChange={handleSelect} value={output.instrument}>
	<Select.Trigger class="w-[180px]">
		<span>
			<span style="font-weight: 500;">Instrument: </span>
			{output.instrument}
		</span>
	</Select.Trigger>
	<Select.Content>
		{#each Object.keys(INSTRUMENTS_CONFIG) as instrument}
			<Select.Item value={instrument.value}>{instrument.label}</Select.Item>
		{/each}
	</Select.Content>
</Select.Root>
