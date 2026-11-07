<script lang="ts">
	type ChipOptionT = {
		value: string
		label: string
	}

	type ChipSelectPropsT = {
		label: string
		value: string
		options: ChipOptionT[]
		// Fires on every press, the chosen chip included, so a
		// second press can replay a sound without changing anything.
		onSelect: (value: string) => void
	}

	type ToggleElementT = HTMLElement & { isPressed: boolean }

	const props: ChipSelectPropsT = $props()

	const chips = $derived.by(() => {
		return props.options.map((option) => {
			const isSelected = option.value === props.value
			return { value: option.value, label: option.label, isSelected }
		})
	})

	// A toggle flips itself off when pressed again. Here a
	// press always means "pick this one", so keep it on.
	const handlePress = (event: Event) => {
		const toggleElement = event.currentTarget as ToggleElementT
		const chosenValue = toggleElement.dataset.value
		if (chosenValue === undefined) return
		toggleElement.isPressed = true
		props.onSelect(chosenValue)
	}
</script>

<!-- One choice from a short list, every option in view.
     A press picks it straight away; no menu to open. -->
<div class="chip-select">
	<z-text size="sm" weight={600}>{props.label}</z-text>

	<div class="chip-select-options" role="group" aria-label={props.label}>
		{#each chips as chip (chip.value)}
			<z-toggle-button size="sm" kind="outline" isPressed={chip.isSelected} data-value={chip.value} onpress={handlePress}>
				{chip.label}
			</z-toggle-button>
		{/each}
	</div>
</div>

<style>
	.chip-select {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-2);
	}

	.chip-select-options {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-2);
	}
</style>
