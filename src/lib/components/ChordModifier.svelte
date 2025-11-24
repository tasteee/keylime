<script lang="ts">
	import * as ContextMenu from '$lib/components/ui/context-menu'
	import * as Select from '$lib/components/ui/select'
	import * as ButtonGroup from '$lib/components/ui/button-group'
	import { Button } from '$lib/components/ui/button'
	import { Input } from '$lib/components/ui/input'
	import { Label } from '$lib/components/ui/label'
	import Icon from '@iconify/svelte'

	type ChordModifierPropsT = {
		octaveOffset: number
		inversion: number
		voicing: VoicingT
		minVelocity: number
		maxVelocity: number
		onOctaveOffsetChange: (value: number) => void
		onInversionChange: (value: number) => void
		onVoicingChange: (value: VoicingT) => void
		onMinVelocityChange: (value: number) => void
		onMaxVelocityChange: (value: number) => void
		children: any
	}

	const props: ChordModifierPropsT = $props()

	const voicingOptions: { value: VoicingT; label: string }[] = [
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
		props.onOctaveOffsetChange(props.octaveOffset + 1)
	}

	const decrementOctave = () => {
		props.onOctaveOffsetChange(props.octaveOffset - 1)
	}

	const handleVoicingChange = (value: string | undefined) => {
		if (!value) return
		props.onVoicingChange(value as VoicingT)
	}

	const handleInversionChange = (value: string | undefined) => {
		if (!value) return
		const numValue = parseInt(value, 10)
		props.onInversionChange(numValue)
	}

	const handleMinVelocityInput = (event: Event) => {
		const target = event.target as HTMLInputElement
		const value = parseInt(target.value, 10)
		if (isNaN(value)) return
		const clampedValue = Math.max(0, Math.min(127, value))
		props.onMinVelocityChange(clampedValue)
	}

	const handleMaxVelocityInput = (event: Event) => {
		const target = event.target as HTMLInputElement
		const value = parseInt(target.value, 10)
		if (isNaN(value)) return
		const clampedValue = Math.max(0, Math.min(127, value))
		props.onMaxVelocityChange(clampedValue)
	}

	const octaveDisplayValue = $derived(
		props.octaveOffset === 0 ? '±0' : props.octaveOffset > 0 ? `+${props.octaveOffset}` : `${props.octaveOffset}`
	)

	const currentVoicingLabel = $derived(voicingOptions.find((option) => option.value === props.voicing)?.label || 'Closed')

	const currentInversionLabel = $derived(
		inversionOptions.find((option) => option.value === props.inversion)?.label || 'Root Position'
	)
</script>

<ContextMenu.Root>
	<ContextMenu.Trigger>
		{@render props.children()}
	</ContextMenu.Trigger>

	<ContextMenu.Content class="w-80">
		<div class="space-y-4 p-4">
			<!-- Octave Offset -->
			<div class="OctaveModifier gap-3 flex items-center justify-between">
				<Label class="text-sm font-medium">Octave</Label>
				<div class="gap-2 flex items-center">
					<div class="octaveDisplay text-sm font-mono min-w-[3rem] text-center">
						{octaveDisplayValue}
					</div>
					<ButtonGroup.Root orientation="vertical" aria-label="Octave controls" class="h-fit">
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
				<Select.Root type="single" onValueChange={handleInversionChange} value={props.inversion.toString()}>
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
				<Select.Root type="single" onValueChange={handleVoicingChange} value={props.voicing}>
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

			<!-- Velocity Modifier -->
			<div class="velocityModifier space-y-2">
				<Label class="text-sm font-medium">Min / Max Velocity</Label>
				<div class="gap-2 flex items-center">
					<Input
						type="number"
						class="minVelocityInput flex-1"
						value={props.minVelocity}
						oninput={handleMinVelocityInput}
						min="0"
						max="127"
					/>
					<span class="text-muted-foreground text-sm">-</span>
					<Input
						type="number"
						class="maxVelocityInput flex-1"
						value={props.maxVelocity}
						oninput={handleMaxVelocityInput}
						min="0"
						max="127"
					/>
				</div>
			</div>
		</div>
	</ContextMenu.Content>
</ContextMenu.Root>
