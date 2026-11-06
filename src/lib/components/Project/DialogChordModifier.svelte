<script lang="ts">
	import { Plus, Minus, ArrowCounterClockwise, Check, SpeakerHigh } from 'phosphor-svelte'
	import { getChordNoteNames } from '$lib/helpers/chordGridLabels'
	import SelectInversion from './SelectInversion.svelte'
	import SelectVoicing from './SelectVoicing.svelte'
	import playbackStore from '$lib/stores/playback.svelte'

	type DialogChordModifierPropsT = {
		isOpen: boolean
		chord: ProgressionChordT
		projectOctave: number
		onClose: () => void
		onSave: (args: { octaveOffset: number; inversion: number; voicing: VoicingT }) => void
	}

	const props: DialogChordModifierPropsT = $props()

	let octaveOffset = $state(Number(props.chord.octaveOffset))
	let inversion = $state(props.chord.inversion)
	let voicing = $state(props.chord.voicing)

	const chordName = $derived(props.chord.symbol)

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
	const noteNames = $derived(getChordNoteNames(shapedChord, props.projectOctave))
	const notesLabel = $derived(`Notes, low to high: ${noteNames.join(', ')}`)

	// Reset local state when the dialog opens with a chord.
	$effect(() => {
		if (!props.isOpen) return
		octaveOffset = props.chord.octaveOffset
		inversion = props.chord.inversion
		voicing = props.chord.voicing
	})

	const playCurrentChord = () => {
		playbackStore.playChord(shapedChord, props.projectOctave)
	}

	const incrementOctave = () => {
		octaveOffset = octaveOffset + 1
		playCurrentChord()
	}

	const decrementOctave = () => {
		octaveOffset = octaveOffset - 1
		playCurrentChord()
	}

	const handleVoicingChange = (value: string | undefined) => {
		if (!value) return
		voicing = value as VoicingT
		playCurrentChord()
	}

	const handleInversionChange = (value: string | undefined) => {
		if (!value) return
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
		voicing = 'closed'
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
			<z-text weight={600}>Octave</z-text>
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

		<z-grid columns="2" gap="md">
			<SelectInversion value={inversion} onValueChange={handleInversionChange} />
			<SelectVoicing value={voicing} symbol={props.chord.symbol} onValueChange={handleVoicingChange} />
		</z-grid>
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
