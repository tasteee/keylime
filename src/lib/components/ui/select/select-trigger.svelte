<script lang="ts" module>
	import { Select as SelectPrimitive } from 'bits-ui'
	import { type VariantProps, tv } from 'tailwind-variants'
	import { cn, type WithoutChild } from '$lib/utils.js'

	export const selectTriggerVariants = tv({
		base: 'keyActionSelectTrigger keyActionButton',
		variants: {
			kind: {
				solid: 'isSolidKind',
				outline: 'isOutlineKind',
				ghost: 'isGhostKind'
			},
			size: {
				small: 'isSmallSize',
				medium: 'isMediumSize',
				large: 'isLargeSize'
			},
			isFullWidth: {
				true: 'isFullWidth'
			}
		},
		defaultVariants: {
			kind: 'solid',
			size: 'small'
		}
	})

	export type SelectTriggerKind = VariantProps<typeof selectTriggerVariants>['kind']
	export type SelectTriggerSize = VariantProps<typeof selectTriggerVariants>['size']
</script>

<script lang="ts">
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down'

	let {
		ref = $bindable(null),
		class: className,
		kind = 'solid',
		size = 'small',
		label,
		value,
		isDisabled = false,
		isFullWidth = false,
		children,
		...restProps
	}: WithoutChild<SelectPrimitive.TriggerProps> & {
		kind?: SelectTriggerKind
		size?: SelectTriggerSize
		label?: string
		value?: string
		isDisabled?: boolean
		isFullWidth?: boolean
	} = $props()
</script>

<SelectPrimitive.Trigger
	bind:ref
	data-slot="select-trigger"
	class={cn(selectTriggerVariants({ kind, size, isFullWidth }), className)}
	disabled={isDisabled}
	{...restProps}
>
	<div class="gap-2 flex items-center truncate" class:isFullWidthContent={isFullWidth}>
		{#if label}
			<span class="font-bold">{label}</span>
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
</SelectPrimitive.Trigger>

<style>
	:global(.keyActionSelectTrigger) {
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

	:global(.keyActionSelectTrigger) {
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

	:global(.keyActionSelectTrigger:focus-visible) {
		outline: none;
	}

	:global(.keyActionSelectTrigger:disabled) {
		pointer-events: none;
		cursor: default;
	}

	:global(.keyActionSelectTrigger svg) {
		width: 1rem;
		height: 1rem;
		pointer-events: none;
		flex-shrink: 0;
		opacity: 0.5;
	}

	/* Sizes */
	:global(.keyActionSelectTrigger.isSmallSize) {
		height: var(--smallSizeHeight);
		padding: var(--smallSizePaddingY) var(--smallSizePaddingX);
		font-size: var(--smallSizeFontSize);
		gap: 0.25rem;
	}

	:global(.keyActionSelectTrigger.isMediumSize) {
		height: var(--mediumSizeHeight);
		padding: var(--mediumSizePaddingY) var(--mediumSizePaddingX);
		font-size: var(--mediumSizeFontSize);
		gap: 0.5rem;
	}

	:global(.keyActionSelectTrigger.isLargeSize) {
		height: var(--largeSizeHeight);
		padding: var(--largeSizePaddingY) var(--largeSizePaddingX);
		font-size: var(--largeSizeFontSize);
		gap: 0.75rem;
	}

	/* Kinds (Neutral only) */

	/* Solid */
	:global(.keyActionSelectTrigger.isSolidKind) {
		box-shadow:
			rgba(28, 26, 39, 0.12) 0px 1px 2px 0px,
			rgb(28 26 39 / 49%) 0px 0px 1px 0px;
		background-color: var(--neutralColorBgColor);
		border-color: var(--neutralColorBorderColor);
		color: var(--neutralColorTextColor);
		border: none;
	}
	:global(.keyActionSelectTrigger.isSolidKind:hover:not(:disabled)) {
		background-color: var(--n-00);
	}
	:global(.keyActionSelectTrigger.isSolidKind:active:not(:disabled)) {
		background-color: var(--neutralColorBgColor-active);
		transform: translateY(1px);
	}
	:global(.keyActionSelectTrigger.isSolidKind:disabled) {
		background-color: var(--neutralColorBgColor-disabled);
		color: var(--neutralColorTextColor-disabled);
	}

	/* Outline */
	:global(.keyActionSelectTrigger.isOutlineKind) {
		background-color: transparent;
		border-style: solid;
		border-width: 1px;
		border-color: var(--neutralColorBorderColor);
		color: var(--neutralColorTextColor);
	}
	:global(.keyActionSelectTrigger.isOutlineKind:hover:not(:disabled)) {
		background-color: var(--neutralColorBgColor-hover);
		border-color: var(--neutralColorBorderColor-hover);
	}
	:global(.keyActionSelectTrigger.isOutlineKind:active:not(:disabled)) {
		background-color: var(--neutralColorBgColor-active);
		border-color: var(--neutralColorBorderColor-active);
		transform: translateY(1px);
	}
	:global(.keyActionSelectTrigger.isOutlineKind:disabled) {
		border-color: var(--neutralColorBorderColor-disabled);
		color: var(--neutralColorTextColor-disabled);
	}

	/* Ghost */
	:global(.keyActionSelectTrigger.isGhostKind) {
		background-color: transparent;
		border-color: transparent;
		color: var(--neutralColorTextColor);
	}
	:global(.keyActionSelectTrigger.isGhostKind:hover:not(:disabled)) {
		background-color: var(--neutralColorBgColor-disabled);
	}
	:global(.keyActionSelectTrigger.isGhostKind:active:not(:disabled)) {
		background-color: var(--neutralColorBgColor-active);
	}
	:global(.keyActionSelectTrigger.isGhostKind:disabled) {
		color: var(--neutralColorTextColor-disabled);
	}

	/* Full Width Select */
	:global(.keyActionSelectTrigger.isFullWidth) {
		width: 100%;
		flex: 1;
	}

	.isFullWidthContent {
		flex: 1;
		justify-content: space-between;
	}
</style>
