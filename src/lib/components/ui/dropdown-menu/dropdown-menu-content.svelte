<script lang="ts">
	import { cn, type WithoutChildrenOrChild } from '$lib/utils.js'
	import DropdownMenuPortal from './dropdown-menu-portal.svelte'
	import { DropdownMenu as DropdownMenuPrimitive } from 'bits-ui'
	import type { ComponentProps } from 'svelte'

	type AlignT = 'start' | 'center' | 'end'

	let {
		ref = $bindable(null),
		sideOffset = 4,
		portalProps,
		class: className,
		align = 'start',
		...restProps
	}: DropdownMenuPrimitive.ContentProps & {
		portalProps?: WithoutChildrenOrChild<ComponentProps<typeof DropdownMenuPortal>>
		align?: AlignT
	} = $props()

	const classes = $derived.by(() => {
		// if align is center, add class isAlignCenter, if is end, isAlignEnd
		return cn('dropdownMenuContent', align === 'center' && 'isAlignCenter', align === 'end' && 'isAlignEnd', className)
	})
</script>

<DropdownMenuPortal {...portalProps}>
	<DropdownMenuPrimitive.Content
		bind:ref
		data-slot="dropdown-menu-content"
		data-align={align}
		{sideOffset}
		class={classes}
		{...restProps}
	/>
</DropdownMenuPortal>

<style>
	:global(.dropdownMenuContent) {
		background-color: var(--popover);
		color: var(--popover-foreground);
		z-index: 50;
		max-height: var(--bits-dropdown-menu-content-available-height);
		min-width: 8rem;
		transform-origin: var(--bits-dropdown-menu-content-transform-origin);
		overflow-x: hidden;
		overflow-y: auto;
		border-radius: 0.375rem;
		border: 1px solid hsl(var(--border));
		padding: 0.25rem;
		box-shadow:
			0 4px 6px -1px rgb(0 0 0 / 0.1),
			0 2px 4px -2px rgb(0 0 0 / 0.1);
		outline: none;
	}

	:global(.dropdownMenuContent[data-state='open']) {
		animation:
			fadeIn 200ms ease-out,
			zoomIn 200ms ease-out;
	}

	:global(.dropdownMenuContent[data-state='closed']) {
		animation:
			fadeOut 200ms ease-in,
			zoomOut 200ms ease-in;
	}

	:global(.dropdownMenuContent[data-side='bottom']) {
		animation:
			fadeIn 200ms ease-out,
			zoomIn 200ms ease-out,
			slideInFromTop 200ms ease-out;
	}

	:global(.dropdownMenuContent[data-side='left']) {
		animation:
			fadeIn 200ms ease-out,
			zoomIn 200ms ease-out,
			slideInFromEnd 200ms ease-out;
	}

	:global(.dropdownMenuContent[data-side='right']) {
		animation:
			fadeIn 200ms ease-out,
			zoomIn 200ms ease-out,
			slideInFromStart 200ms ease-out;
	}

	:global(.dropdownMenuContent[data-side='top']) {
		animation:
			fadeIn 200ms ease-out,
			zoomIn 200ms ease-out,
			slideInFromBottom 200ms ease-out;
	}

	:global .dropdownMenuContent.isAlignCenter [data-slot='dropdown-menu-item'] {
		justify-content: center;
	}

	:global .dropdownMenuContent.isAlignEnd [data-slot='dropdown-menu-item'] {
		justify-content: end;
	}
</style>
