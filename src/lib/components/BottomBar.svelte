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
	const titleClasses = 'outputTitle'
</script>

<div class="BottomBar progressionPanel">
	<div class="left">
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
	<div class="right">
		<SelectVolume />
	</div>
</div>

<style>
	.BottomBar {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		padding: 8px 16px;
		/* height: 36px; */
		width: 100%;
		flex-shrink: 0;
		border-top: 1px solid var(--n-03);
		background: var(--n-01);
	}

	.left,
	.right {
		display: flex;
		align-items: center;
		justify-content: space-between;
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

	.outputTitle {
		font-weight: 700;
		font-size: 16px;
		color: var(--foreground);
		letter-spacing: 0px;
		font-family: var(--font-display);
	}
</style>
