<script lang="ts">
	import INSTRUMENTS_CONFIG from '../../constants/instruments.json'
	import SelectControl from './SelectControl.svelte'
	import output from '../../stores/output.svelte'

	const MIDI_VALUE = 'MIDI'

	// MIDI first, then the built-in instruments. Piano is the default.
	const builtInEntries = Object.entries(INSTRUMENTS_CONFIG.availableInstruments)
	const builtInOptions = builtInEntries.map(([instrumentKey, config]) => ({
		value: instrumentKey,
		label: config.label
	}))
	const instrumentOptions = [{ value: MIDI_VALUE, label: 'MIDI' }, ...builtInOptions]

	const isMidi = $derived(output.type === 'MIDI')
	const selectedValue = $derived(isMidi ? MIDI_VALUE : output.instrument)

	const handleSelect = (value: string) => {
		const isMidiChoice = value === MIDI_VALUE
		if (isMidiChoice) {
			output.type = 'MIDI'
			return
		}

		output.type = 'Instrument'
		output.instrument = value
	}
</script>

<SelectControl
	label="Instrument"
	labelPlacement="top"
	value={selectedValue}
	options={instrumentOptions}
	onValueChange={handleSelect}
/>
