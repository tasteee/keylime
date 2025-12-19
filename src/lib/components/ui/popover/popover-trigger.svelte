<script lang="ts">
	import { cn } from '$lib/utils.js'
	import { Popover as PopoverPrimitive } from 'bits-ui'
	import { selectTriggerVariants, type SelectTriggerKind, type SelectTriggerSize } from '../select/select-trigger.svelte'
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down'
	import type { Snippet } from 'svelte'

	let {
		ref = $bindable(null),
		class: className,
		kind = 'solid',
		size = 'small',
		label,
		value,
		isDisabled = false,
		children,
		...restProps
	}: PopoverPrimitive.TriggerProps & {
		kind?: SelectTriggerKind
		size?: SelectTriggerSize
		label?: string | Snippet
		value?: string
		isDisabled?: boolean
	} = $props()
</script>

<PopoverPrimitive.Trigger
	bind:ref
	data-slot="popover-trigger"
	class={cn(selectTriggerVariants({ kind, size }), className)}
	disabled={isDisabled}
	{...restProps}
>
	<div class="gap-2 flex items-center truncate">
		{#if label}
			<span class="font-bold">
				{#if typeof label === 'string'}
					{label}
				{:else}
					{@render label()}
				{/if}
			</span>
		{/if}
		{#if value}
			<span class="font-normal">{value}</span>
		{:else}
			<span class="font-normal">
				{@render children?.()}
			</span>
		{/if}
	</div>
	<ChevronDownIcon />
</PopoverPrimitive.Trigger>

<style>
	:global(.keyActionPopoverSelectTrigger) {
		/* Sizes */
		--smallSizeHeight: 28px;
		--smallSizePaddingY: 4px;
		--smallSizePaddingX: 12px;
		--smallSizeFontSize: 0.875rem;
		--mediumSizeHeight: 32px;
		--mediumSizePaddingY: 6px;
		--mediumSizePaddingX: 12px;
		--mediumSizeFontSize: 0.875rem;
		--largeSizeHeight: 36px;
		--largeSizePaddingY: 8px;
		--largeSizePaddingX: 12px;
		--largeSizeFontSize: 0.875rem;

		/* Neutral */
		--neutralColorBgColor: var(--colorWhite);
		--neutralColorBgColor-hover: rgb(248, 247, 254);
		--neutralColorBgColor-active: rgb(241, 239, 250);
		--neutralColorBgColor-disabled: rgb(243, 244, 246);

		--neutralColorBorderColor: rgb(209, 213, 219);
		--neutralColorBorderColor-hover: rgb(156, 163, 175);
		--neutralColorBorderColor-active: rgb(107, 114, 128);
		--neutralColorBorderColor-disabled: rgb(243, 244, 246);

		--neutralColorTextColor: var(--colorBlack);
		--neutralColorTextColor-hover: var(--colorBlack);
		--neutralColorTextColor-active: var(--colorBlack);
		--neutralColorTextColor-disabled: rgb(156, 163, 175);
	}

	:global(.keyActionPopoverSelectTrigger) {
		display: inline-flex;
		flex-shrink: 0;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		white-space: nowrap;
		font-size: 0.875rem;
		font-weight: 700;
		transition: all 150ms ease;
		outline: none;
		appearance: none;
		border-radius: 5px;
		border: 1px solid transparent;
	}

	:global(.keyActionPopoverSelectTrigger:focus-visible) {
		outline: none;
	}

	:global(.keyActionPopoverSelectTrigger:disabled) {
		pointer-events: none;
		cursor: default;
	}

	:global(.keyActionPopoverSelectTrigger svg) {
		width: 1rem;
		height: 1rem;
		pointer-events: none;
		flex-shrink: 0;
		opacity: 0.5;
	}

	/* Sizes */
	:global(.keyActionPopoverSelectTrigger.isSmallSize) {
		height: var(--smallSizeHeight);
		padding: var(--smallSizePaddingY) var(--smallSizePaddingX);
		font-size: var(--smallSizeFontSize);
		gap: 0.25rem;
	}

	:global(.keyActionPopoverSelectTrigger.isMediumSize) {
		height: var(--mediumSizeHeight);
		padding: var(--mediumSizePaddingY) var(--mediumSizePaddingX);
		font-size: var(--mediumSizeFontSize);
		gap: 0.5rem;
	}

	:global(.keyActionPopoverSelectTrigger.isLargeSize) {
		height: var(--largeSizeHeight);
		padding: var(--largeSizePaddingY) var(--largeSizePaddingX);
		font-size: var(--largeSizeFontSize);
		gap: 0.75rem;
	}

	/* Kinds (Neutral only) */

	/* Solid */
	:global(.keyActionPopoverSelectTrigger.isSolidKind) {
		box-shadow:
			rgba(28, 26, 39, 0.12) 0px 1px 2px 0px,
			rgb(28 26 39 / 49%) 0px 0px 1px 0px;
		background-color: var(--neutralColorBgColor);
		border-color: var(--neutralColorBorderColor);
		color: var(--neutralColorTextColor);
		border: none;
	}
	:global(.keyActionPopoverSelectTrigger.isSolidKind:hover:not(:disabled)) {
		background-color: var(--neutralColorBgColor-hover);
	}
	:global(.keyActionPopoverSelectTrigger.isSolidKind:active:not(:disabled)) {
		background-color: var(--neutralColorBgColor-active);
		transform: translateY(1px);
	}
	:global(.keyActionPopoverSelectTrigger.isSolidKind:disabled) {
		background-color: var(--neutralColorBgColor-disabled);
		color: var(--neutralColorTextColor-disabled);
	}

	/* Outline */
	:global(.keyActionPopoverSelectTrigger.isOutlineKind) {
		background-color: transparent;
		border-style: solid;
		border-width: 1px;
		border-color: var(--neutralColorBorderColor);
		color: var(--neutralColorTextColor);
	}
	:global(.keyActionPopoverSelectTrigger.isOutlineKind:hover:not(:disabled)) {
		background-color: var(--neutralColorBgColor-hover);
		border-color: var(--neutralColorBorderColor-hover);
	}
	:global(.keyActionPopoverSelectTrigger.isOutlineKind:active:not(:disabled)) {
		background-color: var(--neutralColorBgColor-active);
		border-color: var(--neutralColorBorderColor-active);
		transform: translateY(1px);
	}
	:global(.keyActionPopoverSelectTrigger.isOutlineKind:disabled) {
		border-color: var(--neutralColorBorderColor-disabled);
		color: var(--neutralColorTextColor-disabled);
	}

	/* Ghost */
	:global(.keyActionPopoverSelectTrigger.isGhostKind) {
		background-color: transparent;
		border-color: transparent;
		color: var(--neutralColorTextColor);
	}
	:global(.keyActionPopoverSelectTrigger.isGhostKind:hover:not(:disabled)) {
		background-color: var(--neutralColorBgColor-disabled);
	}
	:global(.keyActionPopoverSelectTrigger.isGhostKind:active:not(:disabled)) {
		background-color: var(--neutralColorBgColor-active);
	}
	:global(.keyActionPopoverSelectTrigger.isGhostKind:disabled) {
		color: var(--neutralColorTextColor-disabled);
	}
</style>
