<script lang="ts">
	import { cn, type WithElementRef } from '$lib/utils.js'
	import type { HTMLAttributes } from 'svelte/elements'
	import type { Snippet } from 'svelte'

	let {
		ref = $bindable(null),
		class: className,
		child,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		child?: Snippet<[{ props: Record<string, unknown> }]>
	} = $props()

	const mergedProps = $derived({
		...restProps,
		class: cn('limeButtonGroupText', className)
	})
</script>

{#if child}
	{@render child({ props: mergedProps })}
{:else}
	<div bind:this={ref} data-slot="button-group-text" {...mergedProps}>
		{@render mergedProps.children?.()}
	</div>
{/if}

<style>
	:global(.limeButtonGroupText) {
		background-color: var(--n-01, #f2f3f6);
		box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
		display: flex;
		align-items: center;
		gap: 0.5rem;
		border-radius: 5px;
		border: 1px solid var(--neutralColorBorderColor, rgb(209, 213, 219));
		padding-left: 1rem;
		padding-right: 1rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--n-07, #394150);
	}

	:global(.limeButtonGroupText svg:not([class*='size-'])) {
		width: 1rem;
		height: 1rem;
	}

	:global(.limeButtonGroupText svg) {
		pointer-events: none;
	}
</style>
