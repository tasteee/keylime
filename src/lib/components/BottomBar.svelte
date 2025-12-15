<script lang="ts">
	import SelectOutputType from '$lib/components/SelectOutputType.svelte'
	import SelectInstrument from '$lib/components/SelectInstrument.svelte'
	import SelectMidiDevice from '$lib/components/SelectMidiDevice.svelte'
	import SelectMidiChannel from '$lib/components/SelectMidiChannel.svelte'
	import SelectVelocity from '$lib/components/SelectVelocity.svelte'
	import SelectVolume from '$lib/components/SelectVolume.svelte'
	import output from '$lib/stores/output.svelte'

	const isInstrument = $derived(output.type === 'Instrument')
	const isMidi = $derived(output.type === 'MIDI')
	const isMidiDeviceSelected = $derived(isMidi && output.midiDeviceName)
</script>

<div class="BottomBar herPanel progressionPanel">
	<div class="herPanelTitleBox">
		<span class="herPanelTitle">Output</span>
	</div>

	<div class="left">
		<SelectVolume />

		<SelectVelocity />

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

<style>
	.left {
		display: flex;
		align-items: center;
		gap: 16px;
	}

	.controls-group {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 0px 8px;
		height: 36px;
		/* background-color: var(--card); */
		/* border: var(--border-thick); */
		border-radius: 0px;
		/* box-shadow: var(--shadow-hard); */
	}
</style>
