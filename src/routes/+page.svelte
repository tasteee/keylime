<script>
	import QwertyKeyboard from '$lib/components/QwertyKeyboard.svelte';
  import output from '$lib/stores/output.svelte';
	import SelectKey from '$lib/components/SelectKey.svelte';
	import SelectKeymap from '$lib/components/SelectKeymap.svelte';
	import SelectOctave from '$lib/components/SelectOctave.svelte';
	import SelectScale from '$lib/components/SelectScale.svelte';
	import SelectOutputType from '$lib/components/SelectOutputType.svelte';
	import SelectInstrument from '$lib/components/SelectInstrument.svelte';
	import SelectMidiDevice from '$lib/components/SelectMidiDevice.svelte';
	import SelectMidiChannel from '$lib/components/SelectMidiChannel.svelte';
	import SelectChordMode from '$lib/components/SelectChordMode.svelte';
	import SelectVelocity from '$lib/components/SelectVelocity.svelte';

  const isInstrument = $derived(output.type === 'Instrument');
  const isMidi = $derived(output.type === 'MIDI');
  const isMidiDeviceSelected = $derived(isMidi && output.midiDeviceName);
</script>

<div class="page lightTheme">
	<div class="controls">
    <div class="controlsRow">
		<SelectKey />
		<SelectScale />
		<SelectOctave />
    <SelectKeymap />
		<SelectVelocity />
    <!-- <SelectChordMode /> -->
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
	.page {
		display: flex;
		flex-direction: column;
		justify-content: end;
		align-items: center;
		height: 100vh;
		gap: 8px;
		padding: 8px;
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
