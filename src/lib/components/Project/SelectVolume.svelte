<script lang="ts">
	import store from 'store'
	import { SpeakerHigh } from 'phosphor-svelte'
	import output from '$lib/stores/output.svelte'
	import playbackStore from '$lib/stores/playback.svelte'

	const TICK_POP_MS = 140

	const volumeLabel = $derived(String(output.volume))
	const isMetronomeSliderDisabled = $derived(!output.isMetronomeEnabled)

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

<z-popover placement="top-end">
	<z-button slot="trigger" kind="outline" size="sm" aria-label="Volume">
		<span class={iconClassName}>
			<SpeakerHigh size={16} />
		</span>
		{volumeLabel}
	</z-button>

	<z-column gap="md" class="volume-panel">
		<z-slider label="Volume" min={0} max={100} step={1} value={output.volume} doesShowValue oninput={handleVolumeInput}></z-slider>

		<z-separator></z-separator>

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
	</z-column>
</z-popover>

<style>
	.volume-panel {
		width: 16rem;
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
