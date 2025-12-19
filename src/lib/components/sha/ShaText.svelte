<script lang="ts">
	import type { Snippet } from 'svelte'

	type PropsT = {
		children: Snippet

		// Configuration
		tag?: 'p' | 'span' | 'div' | 'label'
		size?: 'xs' | 'sm' | 'base' | 'lg'
		color?: 'default' | 'secondary' | 'accent' | 'danger'
		weight?: 'regular' | 'medium' | 'bold'

		// Boolean States
		isMono?: boolean // Swaps to monospace font
		isItalic?: boolean
		isTruncated?: boolean // Adds ellipsis...

		class?: string
	}

	let {
		children,
		tag = 'p',
		size = 'base',
		color = 'default',
		weight = 'regular',
		isMono = false,
		isItalic = false,
		isTruncated = false,
		class: className = ''
	}: PropsT = $props()

	function getClasses() {
		return [
			'text-base',
			// Size Maps
			size === 'xs' ? 'isXsSize' : size === 'sm' ? 'isSmSize' : size === 'lg' ? 'isLgSize' : 'isBaseSize',
			// Color Maps
			color === 'secondary'
				? 'isSecondaryColor'
				: color === 'accent'
					? 'isAccentColor'
					: color === 'danger'
						? 'isDangerColor'
						: 'isDefaultColor',
			// Weight Maps
			weight === 'medium' ? 'isMediumWeight' : weight === 'bold' ? 'isBoldWeight' : 'isRegularWeight',
			// Booleans
			isMono && 'isMono',
			isItalic && 'isItalic',
			isTruncated && 'isTruncated',
			className
		]
			.filter(Boolean)
			.join(' ')
	}
</script>

<svelte:element this={tag} class={getClasses()}>
	{@render children()}
</svelte:element>

<style>
	.text-base {
		font-family: var(--font-sans);
		line-height: 1.5;
		margin: 0;
	}

	/* Sizes */
	.isXsSize {
		font-size: var(--font-size-xs);
		line-height: 1.4;
	}
	.isSmSize {
		font-size: var(--font-size-sm);
	}
	.isBaseSize {
		font-size: var(--font-size-base);
	}
	.isLgSize {
		font-size: var(--font-size-lg);
	}

	/* Weights */
	.isRegularWeight {
		font-weight: 400;
	}
	.isMediumWeight {
		font-weight: 500;
	}
	.isBoldWeight {
		font-weight: 600;
	}

	/* Colors */
	.isDefaultColor {
		color: var(--color-text-primary);
	}
	.isSecondaryColor {
		color: var(--color-text-secondary);
	}
	.isAccentColor {
		color: var(--a);
	}
	.isDangerColor {
		color: #ff5a5f;
	}

	/* Variants */
	.isMono {
		font-family: var(--font-mono);
		letter-spacing: -0.02em;
	}
	.isItalic {
		font-style: italic;
	}

	.isTruncated {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		display: block;
		max-width: 100%;
	}
</style>
