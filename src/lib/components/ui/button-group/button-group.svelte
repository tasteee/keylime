<script lang="ts">
	import { cn, type WithElementRef } from '$lib/utils.js'
	import type { HTMLAttributes } from 'svelte/elements'

	let {
		ref = $bindable(null),
		class: className,
		children,
		isVertical = false,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		isVertical?: boolean
	} = $props()
</script>

<div
	bind:this={ref}
	role="group"
	data-slot="button-group"
	data-orientation={isVertical ? 'vertical' : 'horizontal'}
	class={cn('limeButtonGroup', isVertical && 'isVertical', className)}
	{...restProps}
>
	{@render children?.()}
</div>

<style>
	.limeButtonGroup {
		display: inline-flex;
		width: fit-content;
		align-items: stretch;
	}

	/* Focus management: bring focused element to front */
	.limeButtonGroup > :global(*:focus-visible) {
		position: relative;
		z-index: 10;
	}

	/* Horizontal (Default) */
	.limeButtonGroup:not(.isVertical) {
		flex-direction: row;
	}

	.limeButtonGroup:not(.isVertical) > :global(*:not(:first-child)) {
		border-top-left-radius: 0;
		border-bottom-left-radius: 0;
		border-left-width: 0;
	}

	.limeButtonGroup:not(.isVertical) > :global(*:not(:last-child)) {
		border-top-right-radius: 0;
		border-bottom-right-radius: 0;
	}

	/* Vertical */
	.limeButtonGroup.isVertical {
		flex-direction: column;
	}

	.limeButtonGroup.isVertical > :global(*:not(:first-child)) {
		border-top-left-radius: 0;
		border-top-right-radius: 0;
		border-top-width: 0;
	}

	.limeButtonGroup.isVertical > :global(*:not(:last-child)) {
		border-bottom-left-radius: 0;
		border-bottom-right-radius: 0;
	}
</style>
