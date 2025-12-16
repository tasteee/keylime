<script lang="ts">
	import * as Select from '$lib/components/ui/select/index.js'
	import output from '../stores/output.svelte'
</script>

<Select.Root type="single" bind:value={output.type}>
	<Select.Trigger
		size="sm"
		class="SelectOutputType herSelectTrigger h-8 hover:bg-muted/50 px-2 min-w-[100px] border-none bg-transparent shadow-none focus:ring-0"
	>
		<span class="herMenuTriggerDisplay">
			<span class="herMenuTriggerLabel">Destination</span>
			<span class="herMenuTriggerValue">{output.type}</span>
		</span>
	</Select.Trigger>
	<Select.Content>
		<Select.Item value="Instrument">Instrument</Select.Item>
		<Select.Item value="MIDI">MIDI</Select.Item>
	</Select.Content>
</Select.Root>
