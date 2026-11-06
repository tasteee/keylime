<script lang="ts">
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
	const isMidiDeviceSelected = $derived(isMidi && Boolean(output.midiDeviceName))
</script>

<z-column gap="lg" alignsY="end" isFullHeight inset="lg" class="keyboardPage">
	<z-column gap="sm" isFullWidth>
		<z-row gap="lg" doesWrap alignsY="center">
			<SelectKey />
			<SelectScale />
			<SelectOctave />
			<SelectKeymap />
			<SelectVelocity />
		</z-row>

		<z-row gap="lg" doesWrap alignsY="center">
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
	</z-column>

	<QwertyKeyboard layout="standard" />
</z-column>

<style>
	.keyboardPage {
		height: 100vh;
	}
</style>
