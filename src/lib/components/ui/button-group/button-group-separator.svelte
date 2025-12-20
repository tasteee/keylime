<script lang="ts">
	import { cn } from '$lib/utils.js'
	import type { ComponentProps } from 'svelte'
	import { Separator } from '$lib/components/ui/separator/index.js'

	let {
		ref = $bindable(null),
		class: className,
		orientation = 'vertical',
		...restProps
	}: ComponentProps<typeof Separator> = $props()
</script>

<Separator
	bind:ref
	data-slot="button-group-separator"
	{orientation}
	class={cn('limeButtonGroupSeparator', className)}
	{...restProps}
/>

<style>
	:global(.limeButtonGroupSeparator) {
		background-color: var(--neutralColorBorderColor, rgb(209, 213, 219));
		position: relative;
		margin: 0 !important;
		align-self: stretch;
	}

	:global(.limeButtonGroupSeparator[data-orientation='vertical']) {
		height: auto;
		width: 1px;
	}

	:global(.limeButtonGroupSeparator[data-orientation='horizontal']) {
		height: 1px;
		width: auto;
	}
</style>
