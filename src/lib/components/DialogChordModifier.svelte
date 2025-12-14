<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog'
	import * as Select from '$lib/components/ui/select'
	import * as ButtonGroup from '$lib/components/ui/button-group'
	import { Button } from '$lib/components/ui/button'
	import { Input } from '$lib/components/ui/input'
	import { Label } from '$lib/components/ui/label'
	import Icon from '@iconify/svelte'
	import { chordModifierStore } from '$lib/stores/chordModifier.svelte'

	type VoicingItemT = { value: VoicingT; label: string }

	const isOpen = $derived(chordModifierStore.state.isOpen)
	const currentChord = $derived(chordModifierStore.currentChord)
	const octaveOffset = $derived(chordModifierStore.state.octaveOffset)
	const inversion = $derived(chordModifierStore.state.inversion)
	const voicing = $derived(chordModifierStore.state.voicing)
	const chordName = $derived(currentChord?.symbol ?? 'Chord')

	const voicingOptions: VoicingItemT[] = [
		{ value: 'closed', label: 'Closed' },
		{ value: 'open', label: 'Open' },
		{ value: 'drop2', label: 'Drop 2' },
		{ value: 'drop3', label: 'Drop 3' },
		{ value: 'drop2and4', label: 'Drop 2&4' },
		{ value: 'spread', label: 'Spread' },
		{ value: 'shell', label: 'Shell' },
		{ value: 'tonal-lefthand', label: 'Lefthand' },
		{ value: 'tonal-triads', label: 'Triads' }
	]

	const inversionOptions = [
		{ value: 0, label: 'Root Position' },
		{ value: 1, label: '1st Inversion' },
		{ value: 2, label: '2nd Inversion' },
		{ value: 3, label: '3rd Inversion' }
	]

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
	const currentVoicingLabel = $derived(voicingOptions.find((option) => option.value === voicing)?.label || 'Closed')

	const currentInversionLabel = $derived(
		inversionOptions.find((option) => option.value === inversion)?.label || 'Root Position'
	)

	const handleOpenChange = (open: boolean) => {
		if (!open) chordModifierStore.closeDialog()
	}
</script>

<Dialog.Root open={isOpen} onOpenChange={handleOpenChange}>
	<Dialog.Content class="w-80">
		<Dialog.Header>
			<Dialog.Title>{chordName}</Dialog.Title>
			<Dialog.Description>Modify chord properties</Dialog.Description>
		</Dialog.Header>

		<div class="space-y-4 pt-4">
			<!-- Octave Offset -->
			<div class="OctaveModifier gap-3 flex items-center justify-between">
				<Label class="text-sm font-medium">Octave</Label>
				<div class="gap-2 flex items-center">
					<div class="octaveDisplay text-sm font-mono min-w-[3rem] text-center">
						{octaveDisplayValue}
					</div>
					<ButtonGroup.Root aria-label="Octave controls" class="h-fit">
						<Button variant="outline" size="icon" onclick={incrementOctave}>
							<Icon icon="mingcute:add-line" class="size-4" />
						</Button>
						<Button variant="outline" size="icon" onclick={decrementOctave}>
							<Icon icon="mingcute:minimize-line" class="size-4" />
						</Button>
					</ButtonGroup.Root>
				</div>
			</div>

			<!-- Inversion Select -->
			<div class="InversionSelect space-y-2">
				<Label class="text-sm font-medium">Inversion</Label>
				<Select.Root type="single" onValueChange={handleInversionChange} value={inversion.toString()}>
					<Select.Trigger class="w-full">
						<span class="text-sm">{currentInversionLabel}</span>
					</Select.Trigger>
					<Select.Content>
						{#each inversionOptions as option}
							<Select.Item value={option.value.toString()}>{option.label}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</div>

			<!-- Voicing Select -->
			<div class="VoicingSelect space-y-2">
				<Label class="text-sm font-medium">Voicing</Label>
				<Select.Root type="single" onValueChange={handleVoicingChange} value={voicing}>
					<Select.Trigger class="w-full">
						<span class="text-sm">{currentVoicingLabel}</span>
					</Select.Trigger>
					<Select.Content>
						{#each voicingOptions as option}
							<Select.Item value={option.value}>{option.label}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</div>
		</div>
	</Dialog.Content>
</Dialog.Root>
