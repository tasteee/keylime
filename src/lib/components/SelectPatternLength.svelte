<script lang="ts">
	import * as Select from '$lib/components/ui/select/index.js'
	import mainStore from '$lib/stores/main.svelte'

	const patternLengthOptions = [1, 2, 4, 8, 16, 32]

	const handleSelect = (value: string) => {
		const parsedValue = parseInt(value, 10)
		const isValidNumber = !isNaN(parsedValue)
		if (!isValidNumber) return
		mainStore.patternLengthBars = parsedValue
	}
</script>

<Select.Root type="single" onValueChange={handleSelect} value={mainStore.patternLengthBars.toString()}>
	<Select.Trigger class="w-[140px]">
		<span>
			<span style="font-weight: 500;">Pattern: </span>
			{mainStore.patternLengthBars}
			{mainStore.patternLengthBars === 1 ? 'Bar' : 'Bars'}
		</span>
	</Select.Trigger>
	<Select.Content>
		{#each patternLengthOptions as option}
			<Select.Item value={option.toString()}>
				{option}
				{option === 1 ? 'Bar' : 'Bars'}
			</Select.Item>
		{/each}
	</Select.Content>
</Select.Root>
