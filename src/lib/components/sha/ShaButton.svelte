<script lang="ts">
	import type { Snippet } from 'svelte'

	type PropsT = {
		children?: Snippet
		onclick?: (event: MouseEvent) => void

		// Configuration
		color?: 'default' | 'accent' | 'danger'
		kind?: 'solid' | 'outline' | 'ghost'
		size?: 'small' | 'medium' | 'large'

		// States
		isIcon?: boolean // Icon-only (circle)
		isLoading?: boolean
		isDisabled?: boolean
		isActive?: boolean // Toggled on/off state

		// Automation
		class?: string
		title?: string
		type?: 'button' | 'submit' | 'reset'
	}

	let {
		children,
		onclick,
		color = 'default',
		kind = 'solid',
		size = 'medium',
		isIcon = false,
		isLoading = false,
		isDisabled = false,
		isActive = false,
		class: className = '',
		title,
		type = 'button'
	}: PropsT = $props()

	function getClasses() {
		// We strictly map Enum -> ClassName to maintain the .isX pattern in CSS
		const classes = [
			'button-base',
			// Configuration Maps
			color === 'accent' ? 'isAccentColor' : color === 'danger' ? 'isDangerColor' : 'isDefaultColor',
			kind === 'outline' ? 'isOutlineKind' : kind === 'ghost' ? 'isGhostKind' : 'isSolidKind',
			size === 'small' ? 'isSmallSize' : size === 'large' ? 'isLargeSize' : 'isMediumSize',
			// Boolean States
			isIcon && 'isIcon',
			isActive && 'isActive',
			className
		]

		return classes.filter(Boolean).join(' ')
	}
</script>

<button class={getClasses()} {onclick} disabled={isDisabled || isLoading} {title} {type}>
	{#if isLoading}
		<div class="spinner"></div>
	{:else}
		{@render children?.()}
	{/if}
</button>

<style>
	/* Base Architecture */
	.button-base {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		font-family: var(--font-sans);
		font-weight: 600;
		cursor: pointer;
		border: none;
		transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
		user-select: none;
		border-radius: 5px;
		height: 36px;
		max-height: 36px;
	}

	/* --------------------------
     SIZES 
  --------------------------- */
	.isSmallSize {
		height: 32px;
		padding: 0 12px;
		font-size: 13px;
	}
	.isMediumSize {
		height: 40px;
		padding: 0 20px;
		font-size: 14px;
	}
	.isLargeSize {
		height: 48px;
		padding: 0 32px;
		font-size: 16px;
	}

	/* Icon Only Overrides */
	.isIcon {
		padding: 0;
		border-radius: 50%;
		aspect-ratio: 1/1;
	}
	.isSmallSize.isIcon {
		width: 32px;
	}
	.isMediumSize.isIcon {
		width: 40px;
	}
	.isLargeSize.isIcon {
		width: 48px;
	}

	/* --------------------------
     KINDS & COLORS
  --------------------------- */

	/* 1. SOLID KIND (Default) */
	.isSolidKind {
		box-shadow: var(--shadow-surface-sm);
		color: var(--var-n=02);
		background: var(--n-05);
	}

	/* Solid + Default */
	.isSolidKind.isDefaultColor:not(:disabled):hover {
		box-shadow: var(--shadow-surface-md);
		color: var(--color-text-primary);
	}
	.isSolidKind.isDefaultColor:active,
	.isSolidKind.isDefaultColor.isActive {
		transform: translateY(1px);
		box-shadow: var(--shadow-inner-md);
		background: var(--color-surface-dim);
	}

	/* Solid + Accent (The Gradient Look) */
	.isSolidKind.isAccentColor {
		background: var(--gradient-active);
		color: white;
		box-shadow: 0px 4px 12px rgba(102, 126, 234, 0.4);
	}
	.isSolidKind.isAccentColor:not(:disabled):hover {
		filter: brightness(1.05);
		transform: translateY(-1px);
		box-shadow: 0px 6px 16px rgba(102, 126, 234, 0.5);
	}
	.isSolidKind.isAccentColor:active,
	.isSolidKind.isAccentColor.isActive {
		transform: translateY(1px);
		filter: brightness(0.95);
		box-shadow: inset 0px 2px 4px rgba(0, 0, 0, 0.2);
	}

	/* Solid + Danger */
	.isSolidKind.isDangerColor {
		background: #ff5a5f;
		color: white;
	}

	/* 2. GHOST KIND (No Background, Text Only) */
	.isGhostKind {
		background: transparent;
		box-shadow: none;
		color: var(--color-text-secondary);
	}
	.isGhostKind:hover {
		background: rgba(0, 0, 0, 0.03);
		color: var(--color-text-primary);
	}

	/* --------------------------
     STATES
  --------------------------- */
	.button-base:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none !important;
		box-shadow: none !important;
	}

	.spinner {
		width: 1em;
		height: 1em;
		border: 2px solid currentColor;
		border-right-color: transparent;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
