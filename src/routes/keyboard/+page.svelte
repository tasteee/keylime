<script>
	import QwertyKeyboard from '$lib/components/Keyboard/QwertyKeyboard.svelte'
	import output from '$lib/stores/output.svelte'
	import SelectKey from '$lib/components/Project/SelectKey.svelte'
	import SelectKeymap from '$lib/components/Keyboard/SelectKeymap.svelte'
	import SelectOctave from '$lib/components/Project/SelectOctave.svelte'
	import SelectScale from '$lib/components/Project/SelectScale.svelte'
	import SelectOutputType from '$lib/components/Project/SelectOutputType.svelte'
	import SelectInstrument from '$lib/components/Project/SelectInstrument.svelte'
	import SelectMidiDevice from '$lib/components/Project/SelectMidiDevice.svelte'
	import SelectMidiChannel from '$lib/components/Project/SelectMidiChannel.svelte'
	import SelectVelocity from '$lib/components/Project/SelectVelocity.svelte'

	const isInstrument = $derived(output.type === 'Instrument')
	const isMidi = $derived(output.type === 'MIDI')
	const isMidiDeviceSelected = $derived(isMidi && output.midiDeviceName)
</script>

<div class="app lightTheme">
	<div class="controls">
		<div class="controlsRow">
			<SelectKey />
			<SelectScale />
			<SelectOctave />
			<SelectKeymap />
			<SelectVelocity />
		</div>

		<div class="controlsRow">
			<SelectOutputType />

			{#if isInstrument}
				<SelectInstrument />
			{/if}

			{#if isMidi}
				<SelectMidiDevice />
			{/if}

			{#if isMidiDeviceSelected}
				<SelectMidiChannel />
			{/if}
		</div>
	</div>
	<QwertyKeyboard layout="standard" />
</div>

<style>
	.app {
		display: flex;
		flex-direction: column;
		justify-content: end;
		align-items: center;
		height: 100vh;
		gap: 16px;
	}

	.controls {
		display: flex;
		flex-direction: column;
		gap: 8px;
		width: 100%;
	}

	.controlsRow {
		width: 100%;
		display: flex;
		gap: 8px;
	}
</style>
