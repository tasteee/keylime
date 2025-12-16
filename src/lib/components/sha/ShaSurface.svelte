<script lang="ts">
	import type { Snippet } from 'svelte'

	type PropsT = {
		children?: Snippet

		// Configuration
		elevation?: 'flat' | 'low' | 'high' // Controls shadow depth
		texture?: 'solid' | 'glass' | 'transparent' // Controls background/blur

		// States
		isHoverable?: boolean
		isInteractive?: boolean

		// Automation
		class?: string
		tag?: string
	}

	let {
		children,
		elevation = 'low',
		texture = 'solid',
		isHoverable = false,
		isInteractive = false,
		class: className = '',
		tag = 'div'
	}: PropsT = $props()

	function getClasses() {
		return [
			'surface-base',
			// Config Maps
			elevation === 'flat' ? 'isFlatElevation' : elevation === 'high' ? 'isHighElevation' : 'isLowElevation',
			texture === 'glass' ? 'isGlassTexture' : texture === 'transparent' ? 'isTransparentTexture' : 'isSolidTexture',
			// Boolean States
			isHoverable && 'isHoverable',
			isInteractive && 'isInteractive',
			className
		]
			.filter(Boolean)
			.join(' ')
	}
</script>

<svelte:element this={tag} class={getClasses()}>
	{@render children?.()}
</svelte:element>

<style>
	.surface-base {
		position: relative;
		border-radius: var(--radius-md);
		transition:
			transform 0.2s ease,
			box-shadow 0.2s ease,
			background 0.2s;
		box-sizing: border-box;
		overflow: hidden;
	}

	/* Elevations */
	.isFlatElevation {
		box-shadow: none;
		border: 1px solid rgba(0, 0, 0, 0.05);
	}
	.isLowElevation {
		box-shadow: var(--shadow-surface-md);
		border: 1px solid rgba(255, 255, 255, 0.4);
	}
	.isHighElevation {
		box-shadow: var(--shadow-float-lg);
		border: 1px solid rgba(255, 255, 255, 0.6);
		z-index: 10;
	}

	/* Textures */
	.isSolidTexture {
		background: var(--color-surface-base);
	}
	.isGlassTexture {
		background: rgba(247, 248, 250, 0.75);
		backdrop-filter: blur(16px);
	}
	.isTransparentTexture {
		background: transparent;
	}

	/* States */
	.isHoverable:hover {
		transform: translateY(-4px);
		box-shadow: var(--shadow-float-lg); /* Elevate on hover */
	}

	.isInteractive {
		cursor: pointer;
	}
	.isInteractive:active {
		transform: scale(0.99);
		background: var(--color-surface-dim);
	}
</style>
