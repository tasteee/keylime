<script lang="ts">
	import ValuePopoverButton from '$lib/components/ValuePopoverButton.svelte'
	import ChipSelect from './ChipSelect.svelte'
	import { useProjectEditor } from '$lib/modules/useProjectEditor'
	import { getVoicingLabel } from '$lib/helpers/chordGridLabels'
	import { VOICING_OPTIONS, isVoicingAvailable } from '$lib/music'
	import playbackStore from '$lib/stores/playback.svelte'

	const projectEditor = useProjectEditor()
	const project = $derived(projectEditor.state.project)
	const voicingLabel = $derived(getVoicingLabel(project.voicing))

	// The chord to play as a sample: the selected one, else the first.
	const getSampleChord = (): ProgressionChordT | null => {
		const chords = project.progressionChords.filter((item): item is ProgressionChordT => item.type === 'chord')
		const selectedId = projectEditor.state.selectedProgressionItemId
		const selectedChord = chords.find((chord) => chord.id === selectedId)
		return selectedChord ?? chords[0] ?? null
	}

	const playSample = (voicing: VoicingT) => {
		const sampleChord = getSampleChord()
		if (!sampleChord) return
		playbackStore.playChord(sampleChord, project.octave, voicing)
	}

	const handleSelect = (value: string) => {
		const voicing = value as VoicingT
		projectEditor.updateProject({ voicing })
		playSample(voicing)
	}

	const sampleChord = $derived(getSampleChord())
	const sampleSymbol = $derived(sampleChord ? sampleChord.symbol : '')

	// A drop voicing needs four notes. A triad keeps playing closed.
	const isSampleFallback = $derived.by(() => {
		if (!sampleChord) return false
		const isAvailable = isVoicingAvailable(sampleChord.symbol, project.voicing)
		return !isAvailable
	})

	const fallbackNote = $derived(`${sampleSymbol} has too few notes for ${voicingLabel}, so it plays Closed.`)
</script>

<ValuePopoverButton label="Project voicing" eyebrowLabel="Voicing" valueLabel={voicingLabel}>
	<div class="project-voicing-panel">
		<ChipSelect label="Project voicing" value={project.voicing} options={VOICING_OPTIONS} onSelect={handleSelect} />

		<z-text size="xs" color="muted">Chords without a voicing of their own use this one.</z-text>

		{#if isSampleFallback}
			<z-text size="xs" color="muted">{fallbackNote}</z-text>
		{/if}
	</div>
</ValuePopoverButton>

<style>
	.project-voicing-panel {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-3);
		max-width: 22rem;
	}
</style>
