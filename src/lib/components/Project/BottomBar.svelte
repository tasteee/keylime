<script lang="ts">
	import SelectOutputType from '$lib/components/Project/SelectOutputType.svelte'
	import SelectInstrument from '$lib/components/Project/SelectInstrument.svelte'
	import SelectMidiDevice from '$lib/components/Project/SelectMidiDevice.svelte'
	import SelectMidiChannel from '$lib/components/Project/SelectMidiChannel.svelte'
	import SelectVelocity from '$lib/components/Project/SelectVelocity.svelte'
	import SelectVolume from '$lib/components/Project/SelectVolume.svelte'
	import SelectChordPreview from '$lib/components/Project/SelectChordPreview.svelte'
	import output from '$lib/stores/output.svelte'

	const isInstrument = $derived(output.type === 'Instrument')
	const isMidi = $derived(output.type === 'MIDI')
	const isMidiDeviceSelected = $derived(isMidi && Boolean(output.midiDeviceName))
</script>

<z-column class="bottomBar">
	<z-separator></z-separator>
	<z-row insetX="lg" insetY="sm" alignsX="between" alignsY="center" gap="lg" isFullWidth>
		<z-row gap="lg" alignsY="center" doesWrap>
			<SelectChordPreview />
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
		</z-row>

		<SelectVolume />
	</z-row>
</z-column>

<style>
	.bottomBar {
		flex-shrink: 0;
		background: var(--card);
	}
</style>
