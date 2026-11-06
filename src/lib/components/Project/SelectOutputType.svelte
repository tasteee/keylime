<script lang="ts">
	import SelectControl from './SelectControl.svelte'
	import output from '../../stores/output.svelte'

	const outputTypeOptions = [
		{ value: 'Instrument', label: 'Instrument' },
		{ value: 'MIDI', label: 'MIDI' }
	]

	const handleSelect = (value: string) => {
		output.type = value
	}
</script>

<SelectControl label="Destination" value={output.type} options={outputTypeOptions} onValueChange={handleSelect} />
