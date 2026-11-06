<script lang="ts">
	import { Play, Stop } from 'phosphor-svelte'
	import { getContext } from 'svelte'
	import { useProjectEditor } from '$lib/modules/useProjectEditor'
	import { calculateStartTimes } from '$lib/helpers/progression'

	const projectEditor = useProjectEditor()
	const playbackContext = getContext<PlaybackContextT>('playback')

	const isPlaying = $derived(playbackContext.state.isPlaying)
	const buttonLabel = $derived(isPlaying ? 'Stop' : 'Play')

	const handleToggle = async () => {
		if (isPlaying) {
			playbackContext.stop()
			return
		}

		const project = projectEditor.state.project
		const patternActiveDurationBeats = project.patternDurationBars * 4
		const patternActiveSignals = project.patternSignals.filter((signal) => {
			return signal.startTime < patternActiveDurationBeats
		})
		const progressionWithStartTimes = calculateStartTimes({ items: project.progressionChords })

		await playbackContext.perform({
			id: project.id,
			bpm: project.bpm,
			octave: project.octave,
			progressionChords: progressionWithStartTimes,
			patternSignals: patternActiveSignals,
			patternSignalRows: project.patternSignalRows,
			patternDurationBars: patternActiveDurationBeats / 4,
			doesPatternResetOnChordChange: project.doesPatternResetOnChordChange,
			minVelocity: project.minVelocity,
			maxVelocity: project.maxVelocity
		})
	}
</script>

<z-button tone="primary" size="sm" onclick={handleToggle} aria-label={buttonLabel}>
	{#if isPlaying}
		<Stop size={16} weight="fill" />
	{:else}
		<Play size={16} weight="fill" />
	{/if}
</z-button>
