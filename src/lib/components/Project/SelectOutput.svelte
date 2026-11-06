<script lang="ts">
	import store from 'store'
	import { SpeakerHigh } from 'phosphor-svelte'
	import INSTRUMENTS_CONFIG from '$lib/constants/instruments.json'
	import output from '$lib/stores/output.svelte'
	import playbackStore from '$lib/stores/playback.svelte'
	import SelectOutputInstrument from './SelectOutputInstrument.svelte'
	import SelectMidiDevice from './SelectMidiDevice.svelte'
	import SelectMidiChannel from './SelectMidiChannel.svelte'
	import SelectVelocity from './SelectVelocity.svelte'
	import SelectChordPreview from './SelectChordPreview.svelte'

	const TICK_POP_MS = 140

	const isMidi = $derived(output.type === 'MIDI')
	const isMidiDeviceSelected = $derived(isMidi && Boolean(output.midiDeviceName))
	const isMetronomeSliderDisabled = $derived(!output.isMetronomeEnabled)

	const instrumentConfig = $derived(
		INSTRUMENTS_CONFIG.availableInstruments[output.instrument as keyof typeof INSTRUMENTS_CONFIG.availableInstruments]
	)
	const instrumentLabel = $derived(isMidi ? 'MIDI' : (instrumentConfig?.label ?? output.instrument))
	const triggerLabel = $derived(`${instrumentLabel} · ${output.volume}`)

	let isTickPopping = $state(false)
	let tickPopTimer: ReturnType<typeof setTimeout> | undefined

	const iconClassName = $derived(isTickPopping ? 'volume-icon isPopping' : 'volume-icon')

	$effect(() => {
		const currentVolume = output.volume
		const piano = playbackStore.piano
		const isPianoLoaded = playbackStore.isLoaded && piano
		if (isPianoLoaded) piano.output.setVolume(currentVolume)
	})

	$effect(() => {
		store.set('output.isMetronomeEnabled', output.isMetronomeEnabled)
		store.set('output.metronomeVolume', output.metronomeVolume)
	})

	// Pops the icon once for every metronome tick.
	$effect(() => {
		const tickCount = playbackStore.metronomeTickCount
		const hasNotTickedYet = tickCount === 0
		if (hasNotTickedYet) return

		clearTimeout(tickPopTimer)
		isTickPopping = true
		tickPopTimer = setTimeout(() => {
			isTickPopping = false
		}, TICK_POP_MS)
	})

	const handleVolumeInput = (event: CustomEvent) => {
		const nextVolume: number = event.detail.value
		output.volume = nextVolume
	}

	const handleMetronomeToggle = (event: CustomEvent) => {
		const isChecked: boolean = event.detail.checked
		output.isMetronomeEnabled = isChecked
	}

	const handleMetronomeVolumeInput = (event: CustomEvent) => {
		const nextVolume: number = event.detail.value
		output.metronomeVolume = nextVolume
	}
</script>

<z-popover placement="bottom-end">
	<z-button slot="trigger" kind="outline" size="sm" aria-label="Output">
		<span class={iconClassName}>
			<SpeakerHigh size={16} />
		</span>
		{triggerLabel}
	</z-button>

	<z-column gap="md" class="output-panel">
		<SelectOutputInstrument />

		{#if isMidi}
			<SelectMidiDevice />
		{/if}

		{#if isMidiDeviceSelected}
			<SelectMidiChannel />
		{/if}

		<SelectVelocity />

		<z-separator></z-separator>

		<z-slider label="Volume" min={0} max={100} step={1} value={output.volume} doesShowValue oninput={handleVolumeInput}></z-slider>

		<z-switch size="sm" isChecked={output.isMetronomeEnabled} onchange={handleMetronomeToggle}>Metronome</z-switch>
		<z-slider
			label="Metronome volume"
			min={0}
			max={100}
			step={1}
			value={output.metronomeVolume}
			isDisabled={isMetronomeSliderDisabled}
			doesShowValue
			oninput={handleMetronomeVolumeInput}
		></z-slider>

		<z-separator></z-separator>

		<SelectChordPreview />
		<z-text size="xs" color="muted">Press ~ to switch between chord and pattern.</z-text>
	</z-column>
</z-popover>

<style>
	.output-panel {
		width: 18rem;
	}

	.volume-icon {
		display: inline-flex;
		color: inherit;
		transition:
			transform var(--motion-fast) var(--ease-enter),
			color var(--motion-fast) var(--ease-enter);
	}

	.volume-icon.isPopping {
		transform: scale(1.35);
		color: var(--color-primary);
	}
</style>
