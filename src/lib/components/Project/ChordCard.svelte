<script lang="ts">
	import * as icons from 'phosphor-svelte'
	import * as svelte from 'svelte'
	import * as editor from '$lib/modules/useProjectEditor'
	import * as chordColors from '$lib/helpers/chordColors'
	import output from '$lib/stores/output.svelte'
	import playbackStore from '$lib/stores/playback.svelte'
	import ChordSymbolDisplay from './ChordSymbolDisplay.svelte'
	import './chordCard.css'

	type ChordCardPropsT = {
		chord: ChordT
		onOpenModifier: (chord: ChordT) => void
	}

	const props: ChordCardPropsT = $props()
	const projectEditor = editor.useProjectEditor()
	const symbol = $derived(props.chord.symbol)
	const chordColor = $derived(chordColors.getChordColor({ symbol }))
	const previewLabel = $derived(`Preview ${symbol}`)
	const addLabel = $derived(`Add ${symbol} to progression`)
	let isHeld = $state(false)
	let releaseTimer: ReturnType<typeof setTimeout> | undefined
	const isSounding = $derived(playbackStore.currentlyPlayingChordId === props.chord.id)
	const isPatternPreview = $derived(isHeld && output.chordPreviewMode === 'pattern')
	const isPlaying = $derived(isPatternPreview || isSounding)

	const addChord = () => {
		const progressionChord = { ...props.chord, id: crypto.randomUUID() }
		projectEditor.addProgressionChord(progressionChord)
	}

	const startPreview = () => {
		if (isHeld) return
		isHeld = true
		window.addEventListener('blur', stopPreview, { once: true })
		void playbackStore.previewChord(props.chord, projectEditor.state.project)
	}

	const stopPreview = () => {
		if (!isHeld) return
		isHeld = false
		clearTimeout(releaseTimer)
		window.removeEventListener('blur', stopPreview)
		playbackStore.stopChordPreview()
	}

	const handlePointerDown = (event: PointerEvent) => {
		const isPrimaryPress = event.isPrimary && event.button === 0
		if (!isPrimaryPress) return
		const button = event.currentTarget
		const isButton = button instanceof HTMLButtonElement
		if (!isButton) return
		button.setPointerCapture(event.pointerId)
		startPreview()
	}

	const isPreviewKey = (event: KeyboardEvent): boolean => {
		return event.key === 'Enter' || event.key === ' '
	}

	const handleKeyDown = (event: KeyboardEvent) => {
		const shouldPreview = isPreviewKey(event)
		if (!shouldPreview) return
		event.stopPropagation()
		event.preventDefault()
		if (event.repeat) return
		startPreview()
	}

	const handleKeyUp = (event: KeyboardEvent) => {
		const shouldStop = isPreviewKey(event)
		if (!shouldStop) return
		event.preventDefault()
		stopPreview()
	}

	const handleClick = (event: MouseEvent) => {
		const isAssistiveActivation = event.detail === 0
		if (!isAssistiveActivation) return
		startPreview()
		const project = projectEditor.state.project
		const millisecondsPerBeat = 60_000 / project.bpm
		const patternBeats = project.patternDurationBars * 4
		const patternDuration = patternBeats * millisecondsPerBeat
		releaseTimer = setTimeout(stopPreview, patternDuration)
	}

	const handleAddKey = (event: KeyboardEvent) => {
		const isSpace = event.key === ' '
		if (isSpace) event.stopPropagation()
	}

	const openModifier = (event: MouseEvent) => {
		event.preventDefault()
		stopPreview()
		props.onOpenModifier(props.chord)
	}

	svelte.onDestroy(stopPreview)
</script>

<div class="chordCard" data-chord-color={chordColor} class:isPlaying>
	<button
		type="button"
		class="previewChord"
		aria-label={previewLabel}
		onpointerdown={handlePointerDown}
		onlostpointercapture={stopPreview}
		onpointerup={stopPreview}
		onpointercancel={stopPreview}
		onblur={stopPreview}
		onkeydown={handleKeyDown}
		onkeyup={handleKeyUp}
		onclick={handleClick}
		oncontextmenu={openModifier}
	>
		<ChordSymbolDisplay {symbol} size="lg" />
		{#if isPlaying}<icons.SpeakerHigh aria-hidden="true" />{/if}
	</button>
	<z-tooltip content={addLabel} placement="top">
		<z-button kind="ghost" size="sm" aria-label={addLabel} onclick={addChord} onkeydown={handleAddKey}>
			<icons.Plus aria-hidden="true" />
		</z-button>
	</z-tooltip>
</div>
