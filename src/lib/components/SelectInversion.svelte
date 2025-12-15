<script lang="ts">
	import * as Select from '$lib/components/ui/select'
	import { Label } from '$lib/components/ui/label'

	type SelectInversionPropsT = {
		value: number
		onValueChange: (value: string | undefined) => void
	}

	let { value, onValueChange }: SelectInversionPropsT = $props()

	const inversionOptions = [
		{ value: 0, label: 'Root Position' },
		{ value: 1, label: '1st Inversion' },
		{ value: 2, label: '2nd Inversion' },
		{ value: 3, label: '3rd Inversion' }
	]

	const currentInversionLabel = $derived(
		inversionOptions.find((option) => option.value === value)?.label || 'Root Position'
	)
</script>

<div class="InversionSelect herSelect isLabeledRow">
	<Label class="text-sm font-bold">Inversion</Label>
	<Select.Root type="single" {onValueChange} value={value.toString()}>
		<Select.Trigger class="h-8 hover:bg-muted/50 px-2 min-w-[140px] border-none bg-transparent shadow-none focus:ring-0">
			<span class="text-sm">{currentInversionLabel}</span>
		</Select.Trigger>
		<Select.Content>
			{#each inversionOptions as option}
				<Select.Item value={option.value.toString()}>{option.label}</Select.Item>
			{/each}
		</Select.Content>
	</Select.Root>
</div>
