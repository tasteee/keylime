<script lang="ts">
	import SelectControl from './SelectControl.svelte'
	import { getVoicingOptions, VOICING_OPTIONS } from '$lib/music'

	type SelectVoicingPropsT = {
		value: VoicingT
		// The chord being voiced. Voicings it has too few notes for are left out.
		symbol?: string
		onValueChange: (value: string | undefined) => void
	}

	const props: SelectVoicingPropsT = $props()

	const voicingOptions = $derived(props.symbol ? getVoicingOptions(props.symbol) : VOICING_OPTIONS)
</script>

<SelectControl label="Voicing" labelPlacement="top" isFullWidth value={props.value} options={voicingOptions} onValueChange={props.onValueChange} />
