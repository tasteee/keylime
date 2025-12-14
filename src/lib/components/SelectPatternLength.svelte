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
	<Select.Trigger
		class="h-8 text-xs font-medium hover:bg-background/80 w-[140px] border-transparent bg-transparent focus:ring-0 focus:ring-offset-0"
	>
		<div class="gap-1 flex items-center">
			<span class="text-muted-foreground">Pattern:</span>
			<span class="text-foreground font-semibold">
				{mainStore.patternLengthBars}
				{mainStore.patternLengthBars === 1 ? 'Bar' : 'Bars'}
			</span>
		</div>
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
