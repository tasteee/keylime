<script lang="ts">
	import SelectControl from './SelectControl.svelte'
	import output from '../../stores/output.svelte'
	import { onMount } from 'svelte'
	import { browser } from '$app/environment'
	import { WebMidi } from 'webmidi'

	const channelNames = ['All', ...Array.from({ length: 16 }, (_, index) => String(index + 1))]
	const channelOptions = channelNames.map((channelName) => ({ value: channelName, label: channelName }))

	const handleSelect = (value: string) => {
		output.midiChannel = value
	}

	onMount(() => {
		if (!browser) return
		const outputDevice = WebMidi.getOutputByName(output.midiDeviceName)
		if (outputDevice && !output.midiChannel) output.midiChannel = 'All'
	})
</script>

<SelectControl label="Channel" value={output.midiChannel} options={channelOptions} onValueChange={handleSelect} />
