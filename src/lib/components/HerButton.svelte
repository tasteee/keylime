<script lang="ts">
	import { Button } from 'bits-ui'
	import { cn } from '$lib/utils'
	import Icon from '@iconify/svelte'

	interface Props {
		class?: string
		kind?: 'solid' | 'ghost' | 'outline'
		color?: 'gray' | 'pink'
		size?: 'small' | 'large'
		label?: string
		leftIcon?: string
		rightIcon?: string
		isDisabled?: boolean
		onclick?: (e: MouseEvent) => void
		children?: import('svelte').Snippet
		[key: string]: any
	}

	let {
		class: className,
		kind = 'solid',
		color = 'gray',
		size = 'small',
		label,
		leftIcon,
		rightIcon,
		isDisabled = false,
		onclick,
		children,
		...rest
	}: Props = $props()

	const classes = $derived(
		cn(
			'ShaButton herButton',
			size === 'small' && 'isSmall',
			size === 'large' && 'isLarge',
			color === 'gray' && 'isGray',
			color === 'pink' && 'isPink',
			kind === 'outline' && 'isOutline',
			kind === 'ghost' && 'isGhost',
			kind === 'solid' && 'isSolid',
			isDisabled && 'isDisabled',
			className
		)
	)
</script>

<Button.Root class={classes} disabled={isDisabled} {onclick} {...rest}>
	{#if leftIcon}
		<Icon icon={leftIcon} width={size === 'large' ? '18' : '14'} />
	{/if}

	{#if label}
		<span>{label}</span>
	{:else}
		{@render children?.()}
	{/if}

	{#if rightIcon}
		<Icon icon={rightIcon} width={size === 'large' ? '18' : '14'} />
	{/if}
</Button.Root>

<style>
	:global(.herButton) {
		/* border: 2px solid transparent; */
		align-items: center;
		background: var(--n-50);
		border-radius: 5px;
		color: var(--n-00);
		cursor: pointer;
		display: inline-flex;
		font-size: 12px;
		font-weight: 600;
		gap: 6px;
		height: 36px;
		justify-content: center;
		outline-offset: -2px;
		outline: 2px solid transparent;
		padding: 0px 8px;
		transition: all 0.15s ease;
		user-select: none;
		white-space: nowrap;
		background: #4b5563;
	}

	:global(.herButton:active) {
		transform: scale(0.98);
	}

	:global(.herButton:focus-visible) {
		outline: none;
		box-shadow:
			0 0 0 2px #fff,
			0 0 0 4px #a3a3a3;
	}

	:global(.isDisabled) {
		opacity: 0.5;
		pointer-events: none;
	}

	/* Sizes */
	:global(.isSmall) {
		height: 30px;
		padding: 0 12px;
		font-size: 11px;
	}

	:global(.isLarge) {
		height: 40px;
		padding: 0 16px;
		font-size: 13px;
	}

	/* Solid Gray */
	:global(.isSolid.isGray) {
		background: linear-gradient(to top, #f5f5f5, #ffffff);
		color: #404040;
		outline-color: #c3c3c3;
		box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
	}
	:global(.isSolid.isGray:hover) {
		background: linear-gradient(to top, #ffffff, #ffffff);
	}

	/* Solid Pink */
	:global(.isSolid.isPink) {
		background: linear-gradient(to top, #ec4899, #f472b6);
		color: white;
		outline-color: #db2777;
		box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
	}
	:global(.isSolid.isPink:hover) {
		background: linear-gradient(to top, #f472b6, #f9a8d4);
	}

	/* Outline Gray */
	:global(.isOutline.isGray) {
		background: transparent;
		outline-color: #c3c3c3;
		color: #525252;
	}
	:global(.isOutline.isGray:hover) {
		background: #fafafa;
		color: #171717;
	}

	/* Outline Pink */
	:global(.isOutline.isPink) {
		background: transparent;
		outline-color: #fbcfe8;
		color: #db2777;
	}
	:global(.isOutline.isPink:hover) {
		background: #fdf2f8;
		outline-color: #f9a8d4;
	}

	/* Ghost Gray */
	:global(.isGhost.isGray) {
		background: transparent;
		outline-color: transparent;
		color: #737373;
		box-shadow: none;
	}
	:global(.isGhost.isGray:hover) {
		background: #f5f5f5;
		color: #171717;
	}

	/* Ghost Pink */
	:global(.isGhost.isPink) {
		background: transparent;
		outline-color: transparent;
		color: #ec4899;
		box-shadow: none;
	}
	:global(.isGhost.isPink:hover) {
		background: #fdf2f8;
		color: #be185d;
	}
</style>
