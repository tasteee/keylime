<script lang="ts">
	import INSTRUMENTS_CONFIG from '../../constants/instruments.json'
	import SelectControl from './SelectControl.svelte'
	import output from '../../stores/output.svelte'

	const instrumentEntries = Object.entries(INSTRUMENTS_CONFIG.availableInstruments)
	const instrumentOptions = instrumentEntries.map(([instrumentKey, config]) => ({
		value: instrumentKey,
		label: config.label
	}))

	const handleSelect = (value: string) => {
		output.instrument = value
	}
</script>

<SelectControl label="Instrument" value={output.instrument} options={instrumentOptions} onValueChange={handleSelect} />
