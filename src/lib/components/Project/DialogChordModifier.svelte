<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog'
	import * as ButtonGroup from '$lib/components/ui/button-group'
	import { Button } from '$lib/components/ui/button'
	import { Label } from '$lib/components/ui/label'
	import Icon from '@iconify/svelte'
	import SelectInversion from './SelectInversion.svelte'
	import SelectVoicing from './SelectVoicing.svelte'
	import Box from '$lib/components/ui/box.svelte'
	import playbackStore from '$lib/stores/playback.svelte'

	type DialogChordModifierPropsT = {
		isOpen: boolean
		chord: ProgressionChordT
		projectOctave: string
		onClose: () => void
		onSave: (args: { octaveOffset: number; inversion: number; voicing: string }) => void
	}

	const props: DialogChordModifierPropsT = $props()
  console.log('DialogChordModifier props:', props)
	const chordName = $derived(props.chord.symbol)

	// Local state for modifiers
	let octaveOffset = $state(Number(props.chord.octaveOffset))
	let inversion = $state(props.chord.inversion)
	let voicing = $state(props.chord.voicing)

	// Reset local state when dialog opens with new chord
	$effect(() => {
		if (props.isOpen) {
			octaveOffset = props.chord.octaveOffset
			inversion = props.chord.inversion
			voicing = props.chord.voicing
		}
	})

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
		const numValue = parseInt(value, 10)
		inversion = numValue
		playCurrentChord()
	}

	const octaveDisplayValue = $derived(octaveOffset === 0 ? '±0' : octaveOffset > 0 ? `+${octaveOffset}` : `${octaveOffset}`)

	const handleOpenChange = (open: boolean) => {
		if (!open) {
			props.onClose()
		}
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

	const playCurrentChord = () => {
		const modifiedChord: ProgressionChordT = {
			...props.chord,
			octaveOffset,
			inversion,
			voicing
		}
		playbackStore.playChord(modifiedChord, props.projectOctave)
	}
</script>

<Dialog.Root open={props.isOpen} onOpenChange={handleOpenChange}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title class="text-3xl">{chordName}</Dialog.Title>
		</Dialog.Header>

		<div class="space-y-4 pt-4 mb-4">
			<!-- Octave Offset -->
			<div class="OctaveModifier gap-3 flex items-center justify-between">
				<Label class="text-sm font-bold">Octave</Label>
				<div class="gap-2 flex items-center">
					<div class="octaveDisplay text-lg font-mono min-w-[3rem] text-center">
						{octaveDisplayValue}
					</div>

					<ButtonGroup.Root aria-label="Octave controls" class="h-fit">
						<Button kind="outline" isIcon onclick={decrementOctave}>
							<Icon icon="mingcute:minimize-line" class="size-4" />
						</Button>
						<Button kind="outline" isIcon onclick={incrementOctave}>
							<Icon icon="mingcute:add-line" class="size-4" />
						</Button>
					</ButtonGroup.Root>
				</div>
			</div>

			<Box gap="16px">
				<SelectInversion value={inversion} onValueChange={handleInversionChange} />
				<SelectVoicing value={voicing} onValueChange={handleVoicingChange} />
			</Box>
		</div>

		<Dialog.Footer>
			<Button isFullWidth kind="outline" onclick={handleReset}>
				<Icon icon="mingcute:refresh-2-line" class="size-4" />
				Reset
			</Button>
			<Button isFullWidth onclick={handleConfirm}>
				<Icon icon="mingcute:check-line" class="size-4" />
				Confirm
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
