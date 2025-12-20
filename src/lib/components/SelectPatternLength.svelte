<script lang="ts">
	import * as Select from '$lib/components/ui/select/index.js'
	import projectStore from '$lib/stores/project.svelte'

	const patternLengthOptions = [1, 2, 4, 8, 16, 32]

	const handleSelect = (value: string) => {
		const parsedValue = parseInt(value, 10)
		const isValidNumber = !isNaN(parsedValue)
		if (!isValidNumber) return
		projectStore.patternDurationBars = parsedValue
	}
</script>

<Select.Root type="single" onValueChange={handleSelect} value={projectStore.patternDurationBars.toString()}>
	<Select.Trigger
		class="h-8 text-xs font-medium hover:bg-background/80 min-w-[140px] border-transparent bg-transparent focus:ring-0 focus:ring-offset-0"
	>
		<span class="herMenuTriggerDisplay">
			<span class="herMenuTriggerLabel">Duration</span>
			<span class="herMenuTriggerValue">
				{projectStore.patternDurationBars}
				{projectStore.patternDurationBars === 1 ? 'Bar' : 'Bars'}
			</span>
		</span>
	</Select.Trigger>
	<Select.Content>
		{#each patternLengthOptions as option}
			<Select.Item value={option.toString()} class="text-xs">
				{option}
				{option === 1 ? 'Bar' : 'Bars'}
			</Select.Item>
		{/each}
	</Select.Content>
</Select.Root>
