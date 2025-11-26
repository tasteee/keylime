<script lang="ts">
	import * as Select from '$lib/components/ui/select/index.js'
	import mainStore from '$lib/stores/main.svelte'

	const progressionLengthOptions = [1, 2, 4, 8, 16, 32]

	const handleSelect = (value: string) => {
		const parsedValue = parseInt(value, 10)
		const isValidNumber = !isNaN(parsedValue)
		if (!isValidNumber) return
		mainStore.progressionLengthBars = parsedValue
	}
</script>

<Select.Root type="single" onValueChange={handleSelect} value={mainStore.progressionLengthBars.toString()}>
	<Select.Trigger class="w-[180px]">
		<span>
			<span style="font-weight: 500;">Progression: </span>
			{mainStore.progressionLengthBars}
			{mainStore.progressionLengthBars === 1 ? 'Bar' : 'Bars'}
		</span>
	</Select.Trigger>
	<Select.Content>
		{#each progressionLengthOptions as option}
			<Select.Item value={option.toString()}>
				{option}
				{option === 1 ? 'Bar' : 'Bars'}
			</Select.Item>
		{/each}
	</Select.Content>
</Select.Root>
