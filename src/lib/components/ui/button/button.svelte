<script lang="ts" module>
	import { cn, type WithElementRef } from '$lib/utils.js'
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements'
	import { type VariantProps, tv } from 'tailwind-variants'

	export const buttonVariants = tv({
		base: 'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:bg-[var(--neutral-disabled)] disabled:text-[var(--neutral-textDisabled)] disabled:cursor-default disabled:opacity-100 [&_svg]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0',
		variants: {
			variant: {
				default:
					'bg-[var(--neutral-actionSecondary)] text-[var(--neutral-text)] shadow-none hover:bg-[var(--neutral-actionSecondaryHover)]',
				primary:
					'bg-[var(--primary-action)] text-[var(--neutral-textOnPrimary)] shadow-s1 hover:bg-[var(--primary-actionHover)]',
				white:
					'bg-[var(--neutral-cardBackgroundStrong)] text-[var(--neutral-text)] shadow-s2 hover:bg-[var(--neutral-cardBackgroundStrong)]/90',
				destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
				outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
				secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
				ghost: 'bg-transparent hover:bg-[var(--neutral-backgroundSubtle)] text-[var(--neutral-text)]',
				link: 'text-primary underline-offset-4 hover:underline'
			},
			size: {
				default: 'h-auto px-3 py-1.5',
				sm: 'h-8 rounded-md px-3',
				lg: 'h-auto px-4 py-2',
				icon: 'h-8 w-8 p-2',
				'icon-sm': 'h-8 w-8',
				'icon-lg': 'h-12 w-12'
			}
		},
		defaultVariants: {
			variant: 'default',
			size: 'default'
		}
	})

	export type ButtonVariant = VariantProps<typeof buttonVariants>['variant']
	export type ButtonSize = VariantProps<typeof buttonVariants>['size']

	export type ButtonProps = WithElementRef<HTMLButtonAttributes> &
		WithElementRef<HTMLAnchorAttributes> & {
			variant?: ButtonVariant
			size?: ButtonSize
			color?: 'primary' | 'neutral'
			kind?: 'solid' | 'outline' | 'ghost'
			isIcon?: boolean
		}
</script>

<script lang="ts">
	let {
		class: className,
		variant = 'default',
		size = 'default',
		ref = $bindable(null),
		href = undefined,
		type = 'button',
		disabled,
		children,
		color,
		kind,
		isIcon,
		...restProps
	}: ButtonProps = $props()

	// Map legacy/custom props to variants if variant is default
	let finalVariant = $derived.by(() => {
		if (color === 'primary' && kind === 'solid') return 'primary'
		if (isIcon) return 'ghost'
		return variant
	})

	let finalSize = $derived.by(() => {
		if (isIcon) return 'icon'
		if (color === 'primary') return 'lg'
		return size
	})
</script>

{#if href}
	<a
		bind:this={ref}
		data-slot="button"
		class={cn(buttonVariants({ variant: finalVariant, size: finalSize }), className)}
		{href}
		{...restProps}
	>
		{@render children?.()}
	</a>
{:else}
	<button
		bind:this={ref}
		data-slot="button"
		class={cn(buttonVariants({ variant: finalVariant, size: finalSize }), className)}
		{type}
		{disabled}
		{...restProps}
	>
		{@render children?.()}
	</button>
{/if}
