<script lang="ts">
	import * as Select from '$lib/components/ui/select'

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

<Select.Root type="single" {onValueChange} value={value.toString()}>
	<Select.Trigger isFullWidth size="small" label="Inversion" value={currentInversionLabel} />
	<Select.Content>
		{#each inversionOptions as option}
			<Select.Item value={option.value.toString()}>{option.label}</Select.Item>
		{/each}
	</Select.Content>
</Select.Root>
