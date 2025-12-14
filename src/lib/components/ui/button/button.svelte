<script lang="ts" module>
	import { cn, type WithElementRef } from '$lib/utils.js'
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements'
	import { type VariantProps, tv } from 'tailwind-variants'

	export const buttonVariants = tv({
		base: 'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-bold uppercase outline-none transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0 border-[3px] border-black',
		variants: {
			variant: {
				default:
					'bg-primary text-primary-foreground shadow-[4px_4px_0px_#000] hover:shadow-[6px_6px_0px_#000] hover:-translate-x-[2px] hover:-translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px]',
				destructive:
					'bg-destructive text-destructive-foreground shadow-[4px_4px_0px_#000] hover:shadow-[6px_6px_0px_#000] hover:-translate-x-[2px] hover:-translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px]',
				outline:
					'bg-background text-foreground shadow-[4px_4px_0px_#000] hover:shadow-[6px_6px_0px_#000] hover:-translate-x-[2px] hover:-translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px]',
				secondary:
					'bg-secondary text-secondary-foreground shadow-[4px_4px_0px_#000] hover:shadow-[6px_6px_0px_#000] hover:-translate-x-[2px] hover:-translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px]',
				ghost:
					'hover:bg-accent hover:text-accent-foreground border-transparent shadow-none hover:shadow-none hover:translate-x-0 hover:translate-y-0 active:translate-x-0 active:translate-y-0',
				link: 'text-primary underline-offset-4 hover:underline border-none shadow-none hover:shadow-none hover:translate-x-0 hover:translate-y-0 active:translate-x-0 active:translate-y-0'
			},
			size: {
				default: 'h-10 px-6 py-2',
				sm: 'h-8 px-4 text-xs',
				lg: 'h-12 px-8 text-base',
				icon: 'size-10',
				'icon-sm': 'size-8',
				'icon-lg': 'size-12'
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
		...restProps
	}: ButtonProps = $props()
</script>

{#if href}
	<a
		bind:this={ref}
		data-slot="button"
		class={cn(buttonVariants({ variant, size }), className)}
		href={disabled ? undefined : href}
		aria-disabled={disabled}
		role={disabled ? 'link' : undefined}
		tabindex={disabled ? -1 : undefined}
		{...restProps}
	>
		{@render children?.()}
	</a>
{:else}
	<button
		bind:this={ref}
		data-slot="button"
		class={cn(buttonVariants({ variant, size }), className)}
		{type}
		{disabled}
		{...restProps}
	>
		{@render children?.()}
	</button>
{/if}
