<script lang="ts" module>
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements'
	import { type VariantProps, tv } from 'tailwind-variants'
	import { cn, type WithElementRef } from '$lib/utils.js'

	export const buttonVariants = tv({
		base: 'keyActionButton',
		variants: {
			kind: {
				solid: 'isSolidKind',
				outline: 'isOutlineKind',
				ghost: 'isGhostKind'
			},
			color: {
				red: 'isRedColor',
				neutral: 'isNeutralColor',
				brand: 'isBrandColor'
			},
			size: {
				small: 'isSmallSize',
				medium: 'isMediumSize',
				large: 'isLargeSize'
			},
			isIcon: {
				true: 'isIcon'
			},
			isFullWidth: {
				true: 'isFullWidth'
			}
		},
		defaultVariants: {
			kind: 'solid',
			color: 'neutral',
			size: 'small'
		}
	})

	export type ButtonKind = VariantProps<typeof buttonVariants>['kind']
	export type ButtonColor = VariantProps<typeof buttonVariants>['color']
	export type ButtonSize = VariantProps<typeof buttonVariants>['size']

	export type ButtonProps = WithElementRef<HTMLButtonAttributes> &
		WithElementRef<HTMLAnchorAttributes> & {
			kind?: ButtonKind
			color?: ButtonColor
			size?: ButtonSize
			isIcon?: boolean
			isFullWidth?: boolean
		}
</script>

<script lang="ts">
	let {
		class: className,
		kind = 'solid',
		color = 'neutral',
		size = 'small',
		isIcon = false,
		isFullWidth = false,
		ref = $bindable(null),
		href = undefined,
		type = 'button',
		disabled,
		children,
		...restProps
	}: ButtonProps = $props()
</script>

{#if href}
	<a
		bind:this={ref}
		data-slot="button"
		class={cn(buttonVariants({ kind, color, size, isIcon, isFullWidth }), className)}
		{href}
		{...restProps}
	>
		{@render children?.()}
	</a>
{:else}
	<button
		bind:this={ref}
		data-slot="button"
		class={cn(buttonVariants({ kind, color, size, isIcon, isFullWidth }), className)}
		{type}
		{disabled}
		{...restProps}
	>
		{@render children?.()}
	</button>
{/if}

<style>
	.keyActionButton {
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

		/* Red */
		--redColorBgColor: rgb(220, 38, 38);
		--redColorBgColor-hover: rgb(185, 28, 28);
		--redColorBgColor-active: rgb(153, 27, 27);
		--redColorBgColor-disabled: rgb(254, 226, 226);

		--redColorBorderColor: rgb(220, 38, 38);
		--redColorBorderColor-hover: rgb(185, 28, 28);
		--redColorBorderColor-active: rgb(153, 27, 27);
		--redColorBorderColor-disabled: rgb(254, 226, 226);

		--redColorTextColor: rgb(220, 38, 38);
		--redColorTextColor-hover: rgb(185, 28, 28);
		--redColorTextColor-active: rgb(153, 27, 27);
		--redColorTextColor-disabled: rgb(254, 226, 226);

		/* Brand */
		--brandColorBgColor: rgb(37, 99, 235);
		--brandColorBgColor-hover: rgb(29, 78, 216);
		--brandColorBgColor-active: rgb(30, 64, 175);
		--brandColorBgColor-disabled: rgb(219, 234, 254);

		--brandColorBorderColor: rgb(37, 99, 235);
		--brandColorBorderColor-hover: rgb(29, 78, 216);
		--brandColorBorderColor-active: rgb(30, 64, 175);
		--brandColorBorderColor-disabled: rgb(219, 234, 254);

		--brandColorTextColor: rgb(37, 99, 235);
		--brandColorTextColor-hover: rgb(29, 78, 216);
		--brandColorTextColor-active: rgb(30, 64, 175);
		--brandColorTextColor-disabled: rgb(219, 234, 254);
	}

	.keyActionButton {
		display: inline-flex;
		flex-shrink: 0;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		white-space: nowrap;
		font-size: 0.875rem;
		font-weight: 700;
		transition: all 150ms ease;
		outline: none;
		appearance: none;
		border-radius: 5px;
		border-width: 1px;
		border-style: solid;
		border-color: transparent;
	}

	.keyActionButton:focus-visible {
		outline: none;
	}

	.keyActionButton:disabled {
		pointer-events: none;
		cursor: default;
	}

	.keyActionButton svg {
		width: 1rem;
		height: 1rem;
		pointer-events: none;
		flex-shrink: 0;
	}

	/* Sizes */
	.keyActionButton.isSmallSize {
		height: var(--smallSizeHeight);
		padding: var(--smallSizePaddingY) var(--smallSizePaddingX);
		font-size: var(--smallSizeFontSize);
		gap: 0.25rem;
	}

	.keyActionButton.isMediumSize {
		height: var(--mediumSizeHeight);
		padding: var(--mediumSizePaddingY) var(--mediumSizePaddingX);
		font-size: var(--mediumSizeFontSize);
		gap: 0.5rem;
	}

	.keyActionButton.isLargeSize {
		height: var(--largeSizeHeight);
		padding: var(--largeSizePaddingY) var(--largeSizePaddingX);
		font-size: var(--largeSizeFontSize);
		gap: 0.75rem;
	}

	/* Icon Button */
	.keyActionButton.isIcon {
		padding-left: 0;
		padding-right: 0;
		aspect-ratio: 1 / 1;
		gap: 0;
	}

	.keyActionButton.isIcon.isSmallSize {
		width: var(--smallSizeHeight);
	}

	.keyActionButton.isIcon.isMediumSize {
		width: var(--mediumSizeHeight);
	}

	.keyActionButton.isIcon.isLargeSize {
		width: var(--largeSizeHeight);
	}

	/* Full Width Button */
	.keyActionButton.isFullWidth {
		width: 100%;
		flex: 1;
	}

	/* Kinds & Colors */

	/* Solid */
	.keyActionButton.isSolidKind {
		box-shadow:
			rgba(28, 26, 39, 0.12) 0px 1px 2px 0px,
			rgb(28 26 39 / 49%) 0px 0px 1px 0px;
	}

	.keyActionButton.isSolidKind:active:not(:disabled) {
		transform: translateY(1px);
	}

	/* Solid Neutral */
	.keyActionButton.isSolidKind.isNeutralColor {
		background-color: var(--neutralColorBgColor);
		border-color: var(--neutralColorBorderColor); /* Or transparent if no border wanted */
		color: var(--neutralColorTextColor);
		border-width: 0px;
	}

	.keyActionButton.isSolidKind.isNeutralColor:hover:not(:disabled) {
		background-color: var(--neutralColorBgColor-hover);
	}
	.keyActionButton.isSolidKind.isNeutralColor:active:not(:disabled) {
		background-color: var(--neutralColorBgColor-active);
	}
	.keyActionButton.isSolidKind.isNeutralColor:disabled {
		background-color: var(--neutralColorBgColor-disabled);
		color: var(--neutralColorTextColor-disabled);
	}

	/* Solid Red */
	.keyActionButton.isSolidKind.isRedColor {
		background-color: var(--redColorBgColor);
		color: white;
		border-width: 0px;
	}
	.keyActionButton.isSolidKind.isRedColor:hover:not(:disabled) {
		background-color: var(--redColorBgColor-hover);
	}
	.keyActionButton.isSolidKind.isRedColor:active:not(:disabled) {
		background-color: var(--redColorBgColor-active);
	}
	.keyActionButton.isSolidKind.isRedColor:disabled {
		background-color: var(--redColorBgColor-disabled);
		color: white; /* Or specific disabled text color */
	}

	/* Solid Brand */
	.keyActionButton.isSolidKind.isBrandColor {
		background-color: var(--brandColorBgColor);
		color: white;
		border-width: 0px;
	}
	.keyActionButton.isSolidKind.isBrandColor:hover:not(:disabled) {
		background-color: var(--brandColorBgColor-hover);
	}
	.keyActionButton.isSolidKind.isBrandColor:active:not(:disabled) {
		background-color: var(--brandColorBgColor-active);
	}
	.keyActionButton.isSolidKind.isBrandColor:disabled {
		background-color: var(--brandColorBgColor-disabled);
		color: white;
	}

	/* Outline */
	.keyActionButton.isOutlineKind {
		background-color: transparent;
		border-style: solid;
		border-width: 1px;
	}
	.keyActionButton.isOutlineKind:active:not(:disabled) {
		transform: translateY(1px);
	}

	/* Outline Neutral */
	.keyActionButton.isOutlineKind.isNeutralColor {
		border-color: var(--neutralColorBorderColor);
		color: var(--neutralColorTextColor);
	}
	.keyActionButton.isOutlineKind.isNeutralColor:hover:not(:disabled) {
		background-color: var(--neutralColorBgColor-hover); /* Using hover bg from neutral */
		border-color: var(--neutralColorBorderColor-hover);
	}
	.keyActionButton.isOutlineKind.isNeutralColor:active:not(:disabled) {
		background-color: var(--neutralColorBgColor-active);
		border-color: var(--neutralColorBorderColor-active);
	}
	.keyActionButton.isOutlineKind.isNeutralColor:disabled {
		border-color: var(--neutralColorBorderColor-disabled);
		color: var(--neutralColorTextColor-disabled);
	}

	/* Outline Red */
	.keyActionButton.isOutlineKind.isRedColor {
		border-color: var(--redColorBorderColor);
		color: var(--redColorTextColor);
	}
	.keyActionButton.isOutlineKind.isRedColor:hover:not(:disabled) {
		background-color: rgb(254, 242, 242); /* Hardcoded in user's CSS, maybe make a var? */
		border-color: var(--redColorBorderColor-hover);
	}
	.keyActionButton.isOutlineKind.isRedColor:active:not(:disabled) {
		background-color: rgb(254, 226, 226);
		border-color: var(--redColorBorderColor-active);
	}
	.keyActionButton.isOutlineKind.isRedColor:disabled {
		border-color: var(--redColorBorderColor-disabled);
		color: var(--redColorTextColor-disabled);
	}

	/* Outline Brand */
	.keyActionButton.isOutlineKind.isBrandColor {
		border-color: var(--brandColorBorderColor);
		color: var(--brandColorTextColor);
	}
	.keyActionButton.isOutlineKind.isBrandColor:hover:not(:disabled) {
		background-color: rgb(239, 246, 255); /* Hardcoded in user's CSS */
		border-color: var(--brandColorBorderColor-hover);
	}
	.keyActionButton.isOutlineKind.isBrandColor:active:not(:disabled) {
		background-color: rgb(219, 234, 254);
		border-color: var(--brandColorBorderColor-active);
	}
	.keyActionButton.isOutlineKind.isBrandColor:disabled {
		border-color: var(--brandColorBorderColor-disabled);
		color: var(--brandColorTextColor-disabled);
	}

	/* Ghost */
	.keyActionButton.isGhostKind {
		background-color: transparent;
		border-color: transparent;
	}

	/* Ghost Neutral */
	.keyActionButton.isGhostKind.isNeutralColor {
		color: var(--neutralColorTextColor);
	}
	.keyActionButton.isGhostKind.isNeutralColor:hover:not(:disabled) {
		background-color: var(
			--neutralColorBgColor-disabled
		); /* Using disabled bg as hover for ghost? User had rgb(243, 244, 246) which is disabled bg */
	}
	.keyActionButton.isGhostKind.isNeutralColor:active:not(:disabled) {
		background-color: var(--neutralColorBgColor-active); /* Or similar */
	}
	.keyActionButton.isGhostKind.isNeutralColor:disabled {
		color: var(--neutralColorTextColor-disabled);
	}

	/* Ghost Red */
	.keyActionButton.isGhostKind.isRedColor {
		color: var(--redColorTextColor);
	}
	.keyActionButton.isGhostKind.isRedColor:hover:not(:disabled) {
		background-color: rgb(254, 242, 242);
	}
	.keyActionButton.isGhostKind.isRedColor:active:not(:disabled) {
		background-color: rgb(254, 226, 226);
	}
	.keyActionButton.isGhostKind.isRedColor:disabled {
		color: var(--redColorTextColor-disabled);
	}

	/* Ghost Brand */
	.keyActionButton.isGhostKind.isBrandColor {
		color: var(--brandColorTextColor);
	}
	.keyActionButton.isGhostKind.isBrandColor:hover:not(:disabled) {
		background-color: rgb(239, 246, 255);
	}
	.keyActionButton.isGhostKind.isBrandColor:active:not(:disabled) {
		background-color: rgb(219, 234, 254);
	}
	.keyActionButton.isGhostKind.isBrandColor:disabled {
		color: var(--brandColorTextColor-disabled);
	}
</style>
