<script lang="ts">
	import INSTRUMENTS_CONFIG from '../constants/instruments.json'
	import * as Select from '$lib/components/ui/select/index.js'
	import output from '../stores/output.svelte'
	import { onMount } from 'svelte'
	import { browser } from '$app/environment'
	import { WebMidi } from 'webmidi'

	type MidiDeviceT = {
		name: string
		id: string
	}

	let devices = $state<MidiDeviceT[]>([])

	const handleSelect = (value: string) => {
		output.midiDeviceName = value
	}

	onMount(() => {
		if (!browser) return

		WebMidi.enable()
			.then(() => {
				WebMidi.outputs.forEach((output) => {
					devices.push({ name: output.name, id: output.id })
				})

				if (devices.length > 0 && !output.midiDeviceName) {
					output.midiDeviceName = devices[0].name
				}
			})
			.catch((err) => console.error('Could not enable WebMIDI:', err))
	})
</script>

<Select.Root type="single" onValueChange={handleSelect} value={output.midiDeviceName}>
	<Select.Trigger>
		<span>
			<span style="font-weight: 500;">Device: </span>
			{output.midiDeviceName}
		</span>
	</Select.Trigger>
	<Select.Content>
		{#each devices as device}
			<Select.Item value={device.name}>{device.name}</Select.Item>
		{/each}
	</Select.Content>
</Select.Root>
