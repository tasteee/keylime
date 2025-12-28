<script lang="ts" module>
	import { type VariantProps, tv } from 'tailwind-variants'
	import { cn, type WithElementRef } from '$lib/utils.js'
	import type { HTMLAnchorAttributes, HTMLAttributes } from 'svelte/elements'

	export const badgeVariants = tv({
		base: 'keyBadge',
		variants: {
			kind: {
				solid: 'isSolidKind',
				outline: 'isOutlineKind',
				soft: 'isSoftKind',
				ghost: 'isGhostKind'
			},
			color: {
				neutral: 'isNeutralColor',
				brand: 'isBrandColor',
				dark: 'isDarkColor'
			},
			size: {
				small: 'isSmallSize',
				medium: 'isMediumSize',
				large: 'isLargeSize'
			},
			isRound: {
				true: 'isRound'
			}
		},
		defaultVariants: {
			kind: 'solid',
			color: 'neutral',
			size: 'medium',
			isRound: true
		}
	})

	export type BadgeKind = VariantProps<typeof badgeVariants>['kind']
	export type BadgeColor = VariantProps<typeof badgeVariants>['color']
	export type BadgeSize = VariantProps<typeof badgeVariants>['size']

	export type BadgeProps = WithElementRef<HTMLAttributes<HTMLSpanElement>> &
		WithElementRef<HTMLAnchorAttributes> & {
			kind?: BadgeKind
			color?: BadgeColor
			size?: BadgeSize
			isRound?: boolean
		}
</script>

<script lang="ts">
	let {
		class: className,
		kind = 'solid',
		color = 'neutral',
		size = 'medium',
		isRound = false,
		ref = $bindable(null),
		href,
		children,
		...restProps
	}: BadgeProps = $props()
</script>

{#if href}
	<a
		bind:this={ref}
		data-slot="badge"
		class={cn(badgeVariants({ kind, color, size, isRound }), className)}
		{href}
		{...restProps}
	>
		{@render children?.()}
	</a>
{:else}
	<span
		bind:this={ref}
		data-slot="badge"
		class={cn(badgeVariants({ kind, color, size, isRound }), className)}
		{...restProps}
	>
		{@render children?.()}
	</span>
{/if}

<style>
	.keyBadge {
		/* Sizes */
		--smallSizeHeight: 20px;
		--smallSizePaddingX: 6px;
		--smallSizeFontSize: 0.75rem;

		--mediumSizeHeight: 24px;
		--mediumSizePaddingX: 8px;
		--mediumSizeFontSize: 0.75rem;

		--largeSizeHeight: 28px;
		--largeSizePaddingX: 10px;
		--largeSizeFontSize: 0.875rem;

		/* Neutral */
		--neutralColorBgColor: var(--n-02);
		--neutralColorTextColor: var(--foreground);
		--neutralColorBorderColor: var(--n-03);

		/* Dark */
		--darkColorBgColor: var(--n-09);
		--darkColorTextColor: var(--colorWhite);
		--darkColorBorderColor: var(--n-09);

		/* Brand */
		--brandColorBgColor: var(--a);
		--brandColorTextColor: var(--colorWhite);
		--brandColorBorderColor: var(--a);
	}

	.keyBadge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		white-space: nowrap;
		font-weight: 600;
		transition: all 150ms ease;
		border-radius: 4px;
		border-width: 1px;
		border-style: solid;
		border-color: transparent;
		line-height: 1;
		padding-bottom: 1px;
	}

	.keyBadge.isRound {
		border-radius: 9999px;
	}

	/* Sizes */
	.keyBadge.isSmallSize {
		height: var(--smallSizeHeight);
		padding-left: var(--smallSizePaddingX);
		padding-right: var(--smallSizePaddingX);
		font-size: var(--smallSizeFontSize);
	}

	.keyBadge.isMediumSize {
		height: var(--mediumSizeHeight);
		padding-left: var(--mediumSizePaddingX);
		padding-right: var(--mediumSizePaddingX);
		font-size: var(--mediumSizeFontSize);
	}

	.keyBadge.isLargeSize {
		height: var(--largeSizeHeight);
		padding-left: var(--largeSizePaddingX);
		padding-right: var(--largeSizePaddingX);
		font-size: var(--largeSizeFontSize);
	}

	/* Kinds & Colors */

	/* Solid */
	.keyBadge.isSolidKind {
		border-color: transparent;
	}

	.keyBadge.isSolidKind.isNeutralColor {
		background-color: var(--neutralColorBgColor);
		color: var(--neutralColorTextColor);
	}

	.keyBadge.isSolidKind.isDarkColor {
		background-color: var(--darkColorBgColor);
		color: var(--darkColorTextColor);
	}

	.keyBadge.isSolidKind.isBrandColor {
		background-color: var(--brandColorBgColor);
		color: var(--brandColorTextColor);
	}

	/* Outline */
	.keyBadge.isOutlineKind {
		background-color: transparent;
	}

	.keyBadge.isOutlineKind.isNeutralColor {
		border-color: var(--neutralColorBorderColor);
		color: var(--neutralColorTextColor);
	}

	.keyBadge.isOutlineKind.isDarkColor {
		border-color: var(--darkColorBorderColor);
		color: var(--darkColorBgColor);
	}

	.keyBadge.isOutlineKind.isBrandColor {
		border-color: var(--brandColorBorderColor);
		color: var(--brandColorBgColor);
	}

	/* Soft */
	.keyBadge.isSoftKind {
		border-color: transparent;
	}

	.keyBadge.isSoftKind.isNeutralColor {
		background-color: var(--n-01);
		color: var(--neutralColorTextColor);
	}

	.keyBadge.isSoftKind.isDarkColor {
		background-color: var(--n-04);
		color: var(--darkColorBgColor);
	}

	.keyBadge.isSoftKind.isBrandColor {
		background-color: var(--a-01);
		color: var(--brandColorBgColor);
	}

	/* Ghost */
	.keyBadge.isGhostKind {
		background-color: transparent;
		border-color: transparent;
	}

	.keyBadge.isGhostKind.isNeutralColor {
		color: var(--neutralColorTextColor);
	}

	.keyBadge.isGhostKind.isDarkColor {
		color: var(--darkColorBgColor);
	}

	.keyBadge.isGhostKind.isBrandColor {
		color: var(--brandColorBgColor);
	}
</style>
