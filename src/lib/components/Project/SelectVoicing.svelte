<script lang="ts">
	import SelectControl from './SelectControl.svelte'

	type SelectVoicingPropsT = {
		value: VoicingT | string
		onValueChange: (value: string | undefined) => void
	}

	const props: SelectVoicingPropsT = $props()

	const voicingOptions = [
		{ value: 'closed', label: 'Closed' },
		{ value: 'open', label: 'Open' },
		{ value: 'drop2', label: 'Drop 2' },
		{ value: 'drop3', label: 'Drop 3' },
		{ value: 'drop2and4', label: 'Drop 2&4' },
		{ value: 'spread', label: 'Spread' },
		{ value: 'shell', label: 'Shell' },
		{ value: 'tonal-lefthand', label: 'Lefthand' },
		{ value: 'tonal-triads', label: 'Triads' }
	]
</script>

<SelectControl label="Voicing" labelPlacement="top" isFullWidth value={props.value} options={voicingOptions} onValueChange={props.onValueChange} />
