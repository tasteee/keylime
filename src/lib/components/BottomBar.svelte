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

<div class="BottomBar">
	<div class="left">
		<div class="controls-group">
			<SelectVolume />
		</div>

		<div class="controls-group">
			<SelectVelocity />
		</div>

		<div class="controls-group">
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
</div>

<style>
	.BottomBar {
		position: fixed;
		bottom: 0;
		left: 0;
		width: 100%;
		height: var(--bottombar-height);
		padding: 0 32px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		background-color: var(--bar-bg);
		border-top: var(--border-thick);
		z-index: 60;
		gap: 32px;
		box-shadow: 0 -4px 0px var(--color-ink);
	}

	.left {
		display: flex;
		align-items: center;
		gap: 16px;
	}

	.controls-group {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 6px 8px;
		background-color: var(--card);
		border: var(--border-thick);
		border-radius: 0px;
		box-shadow: var(--shadow-hard);
	}
</style>
