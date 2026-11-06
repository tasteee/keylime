<script lang="ts">
	import type { Snippet } from 'svelte'
	import { CaretDown } from 'phosphor-svelte'

	type PlacementT = 'bottom-start' | 'bottom-center' | 'bottom-end' | 'top-start' | 'top-center' | 'top-end'

	type ValuePopoverButtonPropsT = {
		// Screen reader name for the button.
		label: string
		// The current value, shown on the button. Example: "D Minor".
		valueLabel: string
		// Small muted text before the value. Example: "BPM".
		eyebrowLabel?: string
		// Highlights the button when the value is not the default.
		isActive?: boolean
		placement?: PlacementT
		// The controls that edit the value. Rendered inside the popover.
		children: Snippet
	}

	const props: ValuePopoverButtonPropsT = $props()

	let isOpen = $state(false)

	const popoverPlacement = $derived(props.placement ?? 'bottom-start')
	const hasEyebrow = $derived(Boolean(props.eyebrowLabel))
	const buttonKind = $derived(props.isActive ? 'soft' : 'outline')
	const buttonTone = $derived(props.isActive ? 'primary' : 'neutral')

	const handleToggle = (event: CustomEvent) => {
		isOpen = event.detail.open
	}
</script>

<z-popover placement={popoverPlacement} isOpen={isOpen} ontoggle={handleToggle}>
	<z-button slot="trigger" kind={buttonKind} tone={buttonTone} size="sm" aria-label={props.label}>
		{#if hasEyebrow}
			<span class="value-popover-eyebrow">{props.eyebrowLabel}</span>
		{/if}
		<span class="value-popover-value">{props.valueLabel}</span>
		<CaretDown size={12} weight="bold" />
	</z-button>

	<z-column gap="md" class="value-popover-panel">
		{@render props.children()}
	</z-column>
</z-popover>

<style>
	.value-popover-eyebrow {
		text-transform: uppercase;
		letter-spacing: 0.04em;
		opacity: 0.6;
	}

	.value-popover-value {
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}

	.value-popover-panel {
		min-width: 12rem;
	}
</style>
