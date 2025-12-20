<script lang="ts">
	import * as Select from '$lib/components/ui/select/index.js'
	import output from '../../stores/output.svelte'
</script>

<Select.Root type="single" bind:value={output.type}>
	<Select.Trigger size="small" label="Destination" value={output.type} />
	<Select.Content>
		<Select.Item value="Instrument">Instrument</Select.Item>
		<Select.Item value="MIDI">MIDI</Select.Item>
	</Select.Content>
</Select.Root>
