<script lang="ts">
	import { Plus, Minus, ArrowCounterClockwise, Check } from 'phosphor-svelte'
	import SelectInversion from './SelectInversion.svelte'
	import SelectVoicing from './SelectVoicing.svelte'
	import playbackStore from '$lib/stores/playback.svelte'

	type DialogChordModifierPropsT = {
		isOpen: boolean
		chord: ProgressionChordT
		projectOctave: string
		onClose: () => void
		onSave: (args: { octaveOffset: number; inversion: number; voicing: string }) => void
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

	// Reset local state when the dialog opens with a chord.
	$effect(() => {
		if (!props.isOpen) return
		octaveOffset = props.chord.octaveOffset
		inversion = props.chord.inversion
		voicing = props.chord.voicing
	})

	const playCurrentChord = () => {
		const modifiedChord: ProgressionChordT = {
			...props.chord,
			octaveOffset,
			inversion,
			voicing
		}
		playbackStore.playChord(modifiedChord, props.projectOctave)
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
			<SelectVoicing value={voicing} onValueChange={handleVoicingChange} />
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
	.octaveDisplay {
		min-width: 3rem;
		text-align: center;
		font-family: var(--font-mono);
	}
</style>
