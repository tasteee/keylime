<script lang="ts">
	import { Plus, Minus, ArrowCounterClockwise, Check, SpeakerHigh } from 'phosphor-svelte'
	import { getChordNoteNames, getVoicingLabel } from '$lib/helpers/chordGridLabels'
	import ChipSelect from './ChipSelect.svelte'
	import { getVoicingOptions } from '$lib/music'
	import playbackStore from '$lib/stores/playback.svelte'

	type DialogChordModifierPropsT = {
		isOpen: boolean
		chord: ProgressionChordT
		projectOctave: number
		// Used when the chord has no voicing of its own.
		projectVoicing: VoicingT
		onClose: () => void
		// voicing null means "follow the project".
		onSave: (args: { octaveOffset: number; inversion: number; voicing: VoicingT | null }) => void
	}

	// The chip value for "no voicing of its own".
	const PROJECT_VOICING_VALUE = 'project'

	const props: DialogChordModifierPropsT = $props()

	let octaveOffset = $state(Number(props.chord.octaveOffset))
	let inversion = $state(props.chord.inversion)
	let voicing = $state(props.chord.voicing)

	const chordName = $derived(props.chord.symbol)

	const inversionOptions = [
		{ value: '0', label: 'Root' },
		{ value: '1', label: '1st' },
		{ value: '2', label: '2nd' },
		{ value: '3', label: '3rd' }
	]

	// The project's voicing comes first, then every voicing the
	// chord has enough notes for.
	const projectVoicingLabel = $derived(`Project · ${getVoicingLabel(props.projectVoicing)}`)
	const projectVoicingOption = $derived({ value: PROJECT_VOICING_VALUE, label: projectVoicingLabel })
	const chordVoicingOptions = $derived(getVoicingOptions(props.chord.symbol))
	const voicingOptions = $derived([projectVoicingOption, ...chordVoicingOptions])
	const voicingValue = $derived(voicing ?? PROJECT_VOICING_VALUE)
	const inversionValue = $derived(String(inversion))

	const octaveDisplayValue = $derived.by(() => {
		if (octaveOffset === 0) return '±0'
		if (octaveOffset > 0) return `+${octaveOffset}`
		return String(octaveOffset)
	})

	const shapedChord = $derived({
		...props.chord,
		octaveOffset,
		inversion,
		voicing
	})

	// Lowest note first, so inversions read as a new bass note.
	const noteNames = $derived(getChordNoteNames(shapedChord, props.projectOctave, props.projectVoicing))
	const notesLabel = $derived(`Notes, low to high: ${noteNames.join(', ')}`)

	// Reset local state when the dialog opens with a chord.
	$effect(() => {
		if (!props.isOpen) return
		octaveOffset = props.chord.octaveOffset
		inversion = props.chord.inversion
		voicing = props.chord.voicing
	})

	const playCurrentChord = () => {
		playbackStore.playChord(shapedChord, props.projectOctave, props.projectVoicing)
	}

	const incrementOctave = () => {
		octaveOffset = octaveOffset + 1
		playCurrentChord()
	}

	const decrementOctave = () => {
		octaveOffset = octaveOffset - 1
		playCurrentChord()
	}

	const handleVoicingSelect = (value: string) => {
		const isProjectVoicing = value === PROJECT_VOICING_VALUE
		const ownVoicing = isProjectVoicing ? null : (value as VoicingT)
		voicing = ownVoicing
		playCurrentChord()
	}

	const handleInversionSelect = (value: string) => {
		inversion = parseInt(value, 10)
		playCurrentChord()
	}

	const handleDialogClose = () => {
		if (!props.isOpen) return
		props.onClose()
	}

	const handleReset = () => {
		octaveOffset = 0
		inversion = 0
		voicing = null
		playCurrentChord()
	}

	const handleConfirm = () => {
		props.onSave({ octaveOffset, inversion, voicing })
		props.onClose()
	}
</script>

<z-dialog isOpen={props.isOpen} heading={chordName} description="Shape how this chord sounds." onclose={handleDialogClose}>
	<z-column gap="lg" insetY="xs">
		<z-row alignsX="between" alignsY="center" gap="md" class="shapePreview">
			<z-column gap="xs">
				<z-text size="xs" weight={600} color="muted">Notes, low to high</z-text>
				<z-row gap="md" alignsY="center" aria-label={notesLabel} class="shapeNotes">
					{#each noteNames as noteName (noteName)}
						<z-text size="lg" weight={600} color="strong">{noteName}</z-text>
					{/each}
				</z-row>
			</z-column>

			<z-button kind="outline" size="sm" onclick={playCurrentChord}>
				<SpeakerHigh size={16} />
				Listen
			</z-button>
		</z-row>

		<z-row alignsX="between" alignsY="center">
			<z-text size="sm" weight={600}>Octave</z-text>
			<z-row gap="sm" alignsY="center">
				<z-text weight={600} class="octaveDisplay">{octaveDisplayValue}</z-text>
				<z-button-group>
					<z-button kind="outline" size="sm" onclick={decrementOctave} aria-label="Octave down">
						<Minus size={14} weight="bold" />
					</z-button>
					<z-button kind="outline" size="sm" onclick={incrementOctave} aria-label="Octave up">
						<Plus size={14} weight="bold" />
					</z-button>
				</z-button-group>
			</z-row>
		</z-row>

		<ChipSelect label="Inversion" value={inversionValue} options={inversionOptions} onSelect={handleInversionSelect} />
		<ChipSelect label="Voicing" value={voicingValue} options={voicingOptions} onSelect={handleVoicingSelect} />
	</z-column>

	<z-row slot="footer" gap="sm" alignsX="end">
		<z-button kind="outline" onclick={handleReset}>
			<ArrowCounterClockwise size={16} />
			Reset
		</z-button>
		<z-button tone="primary" onclick={handleConfirm}>
			<Check size={16} weight="bold" />
			Confirm
		</z-button>
	</z-row>
</z-dialog>

<style>
	.shapePreview {
		padding: var(--spacing-3) var(--spacing-4);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		background: var(--color-neutral-1);
	}

	.octaveDisplay {
		min-width: 3rem;
		text-align: center;
		font-family: var(--font-mono);
	}
</style>
