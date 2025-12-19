<script lang="ts">
	import * as Select from '$lib/components/ui/select/index.js'
	import output from '../stores/output.svelte'
	import { onMount } from 'svelte'
	import { browser } from '$app/environment'
	import { WebMidi } from 'webmidi'

	let channels = ['All', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16']

	const handleSelect = (value: string) => {
		output.midiChannel = value
	}

	onMount(() => {
		if (!browser) return
		const outputDevice = WebMidi.getOutputByName(output.midiDeviceName)
		if (outputDevice && !output.midiChannel) output.midiChannel = 'All'
	})
</script>

<Select.Root type="single" onValueChange={handleSelect} value={output.midiChannel}>
	<Select.Trigger size="small" label="Channel" value={output.midiChannel} />
	<Select.Content>
		{#each channels as channel}
			<Select.Item value={channel}>{channel}</Select.Item>
		{/each}
	</Select.Content>
</Select.Root>
