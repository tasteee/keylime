<script lang="ts">
	import * as Select from '$lib/components/ui/select'
	import { Label } from '$lib/components/ui/label'

	type VoicingItemT = { value: VoicingT; label: string }

	type SelectVoicingPropsT = {
		value: VoicingT
		onValueChange: (value: string | undefined) => void
	}

	let { value, onValueChange }: SelectVoicingPropsT = $props()

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

	const currentVoicingLabel = $derived(voicingOptions.find((option) => option.value === value)?.label || 'Closed')
</script>

<div class="VoicingSelect herSelect isLabeledRow">
	<Label class="text-sm font-bold">Voicing</Label>
	<Select.Root type="single" {onValueChange} {value}>
		<Select.Trigger class="h-8 hover:bg-muted/50 px-2 min-w-[140px] border-none bg-transparent shadow-none focus:ring-0">
			<span class="text-sm">{currentVoicingLabel}</span>
		</Select.Trigger>
		<Select.Content>
			{#each voicingOptions as option}
				<Select.Item value={option.value}>{option.label}</Select.Item>
			{/each}
		</Select.Content>
	</Select.Root>
</div>
