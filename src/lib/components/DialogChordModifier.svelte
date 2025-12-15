<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog'
	import * as ButtonGroup from '$lib/components/ui/button-group'
	import { Button } from '$lib/components/ui/button'
	import { Label } from '$lib/components/ui/label'
	import Icon from '@iconify/svelte'
	import { chordModifierStore } from '$lib/stores/chordModifier.svelte'
	import SelectInversion from './SelectInversion.svelte'
	import SelectVoicing from './SelectVoicing.svelte'

	const isOpen = $derived(chordModifierStore.state.isOpen)
	const currentChord = $derived(chordModifierStore.currentChord)
	const octaveOffset = $derived(chordModifierStore.state.octaveOffset)
	const inversion = $derived(chordModifierStore.state.inversion)
	const voicing = $derived(chordModifierStore.state.voicing)
	const chordName = $derived(currentChord?.symbol ?? 'Chord')

	const incrementOctave = () => {
		chordModifierStore.updateOctaveOffset(octaveOffset + 1)
	}

	const decrementOctave = () => {
		chordModifierStore.updateOctaveOffset(octaveOffset - 1)
	}

	const handleVoicingChange = (value: string | undefined) => {
		if (!value) return
		chordModifierStore.updateVoicing(value as VoicingT)
	}

	const handleInversionChange = (value: string | undefined) => {
		if (!value) return
		const numValue = parseInt(value, 10)
		chordModifierStore.updateInversion(numValue)
	}

	const octaveDisplayValue = $derived(octaveOffset === 0 ? '±0' : octaveOffset > 0 ? `+${octaveOffset}` : `${octaveOffset}`)

	const handleOpenChange = (open: boolean) => {
		if (!open) chordModifierStore.discardChanges()
	}

	const handleReset = () => {
		chordModifierStore.resetModifiers()
	}

	const handleConfirm = () => {
		chordModifierStore.confirmChanges()
	}
</script>

<Dialog.Root open={isOpen} onOpenChange={handleOpenChange}>
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
						<Button variant="outline" size="icon" onclick={decrementOctave}>
							<Icon icon="mingcute:minimize-line" class="size-4" />
						</Button>
						<Button variant="outline" size="icon" onclick={incrementOctave}>
							<Icon icon="mingcute:add-line" class="size-4" />
						</Button>
					</ButtonGroup.Root>
				</div>
			</div>

			<SelectInversion value={inversion} onValueChange={handleInversionChange} />

			<SelectVoicing value={voicing} onValueChange={handleVoicingChange} />
		</div>

		<Dialog.Footer>
			<Button variant="outline" onclick={handleReset} class="flex-1">
				<Icon icon="mingcute:refresh-2-line" class="size-4" />
				Reset
			</Button>
			<Button onclick={handleConfirm} class="flex-1">
				<Icon icon="mingcute:check-line" class="size-4" />
				Confirm
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
