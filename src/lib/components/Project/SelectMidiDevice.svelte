<script lang="ts">
	import SelectControl from './SelectControl.svelte'
	import output from '../../stores/output.svelte'
	import { onMount } from 'svelte'
	import { browser } from '$app/environment'
	import { WebMidi } from 'webmidi'

	type MidiDeviceT = {
		name: string
		id: string
	}

	let devices = $state<MidiDeviceT[]>([])

	const deviceOptions = $derived(devices.map((device) => ({ value: device.name, label: device.name })))

	const handleSelect = (value: string) => {
		output.midiDeviceName = value
	}

	onMount(() => {
		if (!browser) return

		WebMidi.enable()
			.then(() => {
				WebMidi.outputs.forEach((midiOutput) => {
					devices.push({ name: midiOutput.name, id: midiOutput.id })
				})

				const hasDevices = devices.length > 0
				if (hasDevices && !output.midiDeviceName) output.midiDeviceName = devices[0].name
			})
			.catch((error) => console.error('Could not enable WebMIDI:', error))
	})
</script>

<SelectControl label="Device" value={output.midiDeviceName} options={deviceOptions} onValueChange={handleSelect} />
